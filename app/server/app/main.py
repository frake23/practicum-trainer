from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqladmin import Admin

from .db import init_db, engine

from .snippet.router import router as snippet_router
from .auth.router import router as auth_router
from .problem.router import router as problem_router
from .problem.admin import ProblemAdmin, ProblemTestView, SolutionView
from .auth.admin import UserAdmin

app = FastAPI()


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(snippet_router)
app.include_router(auth_router)
app.include_router(problem_router)

admin = Admin(app, engine)

admin.add_view(UserAdmin)
admin.add_view(ProblemAdmin)
admin.add_view(SolutionView)
admin.add_view(ProblemTestView)


@app.on_event("startup")
async def on_startup():
    await init_db()
