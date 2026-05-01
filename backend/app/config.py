from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "a-very-secret-key-change-in-production-abc123xyz"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480
    APP_NAME: str = "PropertyHub"

    class Config:
        env_file = ".env"


settings = Settings()
