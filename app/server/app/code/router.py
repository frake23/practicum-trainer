from fastapi import APIRouter

router = APIRouter(
    prefix="/code",
    tags=["code"]
)

@router.post('/run')
def code_run():
    