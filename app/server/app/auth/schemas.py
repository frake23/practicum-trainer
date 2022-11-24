from pydantic import BaseModel
from sqlmodel import Field, SQLModel


class BaseUser(SQLModel):
    username: str = Field(index=True, unique=True)


class User(BaseUser, table=True):
    id: int = Field(primary_key=True)
    hashed_password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class RegisterRequest(BaseUser):
    password: str
