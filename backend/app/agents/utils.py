import json
import re
from typing import Dict, Any

def extract_json(text: Any) -> Dict[str, Any]:
    """
    Utility to extract JSON from LLM string output, even if wrapped in markdown code blocks.
    """
    if isinstance(text, list):
        text_parts = []
        for part in text:
            if isinstance(part, dict) and "text" in part:
                text_parts.append(part["text"])
            elif isinstance(part, str):
                text_parts.append(part)
            elif hasattr(part, "text"):
                text_parts.append(part.text)
        text = "".join(text_parts)
    elif not isinstance(text, str):
        text = str(text)

    # Look for markdown code block ```json ... ```
    match = re.search(r'```(?:json)?\s*([\s\S]*?)\s*```', text)
    if match:
        json_content = match.group(1).strip()
    else:
        json_content = text.strip()
        
    try:
        return json.loads(json_content)
    except json.JSONDecodeError:
        # Fallback: find the first '{' and last '}'
        start_idx = json_content.find('{')
        end_idx = json_content.rfind('}')
        if start_idx != -1 and end_idx != -1:
            try:
                return json.loads(json_content[start_idx:end_idx+1])
            except json.JSONDecodeError:
                pass
        raise ValueError(f"Could not parse JSON from LLM output: {text}")
