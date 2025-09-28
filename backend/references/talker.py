import os, json, requests
from dotenv import load_dotenv
from google import genai
from google.genai.errors import APIError
from google.genai.types import Content

import summarizer

load_dotenv()

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
print("Gemini Client initialized")
MODEL = "gemini-2.5-flash"

def run_chat_session(history_summary, user_first_prompt, dialect, level):
    chat = client.chats.create(model=MODEL)

    prompt = f"""You are a Gen Z Spanish friend from {dialect}, and the user is a {level}-level Spanish speaker trying to improve their Spanish skills. Respond to the user in slang and memes in Spanish, but be friendly-rude. If the user input is correct and slangy: praise and build on it. If the input is too formal or unnatural: correct it, show how a peer would say it, then continue the conversation. Always keep replies short (1-3 sentences). Here is a summary of the previous conversations you've had: \n\n{history_summary}\n\nThe user will continue off their previous conversation. {user_first_prompt}"""

    print(user_first_prompt)

    while 1:
        response = chat.send_message(prompt)
        # summarize chat history and save
        current_history = chat.get_history()
        
        messages = [f"{message.role}: {message.parts[0].text}" for message in current_history]

        chat_summary = summarizer.summarize("\n".join(messages))

        # TODO: CODE THAT SAVES SUMMARY TO DB
        print(chat_summary)

        # print response
        print(f"[GEMINI]: {response.text}")


        # prompt user
        last3messages = '\n'.join(messages[-3:])

        prompt = f"As a reminder, here is a summary of the conversation: {chat_summary}\n\nThe past 3 messages are: {last3messages}\n"

        # TODO: READ THE USER'S INPUT FROM THE TEXTBOX ONCE THEY SEND A MESSAGE, AND ADD THAT TO prompt.
        prompt += input("Enter message:")



if __name__ == "__main__" : 
    run_chat_session(None, input("Enter message: "), "Mexico", "beginner")





