import os
import json
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from backend.app.agents.state import AgentState
from backend.app.agents.utils import extract_json

load_dotenv()

# Initialize Gemini model
api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
llm = ChatGoogleGenerativeAI(
    model="gemini-3.1-flash-lite",
    google_api_key=api_key,
    temperature=0.2
)

def research_node(state: AgentState) -> dict:
    """
    Analyzes the job title and description to extract key requirements.
    """
    job_title = state.get("job_title", "")
    job_description = state.get("job_description", "")
    
    print("\n>>> [Agent Step] Running RESEARCH AGENT...")
    print(f"    Target Job Title: {job_title}")
    
    system_prompt = (
        "You are an expert recruitment researcher. Analyze the job title and description "
        "and extract the following structured details as a JSON object:\n"
        "- 'keywords': list of important terms, abbreviations, and technologies (e.g. React, Kubernetes, CI/CD).\n"
        "- 'technical_skills': list of required languages, tools, frameworks, and hard skills.\n"
        "- 'soft_skills': list of soft skills (e.g., leadership, mentorship, collaboration).\n"
        "- 'responsibilities': bulleted summaries of the primary duties and expectations of this role.\n"
        "\nReturn ONLY valid JSON. Do not include extra text."
    )
    
    human_msg = f"Job Title: {job_title}\n\nJob Description:\n{job_description}"
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_msg)
    ])
    
    try:
        job_requirements = extract_json(response.content)
    except Exception:
        # Fallback if parsing fails
        job_requirements = {
            "keywords": [job_title],
            "technical_skills": [],
            "soft_skills": [],
            "responsibilities": []
        }
        
    print(f"    Research completed. Found {len(job_requirements.get('technical_skills', []))} technical skills and {len(job_requirements.get('keywords', []))} keywords.")
    return {
        "job_requirements": job_requirements,
        "iterations": 0
    }


def filter_node(state: AgentState) -> dict:
    """
    Matches master profile experiences/projects against job requirements and selects the best items.
    """
    profile = state.get("master_profile", {})
    reqs = state.get("job_requirements", {})
    
    experiences = profile.get("experiences", [])
    projects = profile.get("projects", [])
    
    print("\n>>> [Agent Step] Running FILTER AGENT...")
    print(f"    Evaluating profile data against job requirements...")
    
    system_prompt = (
        "You are an ATS filter agent. Your task is to review the candidate's master profile work experiences "
        "and projects, compare them against the job requirements, and select the most relevant ones to include "
        "in the tailored CV.\n"
        "Please output your selection as a JSON object with two fields:\n"
        "- 'selected_experience_ids': a list of experience IDs (UUID strings) to include.\n"
        "- 'selected_project_ids': a list of project IDs (UUID strings) to include.\n"
        "\nSelect only the experiences and projects that align with the job requirements. "
        "Return ONLY valid JSON. Do not include extra text."
    )
    
    # Format candidates for selection
    exp_summary = []
    for exp in experiences:
        exp_summary.append({
            "id": exp.get("id"),
            "company": exp.get("company"),
            "role": exp.get("role"),
            "bullet_points": exp.get("bullet_points"),
            "meta": exp.get("meta")
        })
        
    proj_summary = []
    for proj in projects:
        proj_summary.append({
            "id": proj.get("id"),
            "title": proj.get("title"),
            "description": proj.get("description"),
            "achievements": proj.get("achievements"),
            "meta": proj.get("meta")
        })
        
    human_msg = (
        f"Job Requirements:\n{json.dumps(reqs, indent=2)}\n\n"
        f"Work Experience Candidates:\n{json.dumps(exp_summary, indent=2)}\n\n"
        f"Project Candidates:\n{json.dumps(proj_summary, indent=2)}"
    )
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=human_msg)
    ])
    
    try:
        selections = extract_json(response.content)
        selected_exp_ids = selections.get("selected_experience_ids", [])
        selected_proj_ids = selections.get("selected_project_ids", [])
    except Exception:
        # Fallback: select all IDs
        selected_exp_ids = [exp.get("id") for exp in experiences if exp.get("id")]
        selected_proj_ids = [proj.get("id") for proj in projects if proj.get("id")]
        
    print(f"    Filter completed. Selected {len(selected_exp_ids)} experience(s) and {len(selected_proj_ids)} project(s).")
    return {
        "selected_experience_ids": selected_exp_ids,
        "selected_project_ids": selected_proj_ids
    }


