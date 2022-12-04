from httpx import AsyncClient
import pytest
from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select

from app.auth.schemas import User
from app.auth.utils import get_password_hash


@pytest.mark.asyncio
async def test_register(anon_client: AsyncClient):
    url = '/auth/register'
    json = {'username': '123', 'password': '123'}

    response = await anon_client.post(url)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await anon_client.post(url, json=json)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {'username': '123'}

    response = await anon_client.post(url, json=json)
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.asyncio
async def test_login(anon_client: AsyncClient, db_session: AsyncSession):
    url = '/auth/token'
    username = 'username'
    password = 'password'

    user = User(username=username, hashed_password=get_password_hash(password))
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)

    response = await anon_client.post(url)
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await anon_client.post(url, data=dict(username=username + "1", password=password))
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = await anon_client.post(url, data=dict(username=username, password=password + "1"))
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = await anon_client.post(url, data=dict(username=username, password=password))
    assert response.status_code == status.HTTP_200_OK

    json = response.json()

    assert type(json['access_token']) == str
    assert json['token_type'] == 'bearer'


@pytest.mark.asyncio
async def test_me(anon_client: AsyncSession, user_client: AsyncSession, db_session: AsyncSession):
    url = '/auth/me'

    user = User.from_orm((await db_session.execute(select(User))).scalar_one())

    response = await anon_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = await user_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {'username': user.username}
