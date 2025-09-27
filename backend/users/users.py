# Upsert moment
async def ensure_user(conn, sub: str, email: str | None):
    await conn.execute("""
        INSERT INTO users (auth0_id, email)
        VALUES ($1, $2)
        ON CONFLICT (auth0_id) DO NOTHING
    """, sub, email)

    row = await conn.fetchrow("SELECT id FROM users WHERE auth0_id=$1", sub)
    return row["id"]
