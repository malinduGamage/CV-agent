from langgraph.graph import StateGraph, END
from backend.app.agents.state import AgentState
from backend.app.agents.nodes import research_node, filter_node, tailor_node, critic_node

# Create the graph workflow
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("researcher", research_node)
workflow.add_node("filter", filter_node)
workflow.add_node("tailor", tailor_node)
workflow.add_node("critic", critic_node)

# Set entry point
workflow.set_entry_point("researcher")

# Establish static transitions
workflow.add_edge("researcher", "filter")
workflow.add_edge("filter", "tailor")
workflow.add_edge("tailor", "critic")

# Define routing logic
def route_evaluation(state: AgentState) -> str:
    # Stop if we hit max iterations (3) or achieve a satisfactory critic score (>= 85)
    if state.get("iterations", 0) >= 3 or state.get("critic_score", 0) >= 85:
        return END
    return "tailor"

# Add conditional edges from the critic node
workflow.add_conditional_edges(
    "critic",
    route_evaluation,
    {
        "tailor": "tailor",
        END: END
    }
)

# Compile graph
tailor_graph = workflow.compile()
