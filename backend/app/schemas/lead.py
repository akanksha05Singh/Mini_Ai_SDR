from pydantic import BaseModel, EmailStr
from typing import Optional

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    company: str
    job_title: str
    email: EmailStr
    phone: Optional[str] = None

class LeadUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    company: Optional[str] = None
    job_title: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    score: Optional[int] = None
    qualification_reason: Optional[str] = None
    generated_email: Optional[str] = None

class LeadResponse(BaseModel):
    id: int
    first_name: str
    last_name: str
    company: str
    job_title: str
    email: str
    phone: Optional[str] = None
    status: str
    score: Optional[int] = None
    qualification_reason: Optional[str] = None
    generated_email: Optional[str] = None
    user_id: int

    class Config:
        from_attributes = True
