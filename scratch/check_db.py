import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Read DATABASE_URL from .env
env_path = os.path.join("services", "audit_service", ".env")
db_url = None
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.split("DATABASE_URL=")[1].strip()

if not db_url:
    print("DATABASE_URL not found in services/audit_service/.env")
    exit(1)

print(f"Original DB URL from env: {db_url}")

# Clean up query params and append asyncpg prefix
if "?" in db_url:
    db_url = db_url.split("?")[0]

if db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)

print(f"Corrected DB URL for asyncpg: {db_url}")

async def check():
    connect_args = {}
    if "neon.tech" in db_url:
        connect_args = {"ssl": True}
        
    engine = create_async_engine(db_url, connect_args=connect_args)
    try:
        async with engine.connect() as conn:
            # Query tables in public schema
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"
            ))
            tables = [row[0] for row in result.fetchall()]
            print(f"\n[OK] Connected successfully! Tables found in DB: {tables}")
            
            if 'audit_logs' in tables:
                cnt_res = await conn.execute(text("SELECT count(*) FROM audit_logs;"))
                count = cnt_res.scalar()
                print(f"[OK] Table 'audit_logs' exists and contains {count} records.")
                
                # Fetch recent 5 logs
                recent_res = await conn.execute(text("SELECT id, created_at, actor, event_type, severity, message FROM audit_logs ORDER BY created_at DESC LIMIT 5;"))
                print("\nRecent 5 logs:")
                for r in recent_res.fetchall():
                    print(r)
            else:
                print("[ERROR] Table 'audit_logs' DOES NOT exist in the database!")
                
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
    finally:
        await engine.dispose()

asyncio.run(check())
