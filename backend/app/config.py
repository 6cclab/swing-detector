from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://swing:swing@localhost:5432/swing_detector"
    secret_key: str = "change-me-in-production"
    video_storage_path: str = "./uploads"
    target_fps: int = 30
    mediapipe_model_complexity: int = 1

    model_config = {"env_file": ".env"}


settings = Settings()
