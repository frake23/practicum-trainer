from http import HTTPStatus
from urllib.parse import urljoin
from uuid import UUID
from fastapi import APIRouter, Depends
import aiohttp
from sqlalchemy.future import select


from .enums import Languages
from ..config import settings
from ..db import get_session
from .schemas import ServerlessFile, ServerlessResponse, ShareSnippetResponse
from .models import Snippet, SnippetBase


router = APIRouter(
    prefix="/snippet",
    tags=["snippet"]
)


def serverless_payload_from_request(request: SnippetBase) -> dict:
    language = request.language

    files = {
        Languages.go.value: 'main.go',
        Languages.python.value: 'main.py'
    }

    commands = {
        Languages.go.value: f'go run {files[Languages.go.value]}',
        Languages.python.value: f'python {files[Languages.python.value]}'
    }

    file = ServerlessFile(name=files[language], content=request.content)

    return {"files": [file.dict()], "command": commands[language]}


@router.post('/run', response_model=ServerlessResponse)
async def snippet_run(request: SnippetBase):
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


@router.post('/share', response_model=ShareSnippetResponse)
async def snippet_share(request: SnippetBase, session=Depends(get_session)):
    result = await session.execute(
        select(Snippet).where(
            Snippet.language == request.language,
            Snippet.content == request.content
        )
    )
    snippet = result.scalars().one_or_none()

    if snippet:
        return ShareSnippetResponse(id=str(snippet.id))

    snippet = Snippet(**request.dict())

    session.add(snippet)
    await session.commit()
    await session.refresh(snippet)

    return ShareSnippetResponse(id=str(snippet.id))


@router.get('/share/{snippet_id}', response_model=SnippetBase)
async def snippet_share(snippet_id: UUID, session=Depends(get_session)):
    result = await session.execute(select(Snippet).where(Snippet.id == snippet_id))
    snippet = result.scalars().one()

    return SnippetBase(**snippet.__dict__)
