from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime

# Auth Schemas
class UserSyncSchema(BaseModel):
    id: UUID
    email: EmailStr
    name: Optional[str] = None

    class Config:
        from_attributes = True

# Profile Schemas
class ContactInfoSchema(BaseModel):
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    website: Optional[str] = None
    location: Optional[str] = None

class WorkExperienceBase(BaseModel):
    company: str
    role: str
    start_date: str
    end_date: Optional[str] = None
    bullet_points: List[str]
    meta: Optional[Dict[str, Any]] = None

class WorkExperienceCreate(WorkExperienceBase):
    pass

class WorkExperienceResponse(WorkExperienceBase):
    id: UUID
    master_profile_id: UUID

    class Config:
        from_attributes = True

class ProjectBase(BaseModel):
    title: str
    description: Optional[str] = None
    url: Optional[str] = None
    achievements: List[str]
    meta: Optional[Dict[str, Any]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectResponse(ProjectBase):
    id: UUID
    master_profile_id: UUID

    class Config:
        from_attributes = True

class EducationBase(BaseModel):
    school: str
    degree: str
    field_of_study: str
    grad_date: str

class EducationCreate(EducationBase):
    pass

class EducationResponse(EducationBase):
    id: UUID
    master_profile_id: UUID

    class Config:
        from_attributes = True

class MasterProfileBase(BaseModel):
    primary_title: Optional[str] = None
    contact_info: Optional[ContactInfoSchema] = None

class MasterProfileCreate(MasterProfileBase):
    pass

class MasterProfileUpdate(MasterProfileBase):
    experiences: Optional[List[WorkExperienceCreate]] = None
    projects: Optional[List[ProjectCreate]] = None
    education: Optional[List[EducationCreate]] = None

class MasterProfileResponse(MasterProfileBase):
    id: UUID
    user_id: UUID
    experiences: List[WorkExperienceResponse] = []
    projects: List[ProjectResponse] = []
    education: List[EducationResponse] = []
    updated_at: datetime

    class Config:
        from_attributes = True

# Ingest Schema
class ResumeIngestRequest(BaseModel):
    resume_text: str

# Generate CV Schema
class CVGenerateRequest(BaseModel):
    job_title: str
    job_description: str
    cv_template_id: Optional[UUID] = None

class CVGenerateResponse(BaseModel):
    application_id: UUID
    status: str
    tailored_cv_data: Dict[str, Any]
    cover_letter: str
    critic_score: int
    critic_feedback: str
    rendered_cv: Optional[str] = None
