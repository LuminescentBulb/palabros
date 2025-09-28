from fastapi import APIRouter, Depends, HTTPException, Request
from backend.core.utils import get_current_user, get_db
from backend.references.sentence_parser import dictionary
import os, json, requests
import spacy
from google import genai

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
SUMMARIZER_MODEL = "deepseek/deepseek-r1-distill-llama-70b:free"
GEMINI_MODEL = "gemini-2.5-flash"

router = APIRouter()

@router.get("/", summary="List all chat sessions for the current user")
async def list_sessions(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)
    rows = await db.fetch(
        """
        SELECT id, dialect, summary, session_name, created_at, updated_at
        FROM sessions
        WHERE user_id = $1
        ORDER BY updated_at DESC
        """,
        current_user["id"],
    )
    return [dict(r) for r in rows]

@router.get("/{session_id}", summary="Get one chat session by ID")
async def get_session(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)
    row = await db.fetchrow(
        """
        SELECT id, dialect, summary, session_name, created_at, updated_at
        FROM sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, current_user["id"]
    )

    if not row:
        raise HTTPException(status_code=404, detail="Session not found")

    return dict(row)

@router.get("/{session_id}/messages", summary="Get all messages for a session")
async def get_session_messages(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)

    # Check that session belongs to user
    session = await db.fetchrow(
        """
        SELECT id FROM sessions
        WHERE id = $1 AND user_id = $2
        """,
        session_id, current_user["id"]
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch messages for the session
    rows = await db.fetch(
        """
        SELECT id, sender, content, token_metadata, created_at
        FROM messages
        WHERE session_id = $1
        ORDER BY created_at ASC
        """,
        session_id
    )

    return [dict(r) for r in rows]

# Helper: summarize old history
async def summarize_history(messages: list[str]) -> str:
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
        data=json.dumps({
            "model": SUMMARIZER_MODEL,
            "messages": [{
                "role": "user",
                "content": f"Please summarize the following conversation:\n\n" + "\n".join(messages)
            }]
        })
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]

nlp = spacy.load("es_core_news_sm")

GLOSSARY_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "slang_glossary.json")
with open(GLOSSARY_PATH, "r", encoding="utf-8") as f:
    SLANG_GLOSSARY = json.load(f)


def build_token_metadata(text: str):
    """
    Parse text tokens and return metadata for each token including position and blurb
    """
    try:
        token_data = dictionary(text)  # Returns [(index, blurb), ...]
        
        # Convert to more structured format for frontend consumption
        tokens = []
        for idx, blurb in token_data:
            # Only include tokens that have meaningful content (not just punctuation or whitespace)
            # Find the actual word at this position
            if idx < len(text):
                # Look for the word boundary
                word_start = idx
                word_end = idx
                
                # Move to start of word if we're in the middle
                while word_start > 0 and text[word_start - 1].isalnum():
                    word_start -= 1
                    
                # Find end of word
                while word_end < len(text) and text[word_end].isalnum():
                    word_end += 1
                
                # Only add if it's a real word (not just punctuation)
                if word_end > word_start and any(c.isalpha() for c in text[word_start:word_end]):
                    tokens.append({
                        "index": word_start,
                        "blurb": blurb,
                        "word": text[word_start:word_end]
                    })
        
        return tokens
    except Exception as e:
        print(f"Error parsing tokens: {e}")
        return []

# Route: send new message
@router.post("/{session_id}/messages", summary="Send a new message in a session")
async def post_message(
    session_id: str,
    request: Request,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)
    user_message = payload.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Message text required")

    # Check session belongs to user
    session = await db.fetchrow(
        "SELECT id, dialect FROM sessions WHERE id=$1 AND user_id=$2",
        session_id, current_user["id"]
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Fetch user profile
    user = await db.fetchrow(
        "SELECT dialect, experience_level, facts FROM users WHERE id=$1",
        current_user["id"]
    )

    # Fetch all past messages
    rows = await db.fetch(
        "SELECT sender, content FROM messages WHERE session_id=$1 ORDER BY created_at ASC",
        session_id
    )
    all_messages = [f"{r['sender']}: {r['content']}" for r in rows]

    # Summarize older history if needed
    summary = None
    if len(all_messages) > 5:
        summary = await summarize_history(all_messages[:-5])
    recent_messages = all_messages[-5:]

    # Build Gemini prompt
    intro_prompt = f"""You are a Gen Z Spanish friend from {user['dialect']}, 
and the user is a {user['experience_level']} learner. 
Facts about user: {json.dumps(user['facts'])}.
Here is a summary of earlier conversation: {summary or "N/A"}."""

    chat = client.chats.create(model=GEMINI_MODEL)
    
    # Build the full conversation history including context
    conversation_history = [intro_prompt]
    
    # Add recent messages to conversation
    for msg in recent_messages:
        conversation_history.append(msg)
    
    # Add current user message
    conversation_history.append(f"user: {user_message}")
    
    # Send the complete conversation as a single message
    full_prompt = "\n".join(conversation_history)
    response = chat.send_message(full_prompt)

    # Parse tokens for bot message
    token_metadata = build_token_metadata(response.text)

    # Save messages into DB
    await db.execute(
        "INSERT INTO messages (session_id, sender, content) VALUES ($1, $2, $3)",
        session_id, "user", user_message
    )
    await db.execute(
        "INSERT INTO messages (session_id, sender, content, token_metadata) VALUES ($1, $2, $3, $4)",
        session_id, "bot", response.text, json.dumps(token_metadata)
    )

    return {
        "llm": {
            "reply": response.text,
            "session_id": session_id
        },
        "tokens": token_metadata
    }

@router.post("/", summary="Create a new chat session")
async def create_session(
    request: Request,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    print(current_user)
    db = get_db(request)
    row = await db.fetchrow(
        """
        INSERT INTO sessions (user_id, dialect, summary, session_name)
        VALUES ($1, $2, $3, $4)
        RETURNING id, dialect, summary, session_name, created_at
        """,
        current_user["id"],
        payload.get("dialect", "Mexico"),  # fallback
        payload.get("summary", None),
        "unnamed",  # Default session name
    )
    return dict(row)

@router.put("/{session_id}", summary="Update session name")
async def update_session(
    session_id: str,
    request: Request,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)
    
    # Check that session belongs to user
    session = await db.fetchrow(
        "SELECT id FROM sessions WHERE id=$1 AND user_id=$2",
        session_id, current_user["id"]
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update session name
    row = await db.fetchrow(
        """
        UPDATE sessions 
        SET session_name = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING id, dialect, summary, session_name, created_at, updated_at
        """,
        payload.get("session_name", "unnamed"),
        session_id,
        current_user["id"]
    )
    
    return dict(row)

@router.delete("/{session_id}", summary="Delete a session")
async def delete_session(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    db = get_db(request)
    
    # Check that session belongs to user
    session = await db.fetchrow(
        "SELECT id FROM sessions WHERE id=$1 AND user_id=$2",
        session_id, current_user["id"]
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Delete messages first (foreign key constraint)
    await db.execute(
        "DELETE FROM messages WHERE session_id = $1",
        session_id
    )
    
    # Delete session
    await db.execute(
        "DELETE FROM sessions WHERE id = $1 AND user_id = $2",
        session_id, current_user["id"]
    )
    
    return {"message": "Session deleted successfully"}
