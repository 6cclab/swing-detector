from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://swing:swing@localhost:5432/swing_detector"
    video_storage_path: str = "./uploads"
    target_fps: int = 30
    mediapipe_model_complexity: int = 1
    redis_url: str = "redis://localhost:6379"
    redis_queue: str = "swing:analyze"

    model_config = {"env_file": ".env"}


settings = Settings()