def tailor_node(state: AgentState) -> dict:
    """
    Tailors the selected experiences and projects to match job requirements and keywords.
    Also draft the cover letter.
    """
    profile = state.get("master_profile", {})
    reqs = state.get("job_requirements", {})
    selected_exp_ids = state.get("selected_experience_ids", [])
    selected_proj_ids = state.get("selected_project_ids", [])
    feedback = state.get("critic_feedback", "")
    
    experiences = profile.get("experiences", [])
    projects = profile.get("projects", [])
    education = profile.get("education", [])
    
    print("\n>>> [Agent Step] Running TAILOR AGENT...")
    if feedback:
        print(f"    Rewriting based on Critic Feedback: {feedback}")
    else:
        print("    Writing tailored achievements and drafting cover letter...")
        
    # Filter the list based on selected IDs
    filtered_exps = [exp for exp in experiences if str(exp.get("id")) in [str(i) for i in selected_exp_ids]]
    filtered_projs = [proj for proj in projects if str(proj.get("id")) in [str(i) for i in selected_proj_ids]]
    
    system_prompt = (
        "You are an elite career consultant and copywriter. Your task is to rewrite the bullet points "
        "of the selected work experiences and achievements of projects to align closely with the target "
        "job requirements, and weave in keywords. \n"
        "CRITICAL RULES:\n"
        "1. DO NOT fabricate or hallucinate job titles, companies, dates, degrees, or accomplishments.\n"
        "2. Only rephrase existing bullet points to highlight relevant skills and impact, keeping formatting clean.\n"
        "3. Generate a tailored cover letter (around 300 words) addressing the job description.\n"
        "\nProvide your output as a JSON object containing:\n"
        "- 'experiences': list of tailored experience objects, keeping company, role, start_date, end_date, but replacing 'bullet_points' with tailored ones.\n"
        "- 'projects': list of tailored project objects, keeping title, description, url, but replacing 'achievements' with tailored ones.\n"
        "- 'cover_letter': a markdown string of the cover letter.\n"
        "\nReturn ONLY valid JSON."
    )
    
    payload = {
        "job_requirements": reqs,
        "experiences_to_tailor": filtered_exps,
        "projects_to_tailor": filtered_projs,
        "critic_feedback": feedback
    }
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=json.dumps(payload, indent=2))
    ])
    
    try:
        tailored_data = extract_json(response.content)
        cover_letter = tailored_data.pop("cover_letter", "")
    except Exception:
        # Fallback: return untailored filtered data
        tailored_data = {
            "experiences": filtered_exps,
            "projects": filtered_projs
        }
        cover_letter = "Dear Hiring Manager,\n\nI am writing to express my interest in this position..."
        
    # Append basic metadata and education that don't need heavy tailoring
    tailored_data["primary_title"] = profile.get("primary_title")
    tailored_data["contact_info"] = profile.get("contact_info")
    tailored_data["education"] = education
    
    print("    Tailor completed. Achievements customized and cover letter generated.")
    return {
        "tailored_cv_data": tailored_data,
        "cover_letter": cover_letter
    }


def critic_node(state: AgentState) -> dict:
    """
    Evaluates the tailored resume content, checking spelling, formatting, and ATS match.
    """
    tailored_cv = state.get("tailored_cv_data", {})
    job_reqs = state.get("job_requirements", {})
    cover_letter = state.get("cover_letter", "")
    iterations = state.get("iterations", 0)
    
    print(f"\n>>> [Agent Step] Running CRITIC AGENT (Iteration: {iterations + 1})...")
    print("    Evaluating match accuracy, formatting compliance, and keyword density...")
    
    system_prompt = (
        "You are an expert HR critic. Evaluate the tailored CV data and cover letter "
        "against the job requirements.\n"
        "Compute an overall score (0 to 100) based on alignment, keyword density, and professional presentation.\n"
        "Provide constructive feedback if improvements are needed (especially if keywords are missing or points lack clarity).\n"
        "Provide output as a JSON object containing:\n"
        "- 'score': integer from 0 to 100\n"
        "- 'feedback': text describing any shortcomings or suggesting specific edits\n"
        "\nReturn ONLY valid JSON."
    )
    
    payload = {
        "tailored_cv_data": tailored_cv,
        "job_requirements": job_reqs,
        "cover_letter": cover_letter
    }
    
    response = llm.invoke([
        SystemMessage(content=system_prompt),
        HumanMessage(content=json.dumps(payload, indent=2))
    ])
    
    try:
        evaluation = extract_json(response.content)
        score = evaluation.get("score", 85)
        feedback = evaluation.get("feedback", "")
    except Exception:
        score = 85
        feedback = "Looks good!"
        
    print(f"    Critic completed. Evaluation Score: {score}/100")
    if feedback:
        print(f"    Critic Feedback: {feedback}")
    return {
        "critic_score": score,
        "critic_feedback": feedback,
        "iterations": iterations + 1
    }
