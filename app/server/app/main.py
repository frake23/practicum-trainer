from fastapi import FastAPI

from .code import router as code_router

app = FastAPI()

app.include_router(code_router)

