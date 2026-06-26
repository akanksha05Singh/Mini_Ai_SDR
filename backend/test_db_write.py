import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.models.lead import User
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def test_write():
    print("Testing DB connection and write...")
    async with SessionLocal() as session:
        try:
            # 1. Check if we can select
            print("Querying users table...")
            stmt = select(User).limit(1)
            result = await session.execute(stmt)
            user = result.scalars().first()
            print(f"Query successful. First user: {user}")
            
            # 2. Try inserting a test user
            print("Attempting to insert a temporary test user...")
            hashed_pwd = get_password_hash("testpassword")
            new_user = User(email="diagnostic_user@example.com", hashed_password=hashed_pwd)
            session.add(new_user)
            
            # Flush to get ID
            await session.flush()
            print(f"User flushed. Temporary ID: {new_user.id}")
            
            # Rollback to avoid cluttering db
            await session.rollback()
            print("Database write and rollback check: PASSED")
            
        except Exception as e:
            print(f"Database write check: FAILED. Error: {str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    asyncio.run(test_write())
