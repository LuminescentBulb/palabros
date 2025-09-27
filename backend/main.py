# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.api import chat, vocab, users
from backend.core import config

import asyncpg, os

DATABASE_URL = os.getenv("DATABASE_URL")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.db = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)
    yield
    # Shutdown
    await app.state.db.close()

app = FastAPI(title="Spanish Chat App", version="0.1.0", lifespan=lifespan)

# CORS (so Next.js frontend can call the API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[config.settings.FRONTEND_URL],  # e.g. http://localhost:3000
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# Routers
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(vocab.router, prefix="/vocab", tags=["vocab"])
app.include_router(users.router, prefix="/users", tags=["users"])
