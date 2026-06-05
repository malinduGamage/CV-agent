import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from google import genai
from google.genai import errors

print("Listing available Gemini models for the configured API key...")

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key or api_key == "YOUR_GEMINI_API_KEY":
    print("Error: No valid API key configured in environment.")
    sys.exit(1)

try:
    # Initialize the new Google GenAI client
    client = genai.Client(api_key=api_key)
    
    # List models
    models_list = client.models.list()
    
    print("\nSupported Models for this key:")
    for model in models_list:
        print(f"- {model.name} (Supported actions: {model.supported_actions})")
        
except Exception as e:
    print(f"\nFailed to list models: {e}")
