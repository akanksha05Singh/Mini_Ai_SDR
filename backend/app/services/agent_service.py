from typing import TypedDict, Optional, Any
from langgraph.graph import StateGraph, END

from app.services.openai_service import score_lead
from app.services.gemini_service import generate_cold_email

# Define the state schema for our agent
class AgentState(TypedDict):
    first_name: str
    last_name: str
    company: str
    job_title: str
    email: str
    phone: Optional[str]
    score: Optional[int]
    qualification_reason: Optional[str]
    generated_email: Optional[str]
    status: str

# Node 1: Evaluate the lead using OpenAI service
async def evaluate_lead_node(state: AgentState) -> dict:
    """Evaluates the lead profile using the OpenAI scoring helper."""
    result = await score_lead(
        first_name=state["first_name"],
        last_name=state["last_name"],
        company=state["company"],
        job_title=state["job_title"],
        email=state["email"],
        phone=state.get("phone")
    )
    return {
        "score": result["score"],
        "qualification_reason": result["reason"]
    }

# Conditional Router Function
def should_qualify(state: AgentState) -> str:
    """Determines whether to disqualify the lead or proceed to drafting an email."""
    score = state.get("score")
    if score is not None and score < 30:
        return "disqualify"
    return "draft"

# Node 2: Disqualify the lead
async def disqualify_lead_node(state: AgentState) -> dict:
    """Marks the lead status as Disqualified and skips email generation."""
    return {
        "status": "Disqualified",
        "generated_email": None
    }

# Node 3: Draft personalized email using Gemini
async def draft_email_node(state: AgentState) -> dict:
    """Generates the outbound cold email for qualified leads."""
    email_text = await generate_cold_email(
        first_name=state["first_name"],
        last_name=state["last_name"],
        company=state["company"],
        job_title=state["job_title"],
        score=state.get("score", 50),
        reason=state.get("qualification_reason", "")
    )
    return {
        "status": "Qualified",
        "generated_email": email_text
    }

# Construct the StateGraph
workflow = StateGraph(AgentState)

# Add our workflow nodes
workflow.add_node("evaluate_lead", evaluate_lead_node)
workflow.add_node("disqualify_lead", disqualify_lead_node)
workflow.add_node("draft_email", draft_email_node)

# Define transitions
workflow.set_entry_point("evaluate_lead")

# Route conditionally based on score
workflow.add_conditional_edges(
    "evaluate_lead",
    should_qualify,
    {
        "disqualify": "disqualify_lead",
        "draft": "draft_email"
    }
)

# Mark endpoints
workflow.add_edge("disqualify_lead", END)
workflow.add_edge("draft_email", END)

# Compile graph
compiled_agent = workflow.compile()

async def run_lead_agent(lead_data: dict) -> dict:
    """
    Orchestrates the entire lead evaluation workflow using the compiled LangGraph.
    Accepts lead input data and returns the final updated state dictionary.
    """
    initial_state = {
        "first_name": lead_data["first_name"],
        "last_name": lead_data["last_name"],
        "company": lead_data["company"],
        "job_title": lead_data["job_title"],
        "email": lead_data["email"],
        "phone": lead_data.get("phone"),
        "score": None,
        "qualification_reason": None,
        "generated_email": None,
        "status": "New"
    }
    
    # Execute graph asynchronously
    final_state = await compiled_agent.ainvoke(initial_state)
    return final_state
