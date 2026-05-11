"""Pytest configuration and fixtures for database testing."""

import os

os.environ["SQLITE_DB_PATH"] = ":memory:"

import pytest_asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from api.db_models import Base
from api.db_service import DbService

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create a session-scoped async engine with in-memory SQLite."""
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def session(engine):
    """Create a per-test async session with automatic rollback."""
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def db_service(engine):
    """Create DbService with test engine."""
    return DbService(engine)


@pytest_asyncio.fixture
async def fresh_db(engine):
    """Recreate all tables for a clean database state."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
