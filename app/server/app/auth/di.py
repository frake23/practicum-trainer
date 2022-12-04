from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlmodel import Session, select

from app.db import get_session

from app.auth.schemas import User
from app.auth.utils import get_decoded_data

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token", auto_error=False)


async def get_current_user(token: str | None = Depends(oauth2_scheme), session: Session = Depends(get_session)) -> User | None:
    if token is None:
        return None

    try:
        user = get_decoded_data(token)
        id = user.get('id')

        result = await session.execute(select(User).where(User.id == id))

        user = result.scalar_one_or_none()

        if (
            not id or
            not user
        ):
            return None

        return user
    except JWTError:
        return None


async def require_current_user(user: User | None = Depends(get_current_user)):
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inbalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"}
        )

    return user
