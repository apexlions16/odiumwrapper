from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    jwt_secret: str = "development-only-change-me"
    access_token_minutes: int = 10080
    cors_origins: str = "*"
    database_path: str = "data/odium.db"
    local_storage_path: str = "storage"
    hf_token: str | None = None
    hf_storage_repo: str | None = None
    hf_storage_public: bool = True
    disable_demo_users: bool = False
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False)

    @property
    def cors_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
