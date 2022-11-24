from uuid import UUID, uuid4

from pydantic import BaseModel
from sqlmodel import Field, SQLModel, Relationship

from app.db import TimestampMixin

from ..enums import Languages
from ..auth.schemas import User


class ProblemBase(SQLModel):
    name: str
    text: str
    complexity: int = Field(ge=1, le=5)


class Problem(ProblemBase, TimestampMixin, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)

    tests: list['ProblemTest'] | None = Relationship(back_populates="problem")


class ProblemTest(SQLModel, table=True):
    id: int = Field(primary_key=True)
    input: str
    output: str

    problem_id: UUID = Field(foreign_key="problem.id")

    problem: Problem | None = Relationship(back_populates="tests")


class SolutionBase(SQLModel):
    content: str
    language: Languages
    solved: bool | None = None


class Solution(SolutionBase, TimestampMixin, table=True):
    id: int = Field(primary_key=True)

    problem_id: UUID = Field(foreign_key="problem.id")
    user_id: int = Field(foreign_key="user.id")

    problem: Problem | None = Relationship()
    user: User | None = Relationship()


class GetProblemsResponseItem(ProblemBase):
    id: UUID
    solved: bool | None


class GetProblemResponse(ProblemBase):
    id: UUID
    solutions: list[SolutionBase]


class SolveProblemResponseItem(BaseModel):
    is_error: bool
    is_solved: bool
