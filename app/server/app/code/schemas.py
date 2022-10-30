from pydantic import BaseModel

class ServerlessFile(BaseModel):
    name: str
    content: str
    is_base64_encoded: bool | None


class ServerlessResponse(BaseModel):
    exit_code: int
    stderr: str
    stdout: str
