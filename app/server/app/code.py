from http import HTTPStatus
from urllib.parse import urljoin
import httpx
from pydantic import BaseModel

from app.enums import Languages
from app.settings import settings


class ServerlessFile(BaseModel):
    name: str
    content: str
    is_base64_encoded: bool | None


def serverless_payload_from_request(language: Languages, content: str, test_input: str = 'NONE') -> dict:

    files = {
        Languages.go.value: 'main.go',
        Languages.python.value: 'main.py'
    }

    commands = {
        Languages.go.value: f'go run {files[Languages.go.value]} <<< {test_input}',
        Languages.python.value: f'python {files[Languages.python.value]} <<< {test_input}'
    }

    file = ServerlessFile(name=files[language], content=content)

    return {"files": [file.dict()], "command": commands[language]}


async def check_code(client: httpx.AsyncClient, language, payload: dict) -> dict:
    url = getattr(settings, f'serverless_url_{language}')
    headers = {"Content-Type": "application/json"}

    url = urljoin(url, "run/")
    headers["Authorization"] = f"Api-Key {settings.serverless_bot_token}"

    resp = await client.post(
        url=url,
        json=payload,
        headers=headers,
    )

    if resp.status_code == HTTPStatus.OK:
        resp_json = resp.json()

        return resp_json
    
    return None
