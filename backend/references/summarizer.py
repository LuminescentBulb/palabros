import os, json, requests
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError
from google.genai.types import Content

def summarize(chat_history):
    response = requests.post(
    url="https://openrouter.ai/api/v1/chat/completions",
    headers={"Authorization": f"Bearer {os.environ.get('OPENROUTER_API_KEY')}"},
    data=json.dumps({"model": "deepseek/deepseek-r1-distill-llama-70b:free",
            "messages": [{
                "role":"user",
                "content":f"Please summarize the following conversation: \n\n{chat_history}"
            }]
    }))
    convo_summary = response.json()['choices'][0]['message']['content']
    return convo_summary