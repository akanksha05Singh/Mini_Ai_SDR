import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from openai import AsyncOpenAI
from app.core.config import settings

async def test_key():
    # Reload settings from env
    print(f"Testing OpenAI API Key: {settings.OPENAI_API_KEY[:20]}...")
    
    if not settings.OPENAI_API_KEY or "your_" in settings.OPENAI_API_KEY:
        print("✗ No valid OpenAI API Key found in .env.")
        return
        
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": "Connection check. Say OK."}],
            max_tokens=10,
            temperature=0.0
        )
        print(f"✓ SUCCESS! OpenAI API Key is working perfectly.")
        print(f"Response: {response.choices[0].message.content.strip()}")
    except Exception as e:
        print(f"✗ FAILED! The key could not complete the request.")
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_key())
