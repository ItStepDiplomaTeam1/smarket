import asyncio
import argparse
import os
import sys
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select

# Allow imports from project root
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from services.auth_service.database.models import User
from services.auth_service.plugins.security.hash.password import hash_password

load_dotenv()

async def make_admin(email: str, password: str = None):
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("Error: DATABASE_URL is not set in your environment or .env file.")
        return
        
    engine = create_async_engine(db_url)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(User).where(User.email == email))
        user = result.scalars().first()
        
        if user:
            print(f"Found existing user with email: {email}")
            user.role = "admin"
            user.is_active = True
            if password:
                user.hashed_password = hash_password(password)
                print("Updated user's password.")
            print(f"User {email} has been successfully promoted to 'admin' role.")
        else:
            if not password:
                print(f"Error: User {email} does not exist. To create a new admin, you must specify a password using --password.")
                return
            
            print(f"Creating new admin user: {email}")
            hashed = hash_password(password)
            user = User(
                email=email,
                hashed_password=hashed,
                role="admin",
                is_active=True
            )
            session.add(user)
            print(f"Admin user {email} created successfully.")
            
        await session.commit()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Promote an existing user to admin, or create a new admin user.")
    parser.add_argument("email", help="Email of the user to make admin")
    parser.add_argument("--password", help="Password for the user (required if creating a new user, optional to change password for existing user)")
    
    args = parser.parse_args()
    
    asyncio.run(make_admin(args.email, args.password))
