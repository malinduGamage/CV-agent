from typing import List, Dict, Any, TypedDict

class AgentState(TypedDict):
    # Inputs
    job_title: str
    job_description: str
    master_profile: Dict[str, Any] # Contains primary_title, contact_info, experiences, projects, education
    
    # Inferences / Selection
    job_requirements: Dict[str, Any] # E.g., {"skills": [...], "keywords": [...], "responsibilities": [...]}
    selected_experience_ids: List[str]
    selected_project_ids: List[str]
    
    # Target Outputs
    tailored_cv_data: Dict[str, Any] # Structured database JSON representation of experiences/projects/skills
    cover_letter: str
    
    # Validation Loop
    critic_score: int
    critic_feedback: str
    iterations: int
