from sqladmin import ModelView

from .schemas import User


class UserAdmin(ModelView, model=User):
    column_list = [User.id, User.username]

    form_excluded_columns = [User.hashed_password]
    column_details_exclude_list = [User.hashed_password]
