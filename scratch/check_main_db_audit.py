import asyncio
import os
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Read DATABASE_URL from auth_service/.env
env_path = os.path.join("services", "auth_service", ".env")
db_url = None
if os.path.exists(env_path):
    with open(env_path, "r") as f:
        for line in f:
            if line.startswith("DATABASE_URL="):
                db_url = line.split("DATABASE_URL=")[1].strip()

if not db_url:
    print("DATABASE_URL not found in services/auth_service/.env")
    exit(1)

print(f"Auth Service DB URL: {db_url}")

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
            print(f"\n[OK] Connected successfully! Tables in Main DB: {tables}")
            
            if 'audit_logs' in tables:
                cnt_res = await conn.execute(text("SELECT count(*) FROM audit_logs;"))
                count = cnt_res.scalar()
                print(f"[OK] Table 'audit_logs' exists in Main DB and contains {count} records.")
            else:
                print("[INFO] Table 'audit_logs' does not exist in Main DB.")
                
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
    finally:
        await engine.dispose()

asyncio.run(check())
