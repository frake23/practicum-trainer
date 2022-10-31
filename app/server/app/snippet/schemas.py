from pydantic import BaseModel

class ServerlessFile(BaseModel):
    name: str
    content: str
    is_base64_encoded: bool | None


def get_file_from_lang(lang: Languages)


class ServerlessResponse(BaseModel):
    exit_code: int
    stderr: str
    stdout: str


class RunSnippetRequest(BaseModel):
    content: str
    language: str
