from jose import jwt
from passlib.context import CryptContext

from app.settings import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated='auto')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)


def get_access_token(data: dict) -> str:
    return jwt.encode(data, settings.jwt_secret_key, settings.jwt_algorithm)


def get_decoded_data(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key,
                      [settings.jwt_algorithm])
