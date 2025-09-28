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