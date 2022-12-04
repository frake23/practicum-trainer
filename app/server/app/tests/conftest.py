import asyncio
import httpx
import pytest
from sqlmodel import SQLModel
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.auth.schemas import User
from app.auth.utils import get_access_token, get_password_hash
from app.settings import settings
from app.db import get_session, save_entity
from app.main import app


engine = create_async_engine(settings.test_db_url, echo=False, future=True)

pytest_plugins = ('pytest_asyncio',)


async def override_get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False,
    )
    async with async_session() as session:
        yield session

app.dependency_overrides[get_session] = override_get_session

test_client = TestClient(app)

db_session = pytest.fixture(override_get_session)


@pytest.fixture
def non_mocked_hosts() -> list:
    return ["testserver"]


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(autouse=True)
async def run_around_tests():
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


@pytest.fixture
async def anon_client():
    async with httpx.AsyncClient(app=app, base_url="http://testserver") as client:
        yield client


@pytest.fixture
async def user_client(db_session: AsyncSession):
    user = await save_entity(db_session, User(username='user', hashed_password=get_password_hash('user')))

    token = get_access_token(user.dict())

    headers = {'Authorization': f'Bearer {token}'}

    async with httpx.AsyncClient(app=app, base_url="http://testserver", headers=headers) as client:
        yield client
