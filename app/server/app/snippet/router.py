from http import HTTPStatus
from urllib.parse import urljoin
from uuid import UUID

import aiohttp
from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from ..db import get_session
from ..enums import Languages
from ..settings import settings
from .schemas import (ServerlessFile, ServerlessResponse, ShareSnippetResponse,
                      Snippet, SnippetBase)

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

                return resp_json


@router.post('/share', response_model=ShareSnippetResponse)
async def snippet_share(request: SnippetBase, session: Session = Depends(get_session)):
    result = await session.execute(
        select(Snippet).where(
            Snippet.language == request.language,
            Snippet.content == request.content
        )
    )

    snippet = result.scalar_one_or_none()

    if snippet is None:
        snippet = Snippet(**request.dict())

        session.add(snippet)
        await session.commit()
        await session.refresh(snippet)

    return snippet


@router.get('/share/{snippet_id}', response_model=SnippetBase | None)
async def snippet_share(snippet_id: UUID, session: Session = Depends(get_session)):
    result = await session.execute(select(Snippet).where(Snippet.id == snippet_id))

    snippet = result.scalar_one_or_none()

    return snippet
