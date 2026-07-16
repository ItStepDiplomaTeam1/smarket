import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

DATABASE_URL = "postgresql+asyncpg://neondb_owner:npg_JD6cRm8QHiBx@ep-shy-hall-apsk0whb-pooler.c-7.us-east-1.aws.neon.tech/neondb"

async def main():
    engine = create_async_engine(DATABASE_URL)
    try:
        async with engine.connect() as conn:
            # Search for Milk
            result = await conn.execute(text("SELECT id, title, image_url FROM products WHERE title ILIKE '%Яготинське%' AND title ILIKE '%молоко%' LIMIT 3"))
            print("--- Results for: Яготинське молоко ---")
            for row in result:
                print(row)
    except Exception as e:
        print("Error:", e)
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
