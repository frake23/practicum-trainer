from uuid import UUID

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.code import check_code, serverless_payload_from_request

from app.db import get_session
from app.snippet.schemas import (ServerlessResponse, ShareSnippetResponse,
                      Snippet, SnippetBase)

router = APIRouter(
    prefix="/snippet",
    tags=["snippet"]
)


@router.post('/run', response_model=ServerlessResponse)
async def snippet_run(request: SnippetBase):
    payload = serverless_payload_from_request(
        language=request.language, content=request.content,)

    async with httpx.AsyncClient(
    ) as client:
        result = await check_code(client=client, language=request.language, payload=payload,)

        if result is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Error while request to serverless"
            )

        return result


@router.post('/share', response_model=ShareSnippetResponse)
async def snippet_share(request: SnippetBase, session: AsyncSession = Depends(get_session)):
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
async def snippet_share(snippet_id: UUID, session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Snippet).where(Snippet.id == snippet_id))

    snippet = result.scalar_one_or_none()

    if snippet is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='snippet not found',
        )

    return snippet
