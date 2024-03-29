from sqlmodel import SQLModel, Field

from datetime import datetime
from typing import TypeVar

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from app.settings import settings

engine = create_async_engine(settings.db_url, echo=True, future=True)


async def init_db():
    async with engine.begin() as conn:
        # await conn.run_sync(SQLModel.metadata.drop_all)
        await conn.run_sync(SQLModel.metadata.create_all)


async def get_session() -> AsyncSession:
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False,
    )
    async with async_session() as session:
        yield session


class TimestampMixin(SQLModel):
    date_created: datetime = Field(default_factory=datetime.now)


T = TypeVar('T')

async def save_entity(session: AsyncSession, entity: T) -> T:
    session.add(entity)
    await session.commit()
    await session.refresh(entity)

    return entity
