import pytest
from unittest.mock import MagicMock, patch
from langchain_core.messages import AIMessage

from backend.app.agents.state import AgentState
from backend.app.agents.nodes import research_node, filter_node, tailor_node, critic_node
from backend.app.agents.graph import tailor_graph

@pytest.fixture
def base_state() -> AgentState:
    return {
        "job_title": "Software Engineer",
        "job_description": "We are looking for a Python developer who knows React and FastAPI.",
        "master_profile": {
            "primary_title": "Fullstack Developer",
            "contact_info": {"email": "test@example.com"},
            "experiences": [
                {
                    "id": "exp-1",
                    "company": "Tech Corp",
                    "role": "Software Developer",
                    "start_date": "2020-01-01",
                    "end_date": "2022-01-01",
                    "bullet_points": ["Developed Python services.", "Worked with React frontends."]
                }
            ],
            "projects": [
                {
                    "id": "proj-1",
                    "title": "API Gateway",
                    "description": "A gateway built in Python.",
                    "achievements": ["Handled high traffic."]
                }
            ],
            "education": [
                {
                    "id": "edu-1",
                    "school": "Uni",
                    "degree": "BS",
                    "field_of_study": "CS",
                    "grad_date": "2020"
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

@patch("backend.app.agents.nodes.llm")
def test_research_node(mock_llm, base_state):
    # Setup mock LLM response for researcher
    mock_response = MagicMock(spec=AIMessage)
    mock_response.content = """
    {
        "keywords": ["Python", "React", "FastAPI"],
        "technical_skills": ["Python", "React", "FastAPI"],
        "soft_skills": ["Communication"],
        "responsibilities": ["Build web applications"]
    }
    """
    mock_llm.invoke.return_value = mock_response
    
    # Run the researcher agent node
    result = research_node(base_state)
    
    # Assert expected state modifications
    assert "job_requirements" in result
    assert result["job_requirements"]["keywords"] == ["Python", "React", "FastAPI"]
    assert result["iterations"] == 0

@patch("backend.app.agents.nodes.llm")
def test_filter_node(mock_llm, base_state):
    # Pre-populate state with job requirements
    base_state["job_requirements"] = {
        "keywords": ["Python", "React"],
        "technical_skills": ["Python", "React"],
        "soft_skills": [],
        "responsibilities": []
    }
    
    # Setup mock LLM response for filter node
    mock_response = MagicMock(spec=AIMessage)
    mock_response.content = """
    {
        "selected_experience_ids": ["exp-1"],
        "selected_project_ids": ["proj-1"]
    }
    """
    mock_llm.invoke.return_value = mock_response
    
    # Run the filter agent node
    result = filter_node(base_state)
    
    # Assert selection output
    assert result["selected_experience_ids"] == ["exp-1"]
    assert result["selected_project_ids"] == ["proj-1"]

@patch("backend.app.agents.nodes.llm")
def test_tailor_node(mock_llm, base_state):
    # Set selected item IDs to tailor
    base_state["selected_experience_ids"] = ["exp-1"]
    base_state["selected_project_ids"] = ["proj-1"]
    base_state["job_requirements"] = {"keywords": ["Python"]}
    
    # Setup mock LLM response for tailor node
    mock_response = MagicMock(spec=AIMessage)
    mock_response.content = """
    {
        "experiences": [
            {
                "id": "exp-1",
                "company": "Tech Corp",
                "role": "Software Developer",
                "bullet_points": ["Developed optimized Python services aligned with target requirements."]
            }
        ],
        "projects": [
            {
                "id": "proj-1",
                "title": "API Gateway",
                "achievements": ["Handled high traffic using FastAPI."]
            }
        ],
        "cover_letter": "Dear Hiring Manager..."
    }
    """
    mock_llm.invoke.return_value = mock_response
    
    # Run the tailor agent node
    result = tailor_node(base_state)
    
    assert "tailored_cv_data" in result
    assert result["cover_letter"] == "Dear Hiring Manager..."
    assert result["tailored_cv_data"]["experiences"][0]["bullet_points"] == [
        "Developed optimized Python services aligned with target requirements."
    ]

@patch("backend.app.agents.nodes.llm")
def test_critic_node(mock_llm, base_state):
    # Prepare inputs for evaluation
    base_state["tailored_cv_data"] = {"experiences": []}
    base_state["cover_letter"] = "Dear Hiring Manager"
    
    # Setup mock LLM response for critic node
    mock_response = MagicMock(spec=AIMessage)
    mock_response.content = """
    {
        "score": 90,
        "feedback": "Outstanding tailoring!"
    }
    """
    mock_llm.invoke.return_value = mock_response
    
    # Run the critic agent node
    result = critic_node(base_state)
    
    assert result["critic_score"] == 90
    assert result["critic_feedback"] == "Outstanding tailoring!"
    assert result["iterations"] == 1

@patch("backend.app.agents.nodes.llm")
def test_full_graph_workflow(mock_llm, base_state):
    # Setup sequential LLM side effects representing a full graph traversal
    # node flow: research -> filter -> tailor -> critic (re-route) -> tailor -> critic (exit)
    
    res_research = MagicMock(spec=AIMessage)
    res_research.content = '{"keywords": ["Python"], "technical_skills": [], "soft_skills": [], "responsibilities": []}'
    
    res_filter = MagicMock(spec=AIMessage)
    res_filter.content = '{"selected_experience_ids": ["exp-1"], "selected_project_ids": []}'
    
    res_tailor_1 = MagicMock(spec=AIMessage)
    res_tailor_1.content = '{"experiences": [{"id": "exp-1", "bullet_points": ["First draft"]}], "projects": [], "cover_letter": "Draft 1"}'
    
    res_critic_1 = MagicMock(spec=AIMessage)
    res_critic_1.content = '{"score": 80, "feedback": "Include more keywords."}'
    
    res_tailor_2 = MagicMock(spec=AIMessage)
    res_tailor_2.content = '{"experiences": [{"id": "exp-1", "bullet_points": ["Second draft"]}], "projects": [], "cover_letter": "Draft 2"}'
    
    res_critic_2 = MagicMock(spec=AIMessage)
    res_critic_2.content = '{"score": 95, "feedback": "Perfect!"}'
    
    mock_llm.invoke.side_effect = [
        res_research,
        res_filter,
        res_tailor_1,
        res_critic_1,
        res_tailor_2,
        res_critic_2
    ]
    
    # Run the complete compiled LangGraph workflow
    final_state = tailor_graph.invoke(base_state)
    
    assert final_state["iterations"] == 2
    assert final_state["critic_score"] == 95
    assert final_state["critic_feedback"] == "Perfect!"
    assert final_state["tailored_cv_data"]["experiences"][0]["bullet_points"] == ["Second draft"]
