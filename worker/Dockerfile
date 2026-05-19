FROM python:3.12-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

FROM python:3.12-slim

WORKDIR /app

ENV MPLCONFIGDIR=/tmp/matplotlib

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 curl && \
    rm -rf /var/lib/apt/lists/* && \
    useradd -r -u 10001 -s /bin/false appuser

COPY --from=builder /install /usr/local

RUN mkdir -p /app/models && \
    curl -sL -o /app/models/pose_landmarker_full.task \
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task"

COPY . .

RUN mkdir -p /app/uploads /app/checkpoints && \
    chown -R appuser:appuser /app/uploads /app/checkpoints

USER 10001

CMD ["python", "-m", "app.worker"]
