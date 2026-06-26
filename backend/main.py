import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.db.base import Base
from app.db.session import engine
from app.api import auth, leads

# Setup centralized logging format
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown lifespan events.
    Builds the database tables dynamically on start for prototype ease-of-use.
    """
    logger.info("Starting Mini AI SDR Backend Engine lifespan initialization...")
    # Create tables in PostgreSQL
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield
    
    logger.info("Shutting down Mini AI SDR Backend Engine lifespan, disposing connection pools...")
    # Close connection pools on shutdown
    await engine.dispose()

# Initialize FastAPI App
app = FastAPI(
    title="Mini AI SDR Backend Engine",
    description="Backend API powering Lead Qualification & Cold Email Automation",
    version="1.0.0",
    lifespan=lifespan
)

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Handles standard HTTPExceptions raised inside endpoint routers."""
    logger.warning(f"HTTP exception occurred on request {request.method} {request.url.path}: status={exc.status_code}, detail={exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Fallback catch-all exception handler to intercept unhandled runtime errors."""
    logger.error(
        f"Unhandled runtime exception encountered on request {request.method} {request.url.path}: {str(exc)}", 
        exc_info=True
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected server error occurred. Please contact system support."}
    )

# Configure CORS Middleware
# Allows request orchestration from our frontend dashboard at http://localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route registration
app.include_router(auth.router, prefix="/api")
app.include_router(leads.router, prefix="/api")

@app.get("/health", tags=["health"])
def health():
    """Simple API server health check."""
    return {"status": "healthy", "service": "Mini AI SDR API Engine"}

