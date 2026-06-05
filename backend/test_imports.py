import sys
import os

# Add root folder to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

print("Verifying backend module imports...")

try:
    from backend.app.database.connection import get_db, engine, Base
    print("OK: Database connections and Base imported successfully.")
except Exception as e:
    print(f"ERROR: Failed database imports: {e}")
    sys.exit(1)

try:
    from backend.app.database.models import User, MasterProfile, WorkExperience, Project, Education, CvTemplate, Job, Application, AgentLog
    print("OK: Database SQLAlchemy models imported successfully.")
except Exception as e:
    print(f"ERROR: Failed model imports: {e}")
    sys.exit(1)

try:
    from backend.app.schemas import MasterProfileResponse, ResumeIngestRequest, CVGenerateRequest, CVGenerateResponse
    print("OK: Pydantic validation schemas imported successfully.")
except Exception as e:
    print(f"ERROR: Failed schemas imports: {e}")
    sys.exit(1)

try:
    from backend.app.router.auth import verify_supabase_jwt, get_current_user
    print("OK: Auth validation middleware imported successfully.")
except Exception as e:
    print(f"ERROR: Failed auth imports: {e}")
    sys.exit(1)

try:
    from backend.app.agents.state import AgentState
    from backend.app.agents.utils import extract_json
    from backend.app.agents.nodes import research_node, filter_node, tailor_node, critic_node
    from backend.app.agents.graph import tailor_graph
    print("OK: LangGraph Agent States, Nodes, and Graph compiled and imported successfully.")
except Exception as e:
    print(f"ERROR: Failed agents imports: {e}")
    sys.exit(1)

try:
    from backend.app.main import app
    print("OK: FastAPI main app instance loaded successfully.")
except Exception as e:
    print(f"ERROR: Failed app main imports: {e}")
    sys.exit(1)

print("\nAll modules compile and load successfully!")
