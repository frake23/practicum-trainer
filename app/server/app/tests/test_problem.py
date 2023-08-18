
from urllib.parse import urljoin
from uuid import uuid4
from httpx import AsyncClient
from pytest_httpx import HTTPXMock
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import status
import pytest
from sqlmodel import select
from app.auth.schemas import User
from app.db import save_entity
from app.enums import Languages

from app.settings import settings
from app.problem.schemas import Problem, ProblemTest, Solution


@pytest.mark.asyncio
async def test_get_problem(user_client: AsyncClient, anon_client: AsyncClient, db_session: AsyncSession):
    url = '/problems/{}'

    response = await anon_client.get(url.format(uuid4()))
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = await user_client.get(url.format('random-id'))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    response = await user_client.get(url.format(uuid4()))
    assert response.status_code == status.HTTP_404_NOT_FOUND

    problem = await save_entity(db_session, Problem(name='problem 1', text='problem text', complexity=1))

    response = await user_client.get(url.format(problem.id))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == dict(
        id=str(problem.id),
        name=problem.name,
        text=problem.text,
        solutions=[],
    )

    user_id = (await db_session.execute(select(User))).scalar_one().id
    user2 = await save_entity(db_session, User(username='some-username', hashed_password='some-hashed-pwd'))

    solution = await save_entity(db_session, Solution(content='some code', language=Languages.python,
                                                      solved=False, problem_id=problem.id, user_id=user_id))
    Solution(content='some code', language=Languages.python,
             solved=False, problem_id=problem.id, user_id=user2.id)

    response = await user_client.get(url.format(problem.id))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == dict(
        id=str(problem.id),
        name=problem.name,
        text=problem.text,
        solutions=[dict(content=solution.content,
                        language=solution.language, solved=solution.solved)],
    )


@pytest.mark.asyncio
async def test_get_problems(user_client: AsyncClient, anon_client: AsyncClient, db_session: AsyncSession):
    url = '/problems/'

    response = await anon_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    problem1 = await save_entity(db_session, Problem(name='problem 1', text='problem text', complexity=1))
    problem2 = await save_entity(db_session, Problem(name='problem 2', text='problem text', complexity=2))
    problem3 = await save_entity(db_session, Problem(name='problem 3', text='problem text', complexity=3))

    user_id = (await db_session.execute(select(User))).scalar_one().id

    s = await save_entity(db_session, Solution(content='some code', solved=False, language=Languages.go, problem_id=problem2.id, user_id=user_id))
    await save_entity(db_session, Solution(content='some code', solved=False, language=Languages.python, problem_id=problem3.id, user_id=user_id))
    await save_entity(db_session, Solution(content='some code', solved=True, language=Languages.python, problem_id=problem3.id, user_id=user_id))

    response = await user_client.get(url)
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [
        {'name': problem3.name, 'text': problem3.text,
            'id': str(problem3.id), 'solved': True, 'complexity': problem1.complexity},
        {'name': problem2.name, 'text': problem2.text,
            'id': str(problem2.id), 'solved': False, 'complexity': problem2.complexity},
        {'name': problem1.name, 'text': problem1.text,
            'id': str(problem1.id), 'solved': None, 'complexity': problem3.complexity},
    ]


@pytest.mark.asyncio
async def test_solve_problem(user_client: AsyncClient, anon_client: AsyncClient, db_session: AsyncSession, httpx_mock: HTTPXMock):
    url = '/problems/{}/solve'

    problem = await save_entity(db_session, Problem(name='problem 1', text='problem text', complexity=1))

    response = await anon_client.post(url.format(problem.id))
    assert response.status_code == status.HTTP_401_UNAUTHORIZED

    response = await user_client.post(url.format(uuid4()))
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    test1 = await save_entity(db_session, ProblemTest(input='some input 1', output='some output 1', problem_id=problem.id))
    test2 = await save_entity(db_session, ProblemTest(input='some input 1', output='some output 1', problem_id=problem.id))

    mock_responses = [
        dict(exit_code=0, stderr='', stdout=test1.output + '\n',),
        dict(exit_code=0, stderr='', stdout=test2.output+ '\n',),
        dict(exit_code=0, stderr='', stdout=test1.output+ '\n'),
        dict(exit_code=0, stderr='somerr', stdout=''),
        dict(exit_code=0, stderr='', stdout=test1.output+ '\n'),
        dict(exit_code=0, stderr='', stdout=test2.output + '2\n'),
    ]

    for response in mock_responses:
        httpx_mock.add_response(
            url=urljoin(settings.serverless_url_python, 'run/'),
            status_code=status.HTTP_200_OK,
            json=response
        )

    httpx_mock.add_response(
        url=urljoin(settings.serverless_url_python, 'run/'),
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        json={}
    )

    response = await user_client.post(url.format(problem.id), json=dict(language='python', content='some-content'))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{'is_error': False, 'is_solved': True}, {'is_error': False, 'is_solved': True}]

    response = await user_client.post(url.format(problem.id), json=dict(language='python', content='some-content'))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{'is_error': False, 'is_solved': True}, {'is_error': True, 'is_solved': False}]

    response = await user_client.post(url.format(problem.id), json=dict(language='python', content='some-content'))
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == [{'is_error': False, 'is_solved': True}, {'is_error': False, 'is_solved': False}]

    response = await user_client.post(url.format(problem.id), json=dict(language='python', content='some-content'))
    assert response.status_code == status.HTTP_400_BAD_REQUEST
