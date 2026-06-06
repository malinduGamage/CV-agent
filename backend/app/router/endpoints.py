import json
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from uuid import UUID
from datetime import datetime

from langchain_core.messages import SystemMessage, HumanMessage
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, MasterProfile, WorkExperience, Project, Education,
    CvTemplate, Job, Application, AgentLog
)
from backend.app.router.auth import get_current_user
from backend.app.schemas import (
    MasterProfileResponse, MasterProfileUpdate, ResumeIngestRequest,
    CVGenerateRequest, CVGenerateResponse
)
from backend.app.agents.nodes import llm
from backend.app.agents.utils import extract_json
from backend.app.agents.graph import tailor_graph

router = APIRouter()

@router.get("/profile", response_model=MasterProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the current user's master profile, including work experiences, projects, and education.
    """
    profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
    
    if not profile:
        # Create an empty profile if none exists
        profile = MasterProfile(user_id=current_user.id, primary_title="", contact_info={})
        db.add(profile)
        db.commit()
        db.refresh(profile)
        
    return profile


@router.put("/profile", response_model=MasterProfileResponse)
def update_profile(
    profile_data: MasterProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update the user's master profile. Overwrites experiences, projects, and education.
    """
    profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
    if not profile:
        profile = MasterProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Update basic profile info
    if profile_data.primary_title is not None:
        profile.primary_title = profile_data.primary_title
    if profile_data.contact_info is not None:
        profile.contact_info = profile_data.contact_info.dict()

    # Clear and replace experiences
    db.query(WorkExperience).filter(WorkExperience.master_profile_id == profile.id).delete()
    if profile_data.experiences:
        for exp in profile_data.experiences:
            new_exp = WorkExperience(
                master_profile_id=profile.id,
                company=exp.company,
                role=exp.role,
                start_date=exp.start_date,
                end_date=exp.end_date,
                bullet_points=exp.bullet_points,
                meta=exp.meta or {}
            )
            db.add(new_exp)

    # Clear and replace projects
    db.query(Project).filter(Project.master_profile_id == profile.id).delete()
    if profile_data.projects:
        for proj in profile_data.projects:
            new_proj = Project(
                master_profile_id=profile.id,
                title=proj.title,
                description=proj.description,
                url=proj.url,
                achievements=proj.achievements,
                meta=proj.meta or {}
            )
            db.add(new_proj)

    # Clear and replace education
    db.query(Education).filter(Education.master_profile_id == profile.id).delete()
    if profile_data.education:
        for edu in profile_data.education:
            new_edu = Education(
                master_profile_id=profile.id,
                school=edu.school,
                degree=edu.degree,
                field_of_study=edu.field_of_study,
                grad_date=edu.grad_date
            )
            db.add(new_edu)

    try:
        db.commit()
        db.refresh(profile)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database update failed: {str(e)}"
        )
        
    return profile


