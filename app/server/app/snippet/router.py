from http import HTTPStatus
from urllib.parse import urljoin
from fastapi import APIRouter
import aiohttp
from ..config import settings

from .schemas import Languages, RunSnippetRequest, ServerlessFile, ServerlessResponse

router = APIRouter(
    prefix="/snippet",
    tags=["snippet"]
)


def serverless_payload_from_request(request: RunSnippetRequest) -> dict:
    language = request.language

    files = {
        Languages.golang.value: 'main.go',
        Languages.python.value: 'main.py'
    }

    commands = {
        Languages.golang.value: f'go run {files[Languages.golang.value]}',
        Languages.python.value: f'python {files[Languages.python.value]}'
    }

    file = ServerlessFile(name=files[language], content=request.content)

    return {"files": [file.dict()], "command": commands[language]}


@router.post('/run', response_model=ServerlessResponse)
async def snippet_run(request: RunSnippetRequest):
    payload = serverless_payload_from_request(request)

    async with aiohttp.ClientSession(
    ) as session:
        url = getattr(settings, f'serverless_url_{request.language}')
        headers = {"Content-Type": "application/json"}

        url = urljoin(url, "run/")
        headers["Authorization"] = f"Api-Key {settings.serverless_bot_token}"

        async with session.post(
            url=url,
            json=payload,
            headers=headers,
        ) as resp:
            if resp.status == HTTPStatus.OK:
                resp_json = await resp.json()

                return ServerlessResponse(**resp_json)
