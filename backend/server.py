import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List
import uuid
from datetime import datetime


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
from lib.db import client, db, ensure_indexes
from lib.sql import init_sql_schema
from routers import auth as auth_routes
from routers import chapters as chapter_routes
from routers import flashcards as flashcard_routes
from routers import kanji as kanji_routes
from routers import progress as progress_routes
from routers import quiz as quiz_routes


# Startup runs before the yield, shutdown after it. Add your own setup/teardown here.
async def ensure_seeded() -> None:
    """Seed MongoDB automatically when the chapters collection is empty/incomplete.

    The seed script is idempotent: it replaces chapters by number and upserts them,
    so running it again does not create duplicate chapter documents. We only invoke
    it when fewer than 50 chapter documents exist, which avoids re-seeding on every
    Render restart once the database is populated.
    """
    if os.environ.get("AUTO_SEED_DATABASE", "true").strip().lower() not in {"1", "true", "yes", "on"}:
        logger.info("MongoDB auto-seed disabled (AUTO_SEED_DATABASE=false)")
        return

    total = await db.chapters.count_documents({})
    if total >= 50:
        logger.info("MongoDB seed check: %s chapter documents already present; skipping seed", total)
        return

    logger.info("MongoDB seed check: only %s chapter documents present; running seed.py", total)
    from seed import main as seed_main
    await seed_main()


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot
    await init_sql_schema()  # MySQL: akun lokal + progress per user
    await ensure_seeded()  # MongoDB: populate chapter content automatically on first deployment
    yield
    client.close()


# Create the main app without a prefix
app = FastAPI(lifespan=lifespan)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

# Add your routes to the router instead of directly to app
@api_router.get("/health")
async def health_check():
    return {"status": "ok"}

@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.model_dump())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

# Mount resource routers onto the /api router, then include it in the app (last route statement)
api_router.include_router(auth_routes.router)
api_router.include_router(chapter_routes.router)
api_router.include_router(flashcard_routes.router)
api_router.include_router(kanji_routes.router)
api_router.include_router(progress_routes.router)
api_router.include_router(quiz_routes.router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',') if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
