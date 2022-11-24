from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlmodel import Field, SQLModel

from app.enums import Languages


class SnippetBase(SQLModel):
    content: str
    language: Languages


class Snippet(SnippetBase, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)


class ServerlessFile(BaseModel):
    name: str
    content: str
    is_base64_encoded: bool | None


class ServerlessResponse(BaseModel):
    exit_code: int
    stderr: str
    stdout: str


class ShareSnippetResponse(BaseModel):
    id: UUID
