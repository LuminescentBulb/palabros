from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional
import asyncpg

router = APIRouter()

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

class UserSettingsUpdate(BaseModel):
    display_name: Optional[str] = None
    email: Optional[str] = None
    dialect: Optional[str] = None
    experience_level: Optional[str] = None

class UserSettings(BaseModel):
    id: int
    auth0_id: str
    email: Optional[str]
    display_name: Optional[str]
    dialect: Optional[str]
    experience_level: Optional[str]

async def get_user_id_from_token(request: Request):
    """Extract user ID from Authorization header"""
    auth_header = request.headers.get("authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = auth_header.split(" ")[1]  # This is the Auth0 sub (user ID)
    return token

@router.get("/me", response_model=UserSettings)
async def get_user_settings(request: Request):
    """Get current user's settings"""
    auth0_id = await get_user_id_from_token(request)
    
    async with request.app.state.db.acquire() as conn:
        # Ensure user exists
        await ensure_user(conn, auth0_id)
        
        # Get user data
        row = await conn.fetchrow(
            "SELECT id, auth0_id, email, display_name, dialect, experience_level FROM users WHERE auth0_id=$1",
            auth0_id
        )
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserSettings(**dict(row))

@router.put("/me", response_model=UserSettings)
async def update_user_settings(settings: UserSettingsUpdate, request: Request):
    """Update current user's settings"""
    auth0_id = await get_user_id_from_token(request)
    
    async with request.app.state.db.acquire() as conn:
        # Ensure user exists
        await ensure_user(conn, auth0_id)
        
        # Build dynamic update query
        update_fields = []
        values = []
        param_count = 1
        
        if settings.display_name is not None:
            update_fields.append(f"display_name = ${param_count}")
            values.append(settings.display_name)
            param_count += 1
            
        if settings.email is not None:
            update_fields.append(f"email = ${param_count}")
            values.append(settings.email)
            param_count += 1
            
        if settings.dialect is not None:
            update_fields.append(f"dialect = ${param_count}")
            values.append(settings.dialect)
            param_count += 1
            
        if settings.experience_level is not None:
            update_fields.append(f"experience_level = ${param_count}")
            values.append(settings.experience_level)
            param_count += 1
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="No fields to update")
        
        # Add auth0_id as the last parameter for WHERE clause
        values.append(auth0_id)
        
        query = f"""
        UPDATE users 
        SET {', '.join(update_fields)}
        WHERE auth0_id = ${param_count}
        RETURNING id, auth0_id, email, display_name, dialect, experience_level
        """
        
        row = await conn.fetchrow(query, *values)
        
        if not row:
            raise HTTPException(status_code=404, detail="User not found")
            
        return UserSettings(**dict(row))