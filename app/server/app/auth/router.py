from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select

from ..db import get_session
from .di import require_current_user
from .schemas import BaseUser, LoginResponse, RegisterRequest, User
from .utils import get_access_token, get_password_hash, verify_password

router = APIRouter(
    prefix='/auth',
    tags=['auth']
)


@router.post("/token", response_model=LoginResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    result = await session.execute(select(User).where(User.username == form_data.username))
    db_user = result.scalar_one_or_none()

    if (
        db_user is None or
        not verify_password(form_data.password, db_user.hashed_password)
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Wrong email/password"
        )

    return LoginResponse(
        access_token=get_access_token(User.from_orm(db_user).dict()),
        token_type="bearer"
    )


@router.post("/register", response_model=BaseUser)
async def register(user: RegisterRequest, session: Session = Depends(get_session)):
    result = await session.execute(select(User).where(User.username == user.username))
    db_user = result.scalar_one_or_none()

    if db_user is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this username already exists"
        )

    hashed_password = get_password_hash(user.password)

    user = User(hashed_password=hashed_password, **user.dict())

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


@router.get("/me", response_model=BaseUser)
async def me(user: User = Depends(require_current_user)):
    return user
