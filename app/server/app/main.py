from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import init_db

from .snippet.router import router as snippet_router

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

@app.on_event("startup")
async def on_startup():
    await init_db()

