import json
import logging
import openai
from openai import AsyncOpenAI
from app.core.config import settings

logger = logging.getLogger(__name__)

async def score_lead(
    first_name: str,
    last_name: str,
    company: str,
    job_title: str,
    email: str,
    phone: str = None
) -> dict:
    """
    Evaluates a lead's metadata using OpenAI gpt-4o-mini.
    Returns a dict containing 'score' (int, 1-100) and 'reason' (str).
    """
    if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY.strip() == "":
        logger.warning("OPENAI_API_KEY is not set. Returning fallback mock evaluation.")
        # Return fallback mock evaluation based on job title to facilitate local testing
        title_lower = job_title.lower()
        if any(term in title_lower for term in ["ceo", "cto", "vp", "director", "founder", "head"]):
            score = 85
            reason = f"Highly qualified lead: '{job_title}' holds a leadership role at {company} which is a primary target profile."
        else:
            score = 45
            reason = f"Mid-tier lead: '{job_title}' is an individual contributor. Moderate relevance to SDR outreach targets."
        return {"score": score, "reason": reason}

    try:
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        
        system_prompt = (
            "You are an expert sales qualification system. Analyze the provided lead metadata "
            "and determine their quality score from 1 (lowest) to 100 (highest) based on potential business value. "
            "Also provide a concise reasoning/justification string explaining your score. "
            "You must return ONLY a raw JSON object with keys: 'score' (an integer 1-100) and 'reason' (a string)."
        )
        
        user_prompt = (
            f"Lead Details:\n"
            f"First Name: {first_name}\n"
            f"Last Name: {last_name}\n"
            f"Job Title: {job_title}\n"
            f"Company: {company}\n"
            f"Email: {email}\n"
            f"Phone: {phone or 'N/A'}"
        )
        
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # Parse and sanitize response fields
        score = int(data.get("score", 50))
        reason = str(data.get("reason", "Lead evaluated."))
        
        # Enforce range constraints [1, 100]
        score = max(1, min(100, score))
        
        return {"score": score, "reason": reason}

    except openai.RateLimitError as e:
        logger.error(f"OpenAI API rate limit or quota exceeded: {str(e)}")
        return {
            "score": 50,
            "reason": f"OpenAI Rate Limit Exceeded (insufficient quota). Fallback triggered. Details: {str(e)}"
        }
    except openai.AuthenticationError as e:
        logger.error(f"OpenAI API authentication failed (invalid key): {str(e)}")
        return {
            "score": 50,
            "reason": f"OpenAI Authentication Failed. Check API configuration. Details: {str(e)}"
        }
    except openai.APIConnectionError as e:
        logger.error(f"OpenAI API connection issue: {str(e)}")
        return {
            "score": 50,
            "reason": f"OpenAI Connection Failure. Verify internet routing. Details: {str(e)}"
        }
    except openai.APIStatusError as e:
        logger.error(f"OpenAI API status error (status code {e.status_code}): {str(e)}")
        return {
            "score": 50,
            "reason": f"OpenAI API Status Error. HTTP status: {e.status_code}. Details: {str(e)}"
        }
    except Exception as e:
        logger.error(f"Unexpected error calling OpenAI API: {str(e)}", exc_info=True)
        return {
            "score": 50,
            "reason": f"Unexpected OpenAI error occurred: {str(e)}"
        }
