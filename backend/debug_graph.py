import sys
import os
import json
from dotenv import load_dotenv

if sys.platform.startswith('win'):
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    if hasattr(sys.stderr, 'reconfigure'):
        sys.stderr.reconfigure(encoding='utf-8')

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from backend.app.agents.graph import tailor_graph

print("Debugging LangGraph workflow invocation...")

initial_state = {
    "job_title": "Software Engineer",
    "job_description": "We need a developer experienced in Python, React, and SQL database systems.",
    "master_profile": {
        "primary_title": "Junior Developer",
        "contact_info": {"email": "test@example.com"},
        "experiences": [
            {
                "id": "exp-1",
                "company": "Tech Corp",
                "role": "Frontend dev",
                "start_date": "2021",
                "end_date": "2023",
                "bullet_points": ["Built react pages", "Handled API requests"],
                "meta": {}
            }
        ],
        "projects": [
            {
                "id": "proj-1",
                "title": "Portfolio website",
                "description": "Personal React site",
                "achievements": ["Deployed to Netlify"],
                "meta": {}
            }
        ],
        "education": [
            {
                "id": "edu-1",
                "school": "University",
                "degree": "B.S.",
                "field_of_study": "CS",
                "grad_date": "2021"
            }
        ]
    },
    "job_requirements": {},
    "selected_experience_ids": [],
    "selected_project_ids": [],
    "tailored_cv_data": {},
    "cover_letter": "",
    "critic_score": 0,
    "critic_feedback": "",
    "iterations": 0
}

try:
    final_state = tailor_graph.invoke(initial_state)
    print("\n[SUCCESS] Graph invoked successfully!")
    print("\nTailored CV Data:")
    print(json.dumps(final_state.get("tailored_cv_data"), indent=2))
    print("\nCover Letter:")
    print(final_state.get("cover_letter"))
    print(f"\nCritic Score: {final_state.get('critic_score')}")
    print(f"Critic Feedback: {final_state.get('critic_feedback')}")
except Exception as e:
    print(f"\n[FAILED] Invocation failed with error: {e}")
    import traceback
    traceback.print_exc()
