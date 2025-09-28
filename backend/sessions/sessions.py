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

async def extract_learner_facts(user_message: str, bot_response: str, existing_facts: dict, message_count: int = 0) -> dict:
    """
    Extract new learner facts from conversation to update user profile.
    Returns updated facts dictionary.
    Only extracts facts periodically to avoid excessive API calls.
    """
    try:
        # Ensure existing_facts is a dictionary
        if isinstance(existing_facts, str):
            try:
                existing_facts = json.loads(existing_facts)
            except json.JSONDecodeError:
                existing_facts = {}
        elif existing_facts is None:
            existing_facts = {}
        elif not isinstance(existing_facts, dict):
            existing_facts = {}
        
        # Only extract facts every few messages or if it's early in the conversation
        should_extract = (
            message_count <= 6 or  # First few messages
            message_count % 8 == 0 or  # Every 8th message after that
            len(existing_facts) < 3  # If we don't have many facts yet
        )
        
        if not should_extract:
            return existing_facts
        
        fact_extraction_prompt = """You are a language learning assistant. Analyze this conversation and extract useful facts about the learner that would help personalize future conversations.

Current learner facts: {}

Recent conversation:
User: {}
Assistant: {}

Extract ANY interesting or relevant facts about the learner from this conversation. Be creative and flexible with fact categories - don't limit yourself to standard categories. Create whatever keys make sense for the information discussed.

Examples of what to capture:
- Any interests, hobbies, or specific topics mentioned (e.g., "variedades_maiz_favoritas", "deportes_extremos", "tipos_queso_preferidos")
- Personal details, experiences, opinions (e.g., "ciudad_natal", "mascota", "comida_odiada", "experiencia_viajando")
- Learning patterns, goals, struggles (e.g., "errores_frecuentes", "palabras_dificiles", "temas_favoritos_conversacion")
- Quirky or unique details that make them memorable (e.g., "colecciona_sellos", "tiene_miedo_payasos", "habla_tres_idiomas")
- Preferences, dislikes, cultural references (e.g., "musica_detesta", "peliculas_amor", "tradiciones_familiares")

Use descriptive Spanish keys that capture the essence of what you learned. Values can be strings, arrays, or whatever format fits the information best.

Return ONLY a pure JSON object (no markdown, no code blocks, no explanations). Keep the response concise - limit to the most important facts. Maximum 10 new facts per extraction.

Example format (but don't limit yourself to these categories):
{{"variedades_tomate_cultiva": ["cherry", "beefsteak"], "fobia_insectos": true, "receta_secreta_abuela": "empanadas de pollo", "suena_con_viajar_a": "Patagonia", "odia_sonido_unas": true}}""".format(
            json.dumps(existing_facts, ensure_ascii=False),
            user_message,
            bot_response
        )

        # Use OpenRouter instead of Gemini for cost savings
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={"Authorization": f"Bearer {os.environ['OPENROUTER_API_KEY']}"},
            data=json.dumps({
                "model": SUMMARIZER_MODEL,  # Reuse the same cost-effective model
                "messages": [{
                    "role": "user",
                    "content": fact_extraction_prompt
                }]
            })
        )
        response.raise_for_status()
        
        # Parse the JSON response
        try:
            fact_response_text = response.json()["choices"][0]["message"]["content"]
            
            # Clean up the response - remove markdown code blocks if present
            cleaned_text = fact_response_text.strip()
            if cleaned_text.startswith("```json"):
                cleaned_text = cleaned_text[7:]  # Remove ```json
            elif cleaned_text.startswith("```"):
                cleaned_text = cleaned_text[3:]   # Remove ```
            if cleaned_text.endswith("```"):
                cleaned_text = cleaned_text[:-3]  # Remove closing ```
            cleaned_text = cleaned_text.strip()
            
            new_facts = json.loads(cleaned_text)
            
            # Merge with existing facts, giving precedence to new facts
            updated_facts = {**existing_facts, **new_facts}
            
            # Limit to 100 keys maximum
            if len(updated_facts) > 100:
                # Keep the 100 most recent facts (new facts take precedence)
                updated_facts = dict(list(updated_facts.items())[-100:])
                print(f"Limited facts to 100 keys")
            
            print(f"Updated learner facts: {updated_facts}")  # Debug log
            return updated_facts
        except json.JSONDecodeError as e:
            print(f"Failed to parse fact extraction response: {fact_response_text}")
            print(f"JSON decode error: {e}")
            return existing_facts
            
    except Exception as e:
        print(f"Error extracting learner facts: {e}")
        return existing_facts

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

    # Extract and update learner facts (pass message count for optimization)
    message_count = len(all_messages)
    # Ensure facts is properly handled as a dict
    current_facts = user['facts'] if user['facts'] is not None else {}
    updated_facts = await extract_learner_facts(user_message, response.text, current_facts, message_count)
    
    # Update user facts in database if they changed
    if updated_facts != current_facts:
        await db.execute(
            "UPDATE users SET facts = $1 WHERE id = $2",
            json.dumps(updated_facts), current_user["id"]
        )
        print(f"Facts updated for user {current_user['id']}: {updated_facts}")

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
