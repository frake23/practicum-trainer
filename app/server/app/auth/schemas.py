from pydantic import BaseModel
from sqlmodel import Field, Relationship, SQLModel


class BaseUser(SQLModel):
    username: str = Field(index=True, unique=True)


class UserRole(SQLModel, table=True):
    id: int = Field(primary_key=True)

    user_id: int = Field(foreign_key="user.id")
    role_id: int = Field(foreign_key="role.id")


class Role(SQLModel, table=True):
    id: int = Field(primary_key=True)

    name: str = Field(unique=True)


class User(BaseUser, table=True):
    id: int = Field(primary_key=True)

    hashed_password: str

    roles: list[Role] = Relationship(link_model=UserRole)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str


class RegisterRequest(BaseUser):
    password: str
