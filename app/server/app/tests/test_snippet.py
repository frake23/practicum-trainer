from urllib.parse import urljoin
from uuid import uuid4
from httpx import AsyncClient
from fastapi import status
import pytest
from pytest_httpx import HTTPXMock
from pytest_mock import MockerFixture
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from app.enums import Languages
from app.settings import settings

from app.snippet.schemas import Snippet


@pytest.mark.asyncio
async def test_share_snippet(anon_client: AsyncClient, db_session: AsyncSession):
    url = '/snippet/share{}'

    response = await anon_client.post(url.format(''))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await anon_client.post(url.format(''), json=dict(language='random_language', content=''))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    json = dict(
        language='python',
        content='some content',
    )

    response = await anon_client.post(url.format(''), json=json)
    assert response.status_code == status.HTTP_200_OK
    assert (snippet_id := response.json()['id'])
    assert (snippet := Snippet.from_orm((await db_session.execute(select(Snippet).where(Snippet.id == snippet_id))).scalar_one()))

    response = await anon_client.post(url.format(''), json=json)
    assert response.status_code == status.HTTP_200_OK
    assert response.json()['id'] == snippet_id
    assert len((await db_session.execute(select(Snippet))).all()) == 1

    response = await anon_client.get(url.format('/random-string'))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await anon_client.get(url.format(f'/{uuid4()}'))
    assert response.status_code == status.HTTP_404_NOT_FOUND

    response = await anon_client.get(url.format(f'/{snippet_id}'))
    assert response.status_code == status.HTTP_200_OK
    assert set(response.json().items()) <= set(snippet.dict().items())


@pytest.mark.asyncio
@pytest.mark.parametrize(
    'language,serverless_url,ext,command',
    (
        (Languages.python.value, settings.serverless_url_python, 'py', 'python'),
        (Languages.go.value, settings.serverless_url_go, 'go', 'go run'),
    )
)
async def test_run_snippet(anon_client: AsyncClient, httpx_mock: HTTPXMock, language: str, serverless_url: str, ext: str, command: str):
    url = '/snippet/run'

    response = await anon_client.post(url)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await anon_client.post(url, json=dict(language='random_language', content=''))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    mock_response = dict(exit_code=0, stderr='', stdout='some-stdout',)
    httpx_mock.add_response(
        url=urljoin(serverless_url, 'run/'),
        status_code=status.HTTP_200_OK,
        json=mock_response
    )
    httpx_mock.add_response(
        url=urljoin(serverless_url, 'run/'),
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        json={}
    )

    response = await anon_client.post(url, json=dict(language=language, content='some-content'))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == mock_response

    requests = httpx_mock.get_requests()
    assert len(requests) == 1
    assert (
        requests[0]._content ==
        bytes(
            '{"files": [{"name": "main.%s", "content": "some-content", "is_base64_encoded": null}], "command": "%s main.%s <<< NONE"}' % (
                ext, command, ext),
            encoding='utf8',
        )
    )

    response = await anon_client.post(url, json=dict(language=language, content='some-content'))
    assert response.status_code == status.HTTP_400_BAD_REQUEST
