import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from backend.app.database.connection import engine, Base
from backend.app.router.endpoints import router as api_router

# Load configuration
load_dotenv()

# Automatically spin up database tables if they do not exist
# Note: For production architectures, migration runners like Alembic are preferred,
# but self-healing schema creation is ideal for serverless / developer spaces.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database tables could not be initialized on startup: {e}")

app = FastAPI(
    title="Agentic CV System Backend API",
    description="Services powering resume parsing, LangGraph matching engines, and tailored resume formatting.",
    version="1.0.0"
)

# Configure CORS middleware
# This is vital for local developer communication between the Next.js client and FastAPI server.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production environments, replace with specific domain mappings
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(api_router, prefix="/api")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "Agentic CV System Backend",
        "api_version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    # Default port set to 8000 for standard API interfaces
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
