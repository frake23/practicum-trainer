import asyncio
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
import httpx
from sqlalchemy.orm import selectinload

from app.code import check_code, serverless_payload_from_request

from app.problem.schemas import GetProblemResponse, Problem, GetProblemsResponseItem, ProblemBase, ProblemTest, Solution, SolveProblemRequest, SolveProblemResponseItem
from app.auth.schemas import User
from app.auth.di import require_current_user
from sqlmodel import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db import get_session

router = APIRouter(
    prefix="/problems",
    tags=["problem"]
)


@router.get('/', response_model=list[GetProblemsResponseItem])
async def get_problems(user: User = Depends(require_current_user), session: AsyncSession = Depends(get_session)):
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
async def get_problem(problem_id: UUID, user: User = Depends(require_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Problem).where(Problem.id == problem_id))

    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    result = await session.execute(
        select(Solution).where(
            Solution.problem_id == problem.id,
            Solution.user_id == user.id
        ).order_by(Solution.date_created.desc())
    )

    return GetProblemResponse(**ProblemBase.from_orm(problem).dict(), solutions=list(result.scalars()), id=problem.id)


@router.post('/{problem_id}/solve', response_model=list[SolveProblemResponseItem])
async def solve_problem(request: SolveProblemRequest, problem_id: UUID, user: User = Depends(require_current_user), session: AsyncSession = Depends(get_session)):
    result = await session.execute(select(Problem).where(Problem.id == problem_id).options(selectinload(Problem.tests)))

    db_problem = result.scalar_one_or_none()

    problem = Problem.from_orm(db_problem)
    problem.tests = [ProblemTest.from_orm(test) for test in db_problem.tests]

    if not problem:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Problem not found"
        )

    async with httpx.AsyncClient() as client:
        tasks = []
        for test in problem.tests:
            payload = serverless_payload_from_request(
                language=request.language, content=request.content, test_input=test.input,)
            tasks.append(check_code(
                client=client, language=request.language, payload=payload,))

        results = await asyncio.gather(*tasks)

        tests_solved = []

        solution_solved = True

        for i, result in enumerate(results):
            if result is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Error while request to serverless"
                )

            solved = result["stderr"] == '' and result['stdout'].split(
                '\n') == problem.tests[i].output.split('\n')

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
