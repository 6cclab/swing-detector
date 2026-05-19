"""
Redis-based worker that consumes swing analysis jobs.

Listens on a Redis list (BRPOP) for jobs published by the Go API.
Each job contains a swing_id, video_path, handedness, and user_id.
The worker runs the ML pipeline and writes results back to Postgres.
"""

import json
import logging
import os
import signal
import sys
import time

import redis
import sqlalchemy
from sqlalchemy import text
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings
from app.pipeline.orchestrator import analyze_swing
from app.pipeline.frame_renderer import render_key_frames

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger(__name__)

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379")
REDIS_QUEUE = os.environ.get("REDIS_QUEUE", "swing:analyze")
DATABASE_URL = os.environ.get("DATABASE_URL", settings.database_url)
VIDEO_STORAGE_PATH = os.environ.get("VIDEO_STORAGE_PATH", settings.video_storage_path)

shutdown = False


def signal_handler(signum, frame):
    global shutdown
    logger.info("Shutdown signal received, finishing current job...")
    shutdown = True


signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def get_db_session() -> tuple[sessionmaker, sqlalchemy.engine.Engine]:
    engine = sqlalchemy.create_engine(DATABASE_URL)
    session_factory = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)
    return session_factory, engine


def save_phase_frames(swing_id: str, video_path: str, analysis_data: dict):
    """Pre-render skeleton overlay frames for each phase and save to disk."""
    phases_detected = analysis_data.get("phases_detected", [])
    pose_frames = analysis_data.get("pose_frames", [])

    if not phases_detected or not pose_frames:
        return

    phase_key_frames = {}
    for phase in phases_detected:
        start = phase["start_frame"]
        end = phase["end_frame"]
        phase_key_frames[phase["phase"]] = (start + end) // 2

    frames_dir = os.path.join(VIDEO_STORAGE_PATH, swing_id)
    os.makedirs(frames_dir, exist_ok=True)

    rendered = render_key_frames(
        video_path=video_path,
        pose_frames_data=pose_frames,
        phase_key_frames=phase_key_frames,
    )

    for phase_name, jpeg_bytes in rendered.items():
        frame_path = os.path.join(frames_dir, f"{phase_name}.jpg")
        with open(frame_path, "wb") as f:
            f.write(jpeg_bytes)

    logger.info(f"Saved {len(rendered)} phase frames for swing {swing_id}")


def process_job(job_data: dict, session_factory: sessionmaker):
    swing_id = job_data["swing_id"]
    video_path = job_data["video_path"]
    handedness = job_data.get("handedness", "right")
    user_id = job_data.get("user_id", "anonymous")

    db = session_factory()
    try:
        # Set status to processing
        db.execute(
            text("UPDATE swings SET status = :status WHERE id = :id"),
            {"status": "processing", "id": swing_id},
        )
        db.commit()

        logger.info(f"Processing swing {swing_id}")
        start = time.time()

        result = analyze_swing(
            video_path=video_path,
            user_id=user_id,
            swing_id=swing_id,
            handedness=handedness,
        )

        elapsed = time.time() - start
        logger.info(f"Analysis complete for {swing_id} in {elapsed:.1f}s, score={result.overall_score}")

        analysis_json = result.model_dump_json()

        # Pre-render phase frames
        analysis_data = json.loads(analysis_json)
        save_phase_frames(swing_id, video_path, analysis_data)

        # Update swing with results
        db.execute(
            text(
                "UPDATE swings SET status = :status, overall_score = :score, "
                "analysis_json = :json WHERE id = :id"
            ),
            {
                "status": "complete",
                "score": result.overall_score,
                "json": analysis_json,
                "id": swing_id,
            },
        )
        db.commit()

    except Exception as e:
        logger.exception(f"Failed to process swing {swing_id}")
        db.execute(
            text(
                "UPDATE swings SET status = :status, error_message = :msg WHERE id = :id"
            ),
            {
                "status": "failed",
                "msg": str(e)[:500],
                "id": swing_id,
            },
        )
        db.commit()
    finally:
        db.close()


def main():
    logger.info(f"Worker starting, queue={REDIS_QUEUE}")

    r = redis.from_url(REDIS_URL)
    r.ping()
    logger.info("Connected to Redis")

    session_factory, engine = get_db_session()
    logger.info("Connected to database")

    while not shutdown:
        try:
            result = r.brpop(REDIS_QUEUE, timeout=5)
            if result is None:
                continue

            _, raw = result
            job_data = json.loads(raw)
            logger.info(f"Received job: swing_id={job_data.get('swing_id')}")

            process_job(job_data, session_factory)

        except redis.ConnectionError:
            logger.error("Redis connection lost, reconnecting in 5s...")
            time.sleep(5)
            r = redis.from_url(REDIS_URL)
        except Exception:
            logger.exception("Unexpected error in worker loop")
            time.sleep(1)

    engine.dispose()
    r.close()
    logger.info("Worker shutdown complete")


if __name__ == "__main__":
    main()