@router.post("/ingest-resume", response_model=MasterProfileResponse)
def ingest_resume(
    payload: ResumeIngestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses a raw text resume using Gemini Flash and populates the master profile database tables.
    """
    system_prompt = (
        "You are an expert resume parsing agent. Your task is to take raw resume text and extract "
        "structured information matching the database schema. Format your output strictly as a JSON object:\n"
        "{\n"
        "  \"primary_title\": \"string (e.g. Senior Software Engineer)\",\n"
        "  \"contact_info\": {\n"
        "     \"phone\": \"string\",\n"
        "     \"linkedin\": \"string\",\n"
        "     \"github\": \"string\",\n"
        "     \"website\": \"string\",\n"
        "     \"location\": \"string\"\n"
        "  },\n"
        "  \"experiences\": [\n"
        "     {\n"
        "       \"company\": \"string\",\n"
        "       \"role\": \"string\",\n"
        "       \"start_date\": \"string (e.g. Jan 2020)\",\n"
        "       \"end_date\": \"string (e.g. Present or Dec 2023)\",\n"
        "       \"bullet_points\": [\"string\"]\n"
        "     }\n"
        "  ],\n"
        "  \"projects\": [\n"
        "     {\n"
        "       \"title\": \"string\",\n"
        "       \"description\": \"string\",\n"
        "       \"url\": \"string\",\n"
        "       \"achievements\": [\"string\"]\n"
        "     }\n"
        "  ],\n"
        "  \"education\": [\n"
        "     {\n"
        "       \"school\": \"string\",\n"
        "       \"degree\": \"string\",\n"
        "       \"field_of_study\": \"string\",\n"
        "       \"grad_date\": \"string\"\n"
        "     }\n"
        "  ]\n"
        "}\n"
        "Return ONLY valid JSON. Do not write explanations."
    )
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=payload.resume_text)
    ])
    
    try:
        parsed_profile = extract_json(response.content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Gemini failed to parse the resume into structured JSON: {str(e)}"
        )

    # Sync parsed profile to DB
    profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
    if not profile:
        profile = MasterProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    # Update basic metadata
    profile.primary_title = parsed_profile.get("primary_title", "")
    profile.contact_info = parsed_profile.get("contact_info", {})

    # Clear and replace experiences
    db.query(WorkExperience).filter(WorkExperience.master_profile_id == profile.id).delete()
    for exp in parsed_profile.get("experiences", []):
        new_exp = WorkExperience(
            master_profile_id=profile.id,
            company=exp.get("company", "Unknown"),
            role=exp.get("role", "Unknown"),
            start_date=exp.get("start_date", ""),
            end_date=exp.get("end_date", ""),
            bullet_points=exp.get("bullet_points", []),
            metadata={}
        )
        db.add(new_exp)

    # Clear and replace projects
    db.query(Project).filter(Project.master_profile_id == profile.id).delete()
    for proj in parsed_profile.get("projects", []):
        new_proj = Project(
            master_profile_id=profile.id,
            title=proj.get("title", "Unknown Project"),
            description=proj.get("description", ""),
            url=proj.get("url", ""),
            achievements=proj.get("achievements", []),
            metadata={}
        )
        db.add(new_proj)

    # Clear and replace education
    db.query(Education).filter(Education.master_profile_id == profile.id).delete()
    for edu in parsed_profile.get("education", []):
        new_edu = Education(
            master_profile_id=profile.id,
            school=edu.get("school", "Unknown"),
            degree=edu.get("degree", ""),
            field_of_study=edu.get("field_of_study", ""),
            grad_date=edu.get("grad_date", "")
        )
        db.add(new_edu)

    try:
        db.commit()
        db.refresh(profile)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save parsed profile: {str(e)}"
        )
        
    return profile


@router.post("/generate-cv", response_model=CVGenerateResponse)
def generate_cv(
    req: CVGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Triggers the LangGraph agent graph to tailor the CV for the job.
    Saves Job, Application, and AgentLog records.
    """
    # 1. Fetch user's master profile
    profile = db.query(MasterProfile).filter(MasterProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Please build/ingest a Master Profile before tailoring."
        )

    # Serialize profile for graph state
    profile_data = {
        "primary_title": profile.primary_title,
        "contact_info": profile.contact_info,
        "experiences": [
            {
                "id": str(exp.id),
                "company": exp.company,
                "role": exp.role,
                "start_date": exp.start_date,
                "end_date": exp.end_date,
                "bullet_points": exp.bullet_points,
                "meta": exp.meta
            } for exp in profile.experiences
        ],
        "projects": [
            {
                "id": str(proj.id),
                "title": proj.title,
                "description": proj.description,
                "url": proj.url,
                "achievements": proj.achievements,
                "meta": proj.meta
            } for proj in profile.projects
        ],
        "education": [
            {
                "id": str(edu.id),
                "school": edu.school,
                "degree": edu.degree,
                "field_of_study": edu.field_of_study,
                "grad_date": edu.grad_date
            } for edu in profile.education
        ]
    }

    # 2. Record target Job
    job = Job(
        title=req.job_title,
        company="Unknown",
        description=req.job_description,
        parsed_requirements={}
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    # 3. Compile/Select template
    template_id = req.cv_template_id
    if not template_id:
        # Fallback to the first available or default template
        template = db.query(CvTemplate).filter(
            (CvTemplate.user_id == current_user.id) | (CvTemplate.is_public == True)
        ).first()
        if not template:
            # Seed a default basic template source
            template = CvTemplate(
                name="Minimalist Template",
                template_source=(
                    "# {{ primary_title }}\n\n"
                    "## Contact\n"
                    "{% for key, val in contact_info.items() %}"
                    "**{{ key | capitalize }}**: {{ val }} | "
                    "{% endfor %}\n\n"
                    "## Professional Experience\n"
                    "{% for exp in experiences %}"
                    "### {{ exp.role }} - {{ exp.company }} ({{ exp.start_date }} - {{ exp.end_date }})\n"
                    "{% for bullet in exp.bullet_points %}"
                    "- {{ bullet }}\n"
                    "{% endfor %}\n"
                    "{% endfor %}\n\n"
                    "## Projects\n"
                    "{% for proj in projects %}"
                    "### {{ proj.title }}\n"
                    "{% for ach in proj.achievements %}"
                    "- {{ ach }}\n"
                    "{% endfor %}\n"
                    "{% endfor %}\n\n"
                    "## Education\n"
                    "{% for edu in education %}"
                    "**{{ edu.school }}** - {{ edu.degree }} in {{ edu.field_of_study }} (Graduated: {{ edu.grad_date }})\n"
                    "{% endfor %}"
                ),
                engine="jinja2",
                is_public=True
            )
            db.add(template)
            db.commit()
            db.refresh(template)
        template_id = template.id

    # 4. Initialize State Graph inputs
    initial_state = {
        "job_title": req.job_title,
        "job_description": req.job_description,
        "master_profile": profile_data,
        "job_requirements": {},
        "selected_experience_ids": [],
        "selected_project_ids": [],
        "tailored_cv_data": {},
        "cover_letter": "",
        "critic_score": 0,
        "critic_feedback": "",
        "iterations": 0
    }

    # 5. Run LangGraph Workflow
    start_time = datetime.utcnow()
    try:
        final_state = tailor_graph.invoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agent workflow invocation failed: {str(e)}"
        )
    execution_time_ms = int((datetime.utcnow() - start_time).total_seconds() * 1000)

    # 6. Save job requirements update
    job.parsed_requirements = final_state.get("job_requirements", {})
    db.add(job)

    # 7. Create Application entry
    application = Application(
        user_id=current_user.id,
        job_id=job.id,
        cv_template_id=template_id,
        tailored_cv_data=final_state.get("tailored_cv_data", {}),
        cover_letter=final_state.get("cover_letter", ""),
        status="draft",
        applied_at=datetime.utcnow()
    )
    db.add(application)
    db.commit()
    db.refresh(application)

    # 8. Record Agent Execution Log
    log = AgentLog(
        application_id=application.id,
        node_name="LangGraph Orchestrator Loop",
        input_state=initial_state,
        output_state={
            "job_requirements": final_state.get("job_requirements"),
            "selected_experience_ids": final_state.get("selected_experience_ids"),
            "selected_project_ids": final_state.get("selected_project_ids"),
            "critic_score": final_state.get("critic_score"),
            "critic_feedback": final_state.get("critic_feedback"),
            "iterations": final_state.get("iterations")
        },
        execution_time_ms=execution_time_ms,
        timestamp=datetime.utcnow()
    )
    db.add(log)
    db.commit()

    return {
        "application_id": application.id,
        "status": application.status,
        "tailored_cv_data": application.tailored_cv_data,
        "cover_letter": application.cover_letter,
        "critic_score": final_state.get("critic_score", 0),
        "critic_feedback": final_state.get("critic_feedback", "")
    }


@router.get("/applications", response_model=List[Dict[str, Any]])
def list_applications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    List all job application tailors for the current user.
    """
    apps = db.query(Application).filter(Application.user_id == current_user.id).order_init_by = Application.applied_at.desc()
    # Simple order manually since sqlalchemy order_by syntax requires correct syntax
    apps = db.query(Application).filter(Application.user_id == current_user.id).order_by(Application.applied_at.desc()).all()
    
    result = []
    for app in apps:
        result.append({
            "id": app.id,
            "job_title": app.job.title,
            "company": app.job.company,
            "status": app.status,
            "applied_at": app.applied_at
        })
    return result


@router.get("/applications/{app_id}")
def get_application(
    app_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed tailored CV data and cover letter for a specific application.
    """
    app = db.query(Application).filter(
        Application.id == app_id,
        Application.user_id == current_user.id
    ).first()
    
    if not app:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application tailor record not found."
        )

    # Get the latest critic evaluation log if available
    latest_log = db.query(AgentLog).filter(AgentLog.application_id == app.id).order_by(AgentLog.timestamp.desc()).first()
    critic_score = 85
    critic_feedback = ""
    if latest_log and latest_log.output_state:
        critic_score = latest_log.output_state.get("critic_score", 85)
        critic_feedback = latest_log.output_state.get("critic_feedback", "")

    return {
        "id": app.id,
        "job": {
            "title": app.job.title,
            "company": app.job.company,
            "description": app.job.description,
            "parsed_requirements": app.job.parsed_requirements
        },
        "tailored_cv_data": app.tailored_cv_data,
        "cover_letter": app.cover_letter,
        "status": app.status,
        "applied_at": app.applied_at,
        "critic_score": critic_score,
        "critic_feedback": critic_feedback
    }
