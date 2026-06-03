import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Boolean, Text, Integer, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    master_profiles = relationship("MasterProfile", back_populates="user", cascade="all, delete-orphan")
    cv_templates = relationship("CvTemplate", back_populates="user", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")


class MasterProfile(Base):
    __tablename__ = "master_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    primary_title = Column(String, nullable=True)
    contact_info = Column(JSON, nullable=True, default=dict) # e.g. {"phone": ..., "website": ..., "linkedin": ...}
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="master_profiles")
    experiences = relationship("WorkExperience", back_populates="master_profile", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="master_profile", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="master_profile", cascade="all, delete-orphan")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    master_profile_id = Column(UUID(as_uuid=True), ForeignKey("master_profiles.id", ondelete="CASCADE"), nullable=False)
    company = Column(String, nullable=False)
    role = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=True) # e.g., "Present" or date
    bullet_points = Column(JSON, nullable=False, default=list) # Array of strings
    meta = Column(JSON, nullable=True, default=dict) # e.g. {"tech_stack": [...], "keywords": [...]}

    # Relationships
    master_profile = relationship("MasterProfile", back_populates="experiences")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    master_profile_id = Column(UUID(as_uuid=True), ForeignKey("master_profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    url = Column(String, nullable=True)
    achievements = Column(JSON, nullable=False, default=list) # Array of strings
    meta = Column(JSON, nullable=True, default=dict) # e.g. {"tech_stack": [...]}

    # Relationships
    master_profile = relationship("MasterProfile", back_populates="projects")


class Education(Base):
    __tablename__ = "education"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    master_profile_id = Column(UUID(as_uuid=True), ForeignKey("master_profiles.id", ondelete="CASCADE"), nullable=False)
    school = Column(String, nullable=False)
    degree = Column(String, nullable=False)
    field_of_study = Column(String, nullable=False)
    grad_date = Column(String, nullable=False)

    # Relationships
    master_profile = relationship("MasterProfile", back_populates="education")


class CvTemplate(Base):
    __tablename__ = "cv_templates"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True) # Nullable for public templates
    name = Column(String, nullable=False)
    template_source = Column(Text, nullable=False) # Jinja2 HTML containing placeholders
    engine = Column(String, default="jinja2")
    is_public = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="cv_templates")
    applications = relationship("Application", back_populates="cv_template")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    url = Column(String, nullable=True)
    company = Column(String, nullable=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    parsed_requirements = Column(JSON, nullable=True, default=dict)

    # Relationships
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    cv_template_id = Column(UUID(as_uuid=True), ForeignKey("cv_templates.id", ondelete="SET NULL"), nullable=True)
    tailored_cv_data = Column(JSON, nullable=True) # Tailored structured experience data
    compiled_html = Column(Text, nullable=True) # Rich styled HTML output
    cover_letter = Column(Text, nullable=True)
    status = Column(String, default="draft") # draft, ready, sent, rejected, interview
    applied_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    cv_template = relationship("CvTemplate", back_populates="applications")
    logs = relationship("AgentLog", back_populates="application", cascade="all, delete-orphan")


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    application_id = Column(UUID(as_uuid=True), ForeignKey("applications.id", ondelete="CASCADE"), nullable=False)
    node_name = Column(String, nullable=False)
    input_state = Column(JSON, nullable=True)
    output_state = Column(JSON, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    # Relationships
    application = relationship("Application", back_populates="logs")
