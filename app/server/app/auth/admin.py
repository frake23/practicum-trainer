from sqladmin import ModelView
from sqladmin.authentication import AuthenticationBackend
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from starlette.requests import Request

from app.auth.schemas import Role, User, UserRole
from app.auth.utils import get_access_token, get_decoded_data, get_password_hash, verify_password
from app.db import get_session
from app.settings import settings


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username]

    form_excluded_columns = [User.hashed_password]
    column_details_exclude_list = [User.hashed_password]


class AdminBackend(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username, password = form["username"], form["password"]
        request.session.update({"token": "admin-token"})

        if username == settings.superadmin_username and password == settings.superadmin_password:
            return True

        return False
        # session = await anext(get_session())

        # result = await session.execute(select(User).where(User.username == username).options(selectinload(User.roles)))
        # db_user = result.scalar_one_or_none()

        # if (
        #     db_user is None or
        #     not verify_password(password, db_user.hashed_password)
        # ):
        #     return False

        # if 'admin' in db_user.roles:
        #     request.session.update(
        #         {"token": get_access_token(User.from_orm(db_user).dict())})

        #     return True

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        token = request.session.get('token')

        if token is None:
            return False

        return True
        # user = get_decoded_data()
        # id = user.get('id')

        # async with get_session() as session:
        #     result = await session.execute(select(User).where(User.id == id)).options(selectinload(User.roles))

        #     user = result.scalar_one_or_none()

        #     if (
        #         not id or
        #         not user
        #     ):
        #         return None

        #     return 'admin' in user.roles


async def create_admin(session: Session):
    result = await session.execute(select(User).where(User.username == settings.superadmin_username))
    db_user = result.scalar_one_or_none()

    if not db_user is None:
        return

    role = Role(name="admin")
    user = User(
        username=settings.superadmin_username,
        hashed_password=get_password_hash(settings.superadmin_password)
    )

    session.add(role)
    session.add(user)
    await session.commit()
    await session.refresh(role)
    await session.refresh(user)

    session.add(UserRole(user_id=user.id, role_id=role.id))
    await session.commit()
