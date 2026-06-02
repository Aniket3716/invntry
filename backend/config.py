from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/inventory_db"
    APP_ENV: str = "development"

    class Config:
        env_file = ".env"


settings = Settings()