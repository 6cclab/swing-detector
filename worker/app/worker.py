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
import tempfile
import time
import urllib.request

import boto3
import redis
import sqlalchemy
from sqlalchemy import text
from sqlalchemy.orm import sessionmaker

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
API_INTERNAL_URL = os.environ.get(
    "API_INTERNAL_URL", "http://swing-detector-api.swing-detector.svc"
)

S3_ENDPOINT = os.environ.get("S3_ENDPOINT", "")
S3_BUCKET = os.environ.get("S3_BUCKET", "swing-iq")
S3_ACCESS_KEY = os.environ.get("S3_ACCESS_KEY", "")
S3_SECRET_KEY = os.environ.get("S3_SECRET_KEY", "")
S3_REGION = os.environ.get("S3_REGION", "garage")

shutdown = False
s3_client = None


def get_s3_client():
    global s3_client
    if s3_client is None and S3_ENDPOINT:
        s3_client = boto3.client(
            "s3",
            endpoint_url=S3_ENDPOINT,
            aws_access_key_id=S3_ACCESS_KEY,
            aws_secret_access_key=S3_SECRET_KEY,
            region_name=S3_REGION,
        )
    return s3_client


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


def download_video(video_key: str) -> str:
    """Download video from S3 to a temp file and return the local path."""
    client = get_s3_client()
    suffix = os.path.splitext(video_key)[1] or ".mp4"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        client.download_fileobj(S3_BUCKET, video_key, tmp)
        tmp.close()
        return tmp.name
    except Exception:
        tmp.close()
        os.unlink(tmp.name)
        raise


def save_phase_frames(swing_id: str, video_path: str, analysis_data: dict, handedness: str = "right"):
    """Pre-render skeleton overlay frames for each phase and upload to S3."""
    phases_detected = analysis_data.get("phases_detected", [])
    pose_frames = analysis_data.get("pose_frames", [])

    if not phases_detected or not pose_frames:
        return

    phase_key_frames = {}
    for phase in phases_detected:
        start = phase["start_frame"]
        end = phase["end_frame"]
        mid = (start + end) // 2
        if mid < len(pose_frames):
            phase_key_frames[phase["phase"]] = pose_frames[mid]["frame_index"]

    rendered = render_key_frames(
        video_path=video_path,
        pose_frames_data=pose_frames,
        phase_key_frames=phase_key_frames,
        handedness=handedness,
    )

    client = get_s3_client()
    for phase_name, jpeg_bytes in rendered.items():
        key = f"frames/{swing_id}/{phase_name}.jpg"
        client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=jpeg_bytes,
            ContentType="image/jpeg",
        )

    logger.info(f"Saved {len(rendered)} phase frames for swing {swing_id}")


def notify_scan_complete(swing_id: str, user_id: str, swing_count: int, timestamps: list):
    """Notify the API that swing detection (scan) is done, before full analysis."""
    try:
        payload = json.dumps({
            "swing_id": swing_id,
            "user_id": user_id,
            "event": "scan_complete",
            "swing_count": swing_count,
            "timestamps": timestamps,
        }).encode()
        req = urllib.request.Request(
            f"{API_INTERNAL_URL}/internal/notify/scan-complete",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            logger.info(f"Scan notification sent for swing {swing_id}: {swing_count} swings")
    except Exception:
        logger.warning(f"Failed to send scan notification for swing {swing_id}", exc_info=True)


def notify_swing_complete(swing_id: str, user_id: str):
    """Call the Go API internal endpoint to send a push notification."""
    try:
        payload = json.dumps({"swing_id": swing_id, "user_id": user_id}).encode()
        req = urllib.request.Request(
            f"{API_INTERNAL_URL}/internal/notify/swing-complete",
            data=payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            logger.info(f"Notification sent for swing {swing_id}: {resp.status}")
    except Exception:
        logger.warning(f"Failed to send notification for swing {swing_id}", exc_info=True)


def _save_result(db, swing_id: str, user_id: str, result, video_path: str, handedness: str):
    analysis_json = result.model_dump_json()
    analysis_data = json.loads(analysis_json)
    save_phase_frames(swing_id, video_path, analysis_data, handedness)

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
    notify_swing_complete(swing_id, user_id)


def process_job(job_data: dict, session_factory: sessionmaker):
    swing_id = job_data["swing_id"]
    video_key = job_data["video_path"]
    handedness = job_data.get("handedness", "right")
    user_id = job_data.get("user_id", "anonymous")

    db = session_factory()
    local_video_path = None
    try:
        db.execute(
            text("UPDATE swings SET status = :status WHERE id = :id"),
            {"status": "processing", "id": swing_id},
        )
        db.commit()

        logger.info(f"Processing swing {swing_id}, downloading from S3: {video_key}")
        local_video_path = download_video(video_key)

        start = time.time()
        from app.pipeline.orchestrator import analyze_multi_swing

        def on_scan(count, timestamps):
            notify_scan_complete(swing_id, user_id, count, timestamps)

        results = analyze_multi_swing(
            video_path=local_video_path,
            user_id=user_id,
            parent_swing_id=swing_id,
            handedness=handedness,
            on_scan=on_scan,
        )
        elapsed = time.time() - start
        logger.info(f"Analysis complete for {swing_id} in {elapsed:.1f}s, {len(results)} swing(s) detected")

        if len(results) == 1:
            _save_result(db, swing_id, user_id, results[0], local_video_path, handedness)
        else:
            db.execute(
                text("UPDATE swings SET status = :status WHERE id = :id"),
                {"status": "split", "id": swing_id},
            )
            db.commit()

            for i, result in enumerate(results):
                child_id = result.swing_id
                db.execute(
                    text(
                        "INSERT INTO swings (id, user_id, video_path, handedness, status, "
                        "source_swing_id, swing_index, created_at) "
                        "VALUES (:id, :user_id, :video_path, :handedness, 'processing', "
                        ":source_id, :idx, now())"
                    ),
                    {
                        "id": child_id,
                        "user_id": user_id,
                        "video_path": video_key,
                        "handedness": handedness,
                        "source_id": swing_id,
                        "idx": i + 1,
                    },
                )
                db.commit()
                _save_result(db, child_id, user_id, result, local_video_path, handedness)
                logger.info(f"Saved child swing {child_id} ({i + 1}/{len(results)})")

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
        notify_swing_complete(swing_id, user_id)
    finally:
        db.close()
        if local_video_path and os.path.exists(local_video_path):
            os.unlink(local_video_path)


def main():
    logger.info(f"Worker starting, queue={REDIS_QUEUE}")

    r = redis.from_url(REDIS_URL)
    r.ping()
    logger.info("Connected to Redis")

    session_factory, engine = get_db_session()
    logger.info("Connected to database")

    if S3_ENDPOINT:
        get_s3_client()
        logger.info(f"Connected to S3: {S3_ENDPOINT}, bucket={S3_BUCKET}")

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
