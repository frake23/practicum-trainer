from http import HTTPStatus
from urllib.parse import urljoin
from fastapi import APIRouter
import aiohttp
from app.config import settings

from .schemas import RunSnippetRequest, ServerlessFile, ServerlessResponse

router = APIRouter(
    prefix="/snippet",
    tags=["snippet"]
)

@router.post('/run', response_model=ServerlessResponse)
async def snippet_run(request: RunSnippetRequest):
    file = ServerlessFile(name="", content=request.content)
    
    file.name = "main.py"
    payload = {"files": [file.dict()], "command": "python main.py"}

    async with aiohttp.ClientSession(
    ) as session:
        url = settings.serverless_url
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

                print(resp_json)

                return ServerlessResponse(**resp_json)
