from pydantic import BaseModel
from enum import Enum


class Languages(str, Enum):
    python = 'python'
    golang = 'golang'


class ServerlessFile(BaseModel):
    name: str
    content: str
    is_base64_encoded: bool | None


class ServerlessResponse(BaseModel):
    exit_code: int
    stderr: str
    stdout: str


class RunSnippetRequest(BaseModel):
    content: str
    language: Languages
