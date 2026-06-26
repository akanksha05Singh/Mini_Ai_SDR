import sys
import os

# Adjust paths to import app
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def run_checks():
    print("=== STARTING BACKEND VERIFICATION CHECKS ===")
    
    # 1. Check imports
    try:
        print("[1/5] Checking core package imports...")
        import fastapi
        import sqlalchemy
        import pydantic
        import jwt
        import passlib
        import openai
        import google.generativeai
        import langgraph
        print("[OK] All third-party packages imported successfully.")
    except ImportError as e:
        print(f"[FAIL] Import check failed: {str(e)}")
        sys.exit(1)
        
    # 2. Check app core settings loading
    try:
        print("[2/5] Checking environment settings loading...")
        from app.core.config import settings
        db_suffix = settings.DATABASE_URL.split('@')[-1] if '@' in settings.DATABASE_URL else settings.DATABASE_URL
        print(f"[OK] Configuration loaded. Database URL target: {db_suffix}")
    except Exception as e:
        print(f"[FAIL] Settings parsing failed: {str(e)}")
        sys.exit(1)

    # 3. Check SQLAlchemy models mapping
    try:
        print("[3/5] Inspecting database models...")
        from app.models.lead import User, Lead
        from app.db.base import Base
        print(f"[OK] DB Models mapped successfully. Tables: {list(Base.metadata.tables.keys())}")
    except Exception as e:
        print(f"[FAIL] Model mapping failed: {str(e)}")
        sys.exit(1)

    # 4. Check LangGraph Orchestration graph compilation
    try:
        print("[4/5] Checking LangGraph agent compilation...")
        from app.services.agent_service import compiled_agent
        # Get graph node structures
        nodes = list(compiled_agent.get_graph().nodes.keys())
        print(f"[OK] LangGraph state graph compiled successfully. Nodes in workflow: {nodes}")
    except Exception as e:
        print(f"[FAIL] LangGraph agent loading failed: {str(e)}")
        sys.exit(1)

    # 5. Check FastAPI application routing
    try:
        print("[5/5] Loading FastAPI main application entrypoint...")
        from main import app
        
        routes = []
        for r in app.routes:
            if hasattr(r, "path"):
                routes.append(r.path)
            elif hasattr(r, "name"):
                routes.append(r.name)
            else:
                routes.append(type(r).__name__)
                
        print(f"[OK] FastAPI app instantiated. Registered endpoints: {routes}")
    except Exception as e:
        print(f"[FAIL] FastAPI main load failed: {str(e)}")
        sys.exit(1)

    print("\n=== ALL BACKEND COMPILATION & SCHEMA CHECKS PASSED SUCCESSFULLY ===")

if __name__ == "__main__":
    run_checks()
