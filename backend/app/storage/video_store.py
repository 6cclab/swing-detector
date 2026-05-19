import os
import uuid

from app.config import settings


def save_video(data: bytes, extension: str = ".mp4") -> str:
    os.makedirs(settings.video_storage_path, exist_ok=True)
    filename = f"{uuid.uuid4()}{extension}"
    path = os.path.join(settings.video_storage_path, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path
