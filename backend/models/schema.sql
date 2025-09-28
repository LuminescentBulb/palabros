CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    auth0_id TEXT UNIQUE NOT NULL,
    email TEXT,
    display_name TEXT,
    dialect TEXT,             -- e.g. "Mexico", "Spain", "Argentina"
    experience_level TEXT,    -- e.g. "beginner", "intermediate", "advanced"
    facts JSONB DEFAULT '{}',  -- flexible facts field
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    dialect TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP DEFAULT now(),
    updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    token_metadata JSONB,  -- stores parsed token information for bot messages
    created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notebook_entries (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    term TEXT NOT NULL,              -- e.g. "molido"
    dialect TEXT NOT NULL,           -- so "chido" (Mexico) ≠ "chido" (Spain)
    definition TEXT NOT NULL,
    gloss TEXT NOT NULL,
    examples JSONB,
    meme_note TEXT,
    starred BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT now()
);

