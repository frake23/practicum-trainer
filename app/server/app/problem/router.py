import asyncio
from http import HTTPStatus
from urllib.parse import urljoin
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
import aiohttp
from sqlalchemy.orm import selectinload

from ..snippet.schemas import ServerlessFile, SnippetBase

from ..enums import Languages

from .schemas import GetProblemResponse, Problem, GetProblemsResponseItem, ProblemBase, ProblemTest, Solution, SolutionBase, SolveProblemResponseItem
from ..auth.schemas import User
from ..auth.di import require_current_user
from sqlmodel import Session, select, func
from ..db import get_session
from ..settings import settings

router = APIRouter(
    prefix="/problems",
    tags=["problem"]
)


@router.get('/', response_model=list[GetProblemsResponseItem])
async def get_problems(user: User = Depends(require_current_user), session: Session = Depends(get_session)):
    result = await session.execute(
        select(Problem, func.bool_or(Solution.solved).label('solved')).join(
            Solution, onclause=Solution.problem_id == Problem.id, isouter=True
        ).join(
            User, onclause=Solution.user_id == user.id, isouter=True
        ).group_by(Problem.id).order_by(Problem.date_created.desc())
    )

    return [
        GetProblemsResponseItem(
            solved=solved,
            **Problem.from_orm(problem).dict()
        )
        for problem, solved in result.all()
    ]


@router.get('/{problem_id}', response_model=GetProblemResponse)
async def get_problem(problem_id: UUID, user: User = Depends(require_current_user), session: Session = Depends(get_session)):
    result = await session.execute(select(Problem).where(Problem.id == problem_id))

    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    print(problem)

    result = await session.execute(
        select(Solution).where(
            Solution.problem_id == problem.id,
            Solution.user_id == user.id
        ).order_by(Solution.date_created.desc())
    )

    return GetProblemResponse(**ProblemBase.from_orm(problem).dict(), solutions=list(result.scalars()), id=problem.id)


def serverless_payload_from_request(request: SolutionBase, test: ProblemTest) -> dict:
    language = request.language

    files = {
        Languages.go.value: 'main.go',
        Languages.python.value: 'main.py'
    }

    commands = {
        Languages.go.value: f'go run {files[Languages.go.value]} <<< {test.input}',
        Languages.python.value: f'python {files[Languages.python.value]} <<< {test.input}'
    }

    file = ServerlessFile(name=files[language], content=request.content)

    return {"files": [file.dict()], "command": commands[language]}


async def check_code(session: aiohttp.ClientSession, request: SolutionBase, payload: dict) -> ServerlessFile:
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


@router.post('/{problem_id}/solve', response_model=list[SolveProblemResponseItem])
async def solve_problem(request: SnippetBase, problem_id: UUID,   user: User = Depends(require_current_user), session: Session = Depends(get_session)):
    result = await session.execute(select(Problem).where(Problem.id == problem_id).options(selectinload(Problem.tests)))

    db_problem = result.scalar_one_or_none()

    problem = Problem.from_orm(db_problem)
    problem.tests = [ProblemTest.from_orm(test) for test in db_problem.tests]

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    async with aiohttp.ClientSession() as aiohttp_session:
        tasks = []
        for test in problem.tests:
            payload = serverless_payload_from_request(request, test)
            print(payload)
            tasks.append(check_code(aiohttp_session, request, payload))

        results = await asyncio.gather(*tasks)

        tests_solved = []

        solution_solved = True

        for i, result in enumerate(results):
            solved = result['stdout'].split(
                    '\n')[0] == problem.tests[i].output
            
            if not solved:
                solution_solved = False

            tests_solved.append(SolveProblemResponseItem(
                is_solved=solved,
                is_error=result['stderr'] != '')
            )
        
        solution = Solution(
            **request.dict(),
            solved=solution_solved,
            problem_id=problem.id,
            user_id=user.id
        )

        session.add(solution)
        await session.commit()
        await session.refresh(solution)

        return tests_solved
