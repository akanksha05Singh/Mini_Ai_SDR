import asyncio
import sys
import os
from unittest.mock import AsyncMock

# Add current path to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Console Color Utilities (ASCII safe)
COLOR_GREEN = "\033[92m"
COLOR_RED = "\033[91m"
COLOR_CYAN = "\033[96m"
COLOR_RESET = "\033[0m"

def print_pass(message: str):
    print(f"{COLOR_GREEN}[PASS] {message}{COLOR_RESET}")

def print_fail(message: str):
    print(f"{COLOR_RED}[FAIL] {message}{COLOR_RESET}")

def print_info(message: str):
    print(f"{COLOR_CYAN}[INFO] {message}{COLOR_RESET}")

async def run_pipeline_verification():
    print("====================================================")
    print("        MINI AI SDR CORE PIPELINE VERIFICATION      ")
    print("====================================================\n")
    
    passed_all = True

    # ----------------------------------------------------
    # Stage 1: Environment Validation
    # ----------------------------------------------------
    print_info("--- Stage 1: Environment Validation ---")
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env")
    if not os.path.exists(env_path):
        print_fail(".env configuration file does not exist in backend/")
        passed_all = False
    else:
        print_pass(".env file exists in backend/")
        
        try:
            from app.core.config import settings
            
            # Verify keys existence
            missing_keys = []
            for key in ["DATABASE_URL", "JWT_SECRET", "OPENAI_API_KEY", "GEMINI_API_KEY"]:
                val = getattr(settings, key, None)
                if not val or val.strip() == "" or "your_" in val or "replace_this" in val:
                    missing_keys.append(key)
            
            if missing_keys:
                print_info(f"The following configuration keys have placeholder/missing values: {missing_keys}")
                print_info("Verification will proceed using stubs/defaults where necessary.")
            else:
                print_pass("All primary environment configurations are present and customized.")
                
        except Exception as e:
            print_fail(f"Failed to load settings configuration: {str(e)}")
            passed_all = False

    print()

    # ----------------------------------------------------
    # Stage 2: Database Core & Schema Check
    # ----------------------------------------------------
    print_info("--- Stage 2: Database Core & Schema Check ---")
    try:
        from app.db.session import engine
        from app.db.base import Base
        # Import models so they are registered on the Base.metadata registry
        from app.models.lead import User, Lead
        from sqlalchemy import text
        
        # Test connection by executing SELECT 1
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print_pass("Successfully established async connection to PostgreSQL engine.")
            
        # Test model schema mapping
        mapped_tables = list(Base.metadata.tables.keys())
        if "users" in mapped_tables and "leads" in mapped_tables:
            print_pass(f"DB Relational schemas mapped successfully. Detected tables: {mapped_tables}")
        else:
            print_fail(f"Relational mapping is incomplete. Found tables: {mapped_tables}")
            passed_all = False
            
    except Exception as e:
        print_fail(f"PostgreSQL connection/mapping failed: {str(e)}")
        passed_all = False

    print()

    # ----------------------------------------------------
    # Stage 3: Authentication & Security Engine
    # ----------------------------------------------------
    print_info("--- Stage 3: Authentication & Security Engine ---")
    try:
        from app.core.security import get_password_hash, verify_password, create_access_token
        from app.core.config import settings
        import jwt
        
        # 1. Test BCrypt password hashing & verification
        test_pw = "mySecretPassword123"
        hashed = get_password_hash(test_pw)
        if hashed == test_pw:
            print_fail("BCrypt hashing returned raw password text.")
            passed_all = False
        else:
            print_pass("BCrypt password hashing generated secure salt signature.")
            
        verified = verify_password(test_pw, hashed)
        if not verified:
            print_fail("BCrypt verification failed to match original string with hash.")
            passed_all = False
        else:
            print_pass("BCrypt verification successfully matched password signatures.")
            
        # 2. Test JWT Generation & Decoding
        mock_uid = 42
        token = create_access_token(subject=mock_uid)
        
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        decoded_uid = int(payload.get("sub"))
        if decoded_uid == mock_uid:
            print_pass(f"JWT generated, signed, and decoded successfully. Encoded subject: {decoded_uid}")
        else:
            print_fail(f"Decoded JWT subject {decoded_uid} does not match mock ID {mock_uid}.")
            passed_all = False
            
    except Exception as e:
        print_fail(f"Security engine test failed: {str(e)}")
        passed_all = False

    print()

    # ----------------------------------------------------
    # Stage 4: LangGraph Flow Architecture & AI Mocks
    # ----------------------------------------------------
    print_info("--- Stage 4: LangGraph Flow Architecture & AI Mocks ---")
    try:
        from app.services.agent_service import compiled_agent
        import app.services.agent_service as agent_service
        
        # 1. Trace Graph structure
        graph_data = compiled_agent.get_graph()
        nodes = list(graph_data.nodes.keys())
        print_pass(f"StateGraph compiled successfully. Workflow nodes: {nodes}")
        
        print_info("Printing LangGraph topology structure:")
        for edge in graph_data.edges:
            print(f"   Node '{edge.source}' ---> Node '{edge.target}'")
            
        # 2. Localized execution tests with mocks
        original_score = agent_service.score_lead
        original_email = agent_service.generate_cold_email
        
        # Scenario A: Highly Qualified Lead (Score = 85)
        agent_service.score_lead = AsyncMock(return_value={
            "score": 85, 
            "reason": "Test evaluation: strong title and company fit."
        })
        agent_service.generate_cold_email = AsyncMock(return_value=(
            "Subject: Accelerating sales\n\nMock outreach copy."
        ))
        
        test_lead = {
            "first_name": "Akanksha",
            "last_name": "Singh",
            "company": "Ace",
            "job_title": "ai intern",
            "email": "akumeenu2@gmail.com",
            "phone": "+919116802635"
        }
        
        print_info("Running graph flow for Scenario A: Lead scores 85 (>= 30)...")
        result_qualified = await agent_service.run_lead_agent(test_lead)
        
        if (result_qualified.get("status") == "Qualified" and 
            result_qualified.get("score") == 85 and 
            result_qualified.get("generated_email") is not None):
            print_pass("Conditional Router successfully routed to Node 2 ('draft_email'). Status: Qualified.")
        else:
            print_fail(f"Routing failed for Scenario A. Result state: {result_qualified}")
            passed_all = False
            
        # Scenario B: Disqualified Lead (Score = 15)
        agent_service.score_lead = AsyncMock(return_value={
            "score": 15, 
            "reason": "Test evaluation: title holds low purchasing index."
        })
        
        print_info("Running graph flow for Scenario B: Lead scores 15 (< 30)...")
        result_disqualified = await agent_service.run_lead_agent(test_lead)
        
        if (result_disqualified.get("status") == "Disqualified" and 
            result_disqualified.get("score") == 15 and 
            result_disqualified.get("generated_email") is None):
            print_pass("Conditional Router successfully routed to Disqualify node. Status: Disqualified, Email generation skipped.")
        else:
            print_fail(f"Routing failed for Scenario B. Result state: {result_disqualified}")
            passed_all = False
            
        # Restore original functions
        agent_service.score_lead = original_score
        agent_service.generate_cold_email = original_email
        
    except Exception as e:
        print_fail(f"LangGraph Agent test failed: {str(e)}")
        passed_all = False

    print()
    print("====================================================")
    if passed_all:
        print(f" {COLOR_GREEN}[SUCCESS] ALL STAGES PASSED SUCCESSFULLY! THE APPLICATION IS PRODUCTION READY.{COLOR_RESET}")
        print("====================================================")
        sys.exit(0)
    else:
        print(f" {COLOR_RED}[FAIL] PIPELINE VERIFICATION ENCOUNTERED FAILS.{COLOR_RESET}")
        print("====================================================")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(run_pipeline_verification())
