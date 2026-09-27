"""Async SQLAlchemy engine/session for the local MySQL (MariaDB) account + progress store.

Materi bab tetap di MongoDB; MySQL menyimpan akun lokal dan progress per user.
"""

import os

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

MYSQL_URL = os.environ["MYSQL_URL"]

engine = create_async_engine(MYSQL_URL, pool_pre_ping=True, pool_recycle=280, echo=False)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_session() -> AsyncSession:  # FastAPI dependency
    async with SessionLocal() as session:
        yield session


async def init_sql_schema() -> None:
    """Create tables on startup (import models first so they register on Base.metadata)."""
    from models import user as _user_models  # noqa: F401
    from models import flashcard as _flashcard_models  # noqa: F401

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
