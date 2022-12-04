
from pydantic import BaseSettings


class Settings(BaseSettings):
    db_host: str = "pg"
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str = "postgres"
    db_url: str = f"postgresql+asyncpg://{db_user}:{db_password}@{db_host}/{db_name}"

    test_db_host: str = "test_pg"
    test_db_name: str = "postgres"
    test_db_user: str = "postgres"
    test_db_password: str = "postgres"
    test_db_url: str = f"postgresql+asyncpg://{test_db_user}:{test_db_password}@{test_db_host}/{test_db_name}"

    serverless_bot_token: str = "AQVN0Tl-oJ0q4cCIM6k3rO6V31o0J1yL7jiwktEg"
    serverless_url_python: str = "https://bbat1u12e72mcgr3cf6h.containers.yandexcloud.net/"
    serverless_url_go: str = "https://bbaoe4li7ha278shsbrs.containers.yandexcloud.net/"

    jwt_secret_key: str = '36f9e12e7a95d9cd0f9553f2f270b758c6d21369af1eb75c39316a7d2509961d'
    jwt_algorithm: str = 'HS256'

    admin_backend_secret: str = "some-secret-admin-key"
    superadmin_username: str = "admin"
    superadmin_password: str = "admin"

    class Config:
        env_file = ".env"


settings = Settings()
