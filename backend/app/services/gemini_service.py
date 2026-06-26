import logging
import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from app.core.config import settings

logger = logging.getLogger(__name__)

async def generate_cold_email(
    first_name: str,
    last_name: str,
    company: str,
    job_title: str,
    score: int,
    reason: str
) -> str:
    """
    Generates a personalized cold outreach email using Google Gemini (gemini-1.5-flash).
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.strip() == "":
        logger.warning("GEMINI_API_KEY is not set. Returning fallback mock email.")
        return (
            f"Subject: Tailored solution for {company}\n\n"
            f"Hi {first_name},\n\n"
            f"I hope this email finds you well. I was researching {company} and noticed your role as {job_title}. "
            f"Given your focus on operations and our recent assessment of your company profile (Score: {score}/100, Reason: {reason}), "
            f"I wanted to connect to see how we could help automate your workflow.\n\n"
            f"Are you open to a brief conversation this week?\n\n"
            f"Best regards,\n"
            f"AI SDR Agent"
        )

    try:
        # Configure Gemini API Key
        genai.configure(api_key=settings.GEMINI_API_KEY)
        
        # Initialize generative model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        prompt = (
            f"You are an elite Sales Development Representative (SDR). Write a short, highly personalized, "
            f"and persuasive cold outbound email sequence for the following lead:\n\n"
            f"Lead Profile:\n"
            f"- Name: {first_name} {last_name}\n"
            f"- Company: {company}\n"
            f"- Job Title: {job_title}\n"
            f"- Qualification Score: {score}/100\n"
            f"- Qualification Rationale: {reason}\n\n"
            f"Instructions:\n"
            f"1. Start directly with a subject line in the format 'Subject: [Subject Line Text]'.\n"
            f"2. Write a highly compelling email body customized to their role as a {job_title} at {company}.\n"
            f"3. Do not include generic placeholder brackets like [Your Name] or [My Company]. Write it as an AI SDR Agent.\n"
            f"4. End with a simple, low-friction call-to-action.\n"
            f"5. Do NOT include markdown styling or formatting markers outside of standard email linebreaks.\n"
            f"Output only the subject line and email body."
        )
        
        # Execute prompt asynchronously
        response = await model.generate_content_async(prompt)
        
        return response.text.strip()

    except google_exceptions.GoogleAPICallError as e:
        logger.error(f"Google Gemini API call failed: {str(e)}")
        return (
            f"Subject: Outbound campaign outreach for {company}\n\n"
            f"Hi {first_name},\n\n"
            f"I hope this finds you well. I noticed your role as {job_title} at {company}. "
            f"I wanted to connect to share how we help scale campaign outreach workflows.\n\n"
            f"Let me know if you are open to a 10-minute call next week.\n\n"
            f"Best regards,\n"
            f"Sales Outreach Team"
        )
    except google_exceptions.RetryError as e:
        logger.error(f"Google Gemini API retry limit exceeded: {str(e)}")
        return (
            f"Subject: Automated operations at {company}\n\n"
            f"Hi {first_name},\n\n"
            f"I was researching {company} and thought your background as {job_title} would be relevant. "
            f"I wanted to connect to share some of our recent findings.\n\n"
            f"Are you open to a brief chat this week?\n\n"
            f"Best,\n"
            f"AI SDR Agent"
        )
    except Exception as e:
        logger.error(f"Unexpected error calling Gemini API: {str(e)}", exc_info=True)
        return (
            f"Subject: Streamlining operations at {company}\n\n"
            f"Hi {first_name},\n\n"
            f"I hope this finds you well. I am reaching out because we help companies like {company} scale "
            f"their output. In your capacity as {job_title}, I thought you would be interested in seeing "
            f"how we support workflows.\n\n"
            f"Let me know if you have 10 minutes to discuss this next week.\n\n"
            f"Best,\n"
            f"Sales Development Team"
        )
