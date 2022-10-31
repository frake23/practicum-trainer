
from pydantic import BaseSettings


class Settings(BaseSettings):
    db_host: str = "pg"
    db_name: str = "postgres"
    db_user: str = "postgres"
    db_password: str = "postgres"
    serverless_bot_token: str = "AQVN0Tl-oJ0q4cCIM6k3rO6V31o0J1yL7jiwktEg"
    serverless_url: str = "https://bbat1u12e72mcgr3cf6h.containers.yandexcloud.net/"

    class Config:
        env_file = ".env"


settings = Settings()
