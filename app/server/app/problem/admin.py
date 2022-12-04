from sqladmin import ModelView

from app.problem.schemas import Problem, Solution, ProblemTest


class ProblemAdmin(ModelView, model=Problem):
    column_list = [Problem.name, Problem.text,
                   Problem.complexity]


class SolutionView(ModelView, model=Solution):
    column_list = [Solution.language, Solution.content,
                   Solution.solved, Solution.problem, Solution.user]


class ProblemTestView(ModelView, model=ProblemTest):
    column_list = [ProblemTest.input, ProblemTest.output]
