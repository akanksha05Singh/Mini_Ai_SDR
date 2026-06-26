from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.db.session import get_db
from app.models.lead import User, Lead
from app.schemas.lead import LeadCreate, LeadResponse, LeadUpdate
from app.core.security import get_current_user
from app.services.agent_service import run_lead_agent

router = APIRouter(prefix="/leads", tags=["leads"])

@router.get("", response_model=List[LeadResponse])
async def get_leads(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieves all lead records associated with the currently authenticated user.
    """
    stmt = select(Lead).filter(Lead.user_id == current_user.id).order_by(Lead.id.desc())
    result = await db.execute(stmt)
    leads = result.scalars().all()
    return leads

@router.post("", response_model=LeadResponse, status_code=status.HTTP_201_CREATED)
async def create_lead(
    lead_in: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new lead profile and assigns it to the authenticated user.
    New leads start with status 'New' and score NULL.
    """
    new_lead = Lead(
        first_name=lead_in.first_name,
        last_name=lead_in.last_name,
        company=lead_in.company,
        job_title=lead_in.job_title,
        email=lead_in.email,
        phone=lead_in.phone,
        status="New",
        score=None,
        qualification_reason=None,
        generated_email=None,
        user_id=current_user.id
    )
    
    db.add(new_lead)
    await db.commit()
    await db.refresh(new_lead)
    return new_lead

@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_in: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates the profile attributes of an existing lead.
    """
    stmt = select(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id)
    result = await db.execute(stmt)
    lead = result.scalars().first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead was not found or does not belong to your account."
        )
    
    # Extract only sent fields to update
    update_data = lead_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(lead, field, value)
        
    await db.commit()
    await db.refresh(lead)
    return lead

@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Removes a lead record from the database.
    """
    stmt = select(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id)
    result = await db.execute(stmt)
    lead = result.scalars().first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead was not found or does not belong to your account."
        )
        
    await db.delete(lead)
    await db.commit()
    return None

@router.post("/{lead_id}/qualify", response_model=LeadResponse)
async def qualify_lead(
    lead_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Triggers the LangGraph Orchestrator to score the lead and generate custom email outreach.
    Updates lead details including: score, status (Qualified/Disqualified), qualification_reason,
    and generated_email.
    """
    # Fetch lead and check ownership
    stmt = select(Lead).filter(Lead.id == lead_id, Lead.user_id == current_user.id)
    result = await db.execute(stmt)
    lead = result.scalars().first()
    
    if not lead:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="The requested lead was not found or does not belong to your account."
        )

    # Build input payload for the LangGraph agent
    lead_data = {
        "first_name": lead.first_name,
        "last_name": lead.last_name,
        "company": lead.company,
        "job_title": lead.job_title,
        "email": lead.email,
        "phone": lead.phone
    }

    try:
        # Run agent workflow
        agent_result = await run_lead_agent(lead_data)
        
        # Extract variables returned by LangGraph
        lead.score = agent_result.get("score")
        lead.qualification_reason = agent_result.get("qualification_reason")
        lead.generated_email = agent_result.get("generated_email")
        lead.status = agent_result.get("status", "New")
        
        # Save updates to DB
        await db.commit()
        await db.refresh(lead)
        
        return lead

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph qualification orchestrator failed: {str(e)}"
        )
