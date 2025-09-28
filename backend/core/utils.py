from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt, JWTError
import requests
import os

ALGORITHMS = ["RS256"]
security = HTTPBearer()

AUTH0_DOMAIN = os.getenv("AUTH0_DOMAIN")
AUTH0_AUDIENCE = os.getenv("AUTH0_AUDIENCE")

JWKS_URL = f"https://{AUTH0_DOMAIN}/.well-known/jwks.json"
jwks = requests.get(JWKS_URL).json()

def get_db(request: Request):
    return request.app.state.db

async def ensure_user(conn, sub: str):
    await conn.execute(
        """
        INSERT INTO users (auth0_id)
        VALUES ($1)
        ON CONFLICT (auth0_id) DO NOTHING
        """,
        sub
    )
    row = await conn.fetchrow("SELECT id FROM users WHERE auth0_id=$1", sub)
    return row["id"]

async def get_current_user(
    request: Request,
    token: HTTPAuthorizationCredentials = Depends(security)
):
    # Treat the token itself as the sub
    sub = token.credentials
    if not sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing sub")

    db = get_db(request)
    user_id = await ensure_user(db, sub)

    return {
        "id": user_id,
        "sub": sub,
    }