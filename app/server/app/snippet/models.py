from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from pydantic import BaseModel
from app.snippet.enums import Languages


class SnippetBase(BaseModel):
    content: str
    language: Languages


class Snippet(SQLModel, SnippetBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
