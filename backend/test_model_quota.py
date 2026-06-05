import os
import sys
from dotenv import load_dotenv

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
load_dotenv()

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage

print("Testing different models for quota availability...")

api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Error: No API key configured.")
    sys.exit(1)

# List of models to test
models_to_test = [
    "gemini-2.0-flash",
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest"
]

for model in models_to_test:
    print(f"\nTesting model: {model}...")
    try:
        llm = ChatGoogleGenerativeAI(
            model=model,
            google_api_key=api_key,
            temperature=0.2
        )
        response = llm.invoke([HumanMessage(content="Hello! Respond with 'OK'.")])
        print(f"OK: {model} works! Output: {response.content.strip()}")
    except Exception as e:
        print(f"FAIL: {model} failed. Error: {e}")
