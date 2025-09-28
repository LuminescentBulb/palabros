# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv
import asyncpg, os
load_dotenv(dotenv_path=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

import backend.sessions.sessions as sessions

DATABASE_URL = os.getenv("DATABASE_URL")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    app.state.db = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=10)

    async with app.state.db.acquire() as conn:
        with open(os.path.join(os.path.dirname(__file__), "./models/schema.sql"), "r") as f:
            schema_sql = f.read()
        await conn.execute(schema_sql)

    yield
    # Shutdown
    await app.state.db.close()

app = FastAPI(title="Spanish Chat App", version="0.1.0", lifespan=lifespan)

# CORS (so Next.js frontend can call the API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

# Routers
app.include_router(sessions.router, prefix="/sessions", tags=["sessions"])
