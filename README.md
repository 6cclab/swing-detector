# Swing Detector

AI-powered golf swing analysis system that uses pose estimation and machine learning to detect swing phases, analyze body mechanics, compare against professional benchmarks, and provide personalized coaching feedback.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Mobile App                     │
│          React Native / Expo (iOS/Android)        │
│                                                   │
│  ┌──────────┐ ┌─────────┐ ┌──────────┐ ┌───────┐│
│  │  Record   │ │ History │ │ Progress │ │Profile││
│  │  Camera   │ │  List   │ │  Charts  │ │       ││
│  └─────┬─────┘ └────┬────┘ └────┬─────┘ └───────┘│
│        │            │           │                  │
│  ┌─────┴────────────┴───────────┴──────────────┐  │
│  │           Swing Detail Screen                │  │
│  │  ScoreRing · PhaseCard · AngleGauge          │  │
│  │  PoseOverlay · CoachingTips · Compare        │  │
│  └──────────────────┬──────────────────────────┘  │
└─────────────────────┼─────────────────────────────┘
                      │ REST API
┌─────────────────────┼─────────────────────────────┐
│                     │        Backend API           │
│              FastAPI + PostgreSQL                   │
│                                                     │
│  ┌──────────────────┴──────────────────────────┐   │
│  │              ML Pipeline                     │   │
│  │                                              │   │
│  │  Video → MediaPipe Pose → Phase Detection    │   │
│  │  → Angle Calculation → Benchmark Comparison  │   │
│  │  → Fault Detection → Coaching Engine         │   │
│  │                                              │   │
│  │  4 Trainable Models:                         │   │
│  │   · Phase Classifier (Bi-LSTM)               │   │
│  │   · Quality Scorer (1D-CNN + Attention)       │   │
│  │   · Fault Detector (LSTM + per-fault heads)   │   │
│  │   · Swing Embedder (Dilated CNN)              │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)
- Expo Go app on your phone (for mobile development)

### Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download MediaPipe pose model
python -c "
import urllib.request, os
os.makedirs('models', exist_ok=True)
urllib.request.urlretrieve(
    'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
    'models/pose_landmarker_full.task'
)
print('Model downloaded')
"

# Start PostgreSQL
docker compose up db -d

# Run the API server
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Docs at http://localhost:8000/docs
```

### Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Set API URL (use your machine's IP for physical device testing)
export EXPO_PUBLIC_API_URL=http://192.168.x.x:8000

# Start Expo dev server
npx expo start
```

Scan the QR code with Expo Go on your phone to launch the app.

### Test the Pipeline (No Server Needed)

```bash
cd backend
source .venv/bin/activate

# Analyze a swing video directly
python scripts/run_analysis.py --video /path/to/swing.mp4 --no-frames

# Output: JSON with overall score, phase breakdown, angles, coaching tips
```

---

## Project Structure

```
swing-detector/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── config.py               # Settings (pydantic-settings)
│   │   ├── api/
│   │   │   ├── auth.py             # JWT authentication
│   │   │   ├── swings.py           # Upload, analysis, frame endpoints
│   │   │   ├── progress.py         # User progress tracking
│   │   │   └── router.py           # Route aggregation
│   │   ├── schemas/
│   │   │   ├── analysis.py         # Core data models (poses, angles, results)
│   │   │   ├── swing.py            # API request/response schemas
│   │   │   └── user.py             # User schemas
│   │   ├── models/                 # SQLAlchemy ORM models
│   │   ├── pipeline/               # Analysis pipeline
│   │   │   ├── video_processor.py  # OpenCV frame extraction
│   │   │   ├── pose_estimator.py   # MediaPipe pose detection
│   │   │   ├── phase_detector.py   # Rule-based swing phase segmentation
│   │   │   ├── angle_calculator.py # Body angle computation
│   │   │   ├── metrics_engine.py   # Per-phase angle aggregation
│   │   │   ├── benchmark_comparator.py  # Pro benchmark comparison
│   │   │   ├── coaching_engine.py  # Coaching tip generation
│   │   │   ├── frame_renderer.py   # Skeleton overlay on frames
│   │   │   └── orchestrator.py     # Full pipeline orchestration
│   │   ├── benchmarks/
│   │   │   └── pro_benchmarks.py   # Professional angle ranges
│   │   ├── ml/                     # Machine learning
│   │   │   ├── models/             # 4 PyTorch model architectures
│   │   │   ├── data/               # Dataset classes & preprocessing
│   │   │   ├── training/           # Training loop & checkpointing
│   │   │   ├── inference.py        # Model inference wrappers
│   │   │   └── registry.py         # Trained model loading
│   │   ├── storage/                # Video file storage
│   │   └── db/                     # Database setup
│   ├── scripts/
│   │   ├── run_analysis.py         # CLI swing analyzer
│   │   ├── prepare_training_data.py # Video → training JSON converter
│   │   ├── download_datasets.py    # Dataset downloader
│   │   ├── train_phase_classifier.py
│   │   ├── train_quality_scorer.py
│   │   ├── train_fault_detector.py
│   │   └── train_swing_embedder.py
│   ├── models/                     # MediaPipe model files (gitignored)
│   ├── checkpoints/                # Trained model checkpoints (gitignored)
│   ├── docker-compose.yaml
│   ├── Dockerfile
│   └── requirements.txt
│
└── mobile/
    ├── app/                        # Expo Router screens
    │   ├── login.tsx               # Auth screen
    │   ├── (tabs)/
    │   │   ├── record.tsx          # Camera recording
    │   │   ├── history.tsx         # Past swings list
    │   │   ├── progress.tsx        # Score trends
    │   │   └── profile.tsx         # User settings
    │   └── swing/
    │       ├── [id].tsx            # Analysis detail (rich UI)
    │       └── compare.tsx         # Phase-by-phase frame comparison
    ├── src/
    │   ├── components/analysis/    # ScoreRing, PhaseCard, AngleGauge, etc.
    │   ├── lib/                    # API client, auth, theme
    │   └── types/                  # TypeScript type definitions
    └── package.json
```

---

## API Reference

All endpoints require JWT authentication via `Authorization: Bearer <token>` header (except auth endpoints).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account. Body: `{email, password, name, handedness}` |
| POST | `/api/auth/login` | Sign in. Body: `{email, password}`. Returns `{access_token, user}` |
| GET | `/api/auth/me` | Get current user profile |

### Swing Analysis

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/swings/upload` | Upload swing video (multipart). Returns `{swing_id, status}`. Query param: `handedness=right\|left` |
| GET | `/api/swings/{id}` | Get analysis result. Returns analysis JSON when complete, or `{status: "processing"}` while in progress |
| GET | `/api/swings` | List user's swings (paginated). Query: `page`, `page_size` |
| GET | `/api/swings/{id}/frames` | List available phase frame URLs |
| GET | `/api/swings/{id}/frames/{phase}` | Get key frame JPEG with skeleton overlay |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/me/progress` | Score history and angle trends over time |

### Analysis Response Schema

```json
{
  "swing_id": "uuid",
  "overall_score": 72.5,
  "duration_ms": 2340.0,
  "frame_count": 85,
  "phases_detected": [
    {
      "phase": "impact",
      "start_frame": 58,
      "end_frame": 62,
      "phase_score": 68.3,
      "angles": {
        "hip_rotation_deg": 42.1,
        "shoulder_rotation_deg": 18.5,
        "spine_angle_deg": 39.2,
        "weight_transfer_ratio": 0.82
      },
      "angle_feedback": [
        {
          "angle_name": "shoulder_rotation_deg",
          "measured": 18.5,
          "pro_min": 10.0,
          "pro_max": 25.0,
          "delta": 0.0,
          "severity": "good",
          "coaching_tip": ""
        }
      ]
    }
  ],
  "coaching_summary": [
    "Your hips are under-rotating during backswing..."
  ],
  "detected_faults": [
    {"fault": "early_extension", "confidence": 0.87}
  ]
}
```

---

## ML Pipeline

### How Analysis Works

```
1. Video Upload (MP4/MOV)
   └─→ Frame Extraction (OpenCV, 30fps, max 640px wide)

2. Pose Estimation (MediaPipe PoseLandmarker)
   └─→ 33 body landmarks per frame (x, y, z, visibility)

3. Phase Detection
   ├─→ ML Model (Bi-LSTM) — if trained checkpoint exists
   └─→ Rule-based fallback — wrist velocity, rotation heuristics

4. Angle Calculation (per frame)
   └─→ Hip rotation, shoulder rotation, spine angle,
       knee flex, wrist hinge, elbow angle, weight transfer

5. Metrics Aggregation
   └─→ Median angles per phase (robust to outlier frames)

6. Benchmark Comparison
   └─→ Compare against pro ranges, compute severity + score

7. Fault Detection
   └─→ ML Model (LSTM + per-fault attention) — if trained

8. Quality Scoring
   ├─→ ML Model (1D-CNN + attention) — if trained
   └─→ Weighted average of phase scores — fallback

9. Coaching Engine
   └─→ Prioritized tips from angle deltas + detected faults
```

### 6 Swing Phases Detected

| Phase | Key Indicators |
|-------|---------------|
| Address | Static stance, low wrist velocity |
| Backswing | Wrist moves away, shoulder rotation increases |
| Top of Backswing | Maximum wrist height, momentary pause |
| Downswing | Hips lead shoulders (kinematic sequence) |
| Impact | Wrist returns to address x-position |
| Follow Through | Post-impact deceleration |

### 8 Body Angles Measured

| Angle | What It Measures | Weight |
|-------|-----------------|--------|
| Hip Rotation | Hip line angle in XZ plane | 20% |
| Shoulder Rotation | Shoulder line angle in XZ plane | 18% |
| Spine Angle | Torso tilt from vertical | 18% |
| Weight Transfer | Lead hip position ratio | 15% |
| Lead Knee Flex | Knee bend (lead side) | 10% |
| Trail Knee Flex | Knee bend (trail side) | 7% |
| Wrist Hinge | Wrist cock angle | 7% |
| Lead Elbow | Arm straightness | 5% |

### 10 Swing Faults Detected (ML)

Early extension, over-the-top, casting, sway, slide, chicken wing, loss of posture, flat shoulder plane, reverse spine angle, hanging back.

---

## Training ML Models

### 1. Get Training Data

```bash
cd backend
source .venv/bin/activate

# Download available datasets
python scripts/download_datasets.py --dataset all --output-dir ./data/raw

# See all available data sources
python scripts/download_datasets.py --dataset info
```

**Available datasets:**

| Dataset | Size | Annotations | Access |
|---------|------|-------------|--------|
| [GolfDB](https://github.com/wmcnally/golfdb) | 1,400 videos | 8 swing events, club type, view angle | GitHub + [Kaggle](https://www.kaggle.com/datasets/marcmarais/videos-160) |
| [CaddieSet](https://github.com/damilab/CaddieSet) | 1,757 shots | Joint keypoints, ball metrics, 8 phases | GitHub |
| [Penn Action](http://dreamdragon.github.io/PennAction/) | ~150 golf clips | 13 body joints per frame | Direct download |

### 2. Prepare Training Data

Convert videos to the training JSON format:

```bash
# Process pro swing videos (generates phase labels via rule-based detector)
python scripts/prepare_training_data.py \
  --video-dir ./data/raw/pro_swings \
  --output-dir ./data/training \
  --skill-level pro

# Process amateur swings
python scripts/prepare_training_data.py \
  --video-dir ./data/raw/amateur_swings \
  --output-dir ./data/training \
  --skill-level amateur

# Process a single video with manual annotations
python scripts/prepare_training_data.py \
  --video ./data/my_swing.mp4 \
  --output-dir ./data/training \
  --quality-score 65 \
  --faults early_extension,casting \
  --skill-level amateur
```

**Training JSON format:**

```json
{
  "video_path": "path/to/video.mp4",
  "handedness": "right",
  "pose_sequence": [
    {"frame_index": 0, "landmarks": [[x,y,z,vis], ...]},
    ...
  ],
  "phase_labels": [0, 0, 1, 1, 2, ...],
  "quality_score": 78.5,
  "faults": ["early_extension", "casting"],
  "skill_level": "pro"
}
```

### 3. Train Models

Each model has its own training script with configurable hyperparameters:

```bash
# Phase Classifier — replaces rule-based phase detection
python scripts/train_phase_classifier.py \
  --data-dir ./data/training \
  --epochs 50 \
  --batch-size 16 \
  --lr 1e-3 \
  --hidden-dim 128 \
  --num-layers 2 \
  --device cpu  # or cuda

# Quality Scorer — learns to rate swing quality
python scripts/train_quality_scorer.py \
  --data-dir ./data/training \
  --epochs 50 \
  --batch-size 16 \
  --lr 1e-3

# Fault Detector — identifies specific swing faults
python scripts/train_fault_detector.py \
  --data-dir ./data/training \
  --epochs 50 \
  --batch-size 16 \
  --lr 1e-3

# Swing Embedder — for pro comparison (needs pro + amateur data)
python scripts/train_swing_embedder.py \
  --data-dir ./data/training \
  --epochs 50 \
  --embed-dim 64
```

### 4. Model Details

| Model | Architecture | Parameters | Input | Output | Metrics |
|-------|-------------|-----------|-------|--------|---------|
| Phase Classifier | Bi-LSTM (2 layers) | 710K | (T, 132) pose seq | (T, 6) phase logits | Accuracy |
| Quality Scorer | 1D-CNN + Attention | 281K | (T, 132) pose seq | Score [0,1] | MAE, R² |
| Fault Detector | Bi-LSTM + 10 attention heads | 844K | (T, 132) pose seq | 10 fault probs | F1, Precision, Recall |
| Swing Embedder | Dilated 1D-CNN | 404K | (T, 132) pose seq | 64-dim vector | Pos/neg distance separation |

### 5. Using Trained Models

Trained checkpoints save to `./checkpoints/{model_name}/{model_name}_best.pt`.

The pipeline **automatically detects and uses trained models** — no configuration needed. When a checkpoint exists, the orchestrator uses the ML model; otherwise it falls back to the rule-based approach.

```python
# Check which models are available
from app.ml.registry import ModelRegistry
registry = ModelRegistry.get()
print(registry.available_models())  # e.g., ['phase_classifier', 'fault_detector']
```

Training history is saved alongside checkpoints as `{model_name}_history.json` with per-epoch train/val losses and metrics.

---

## Development

### Running Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

### Docker Deployment

```bash
cd backend

# Start everything (API + PostgreSQL)
docker compose up --build

# Or just the database
docker compose up db -d
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://swing:swing@localhost:5432/swing_detector` | PostgreSQL connection |
| `SECRET_KEY` | `change-me-in-production` | JWT signing key |
| `VIDEO_STORAGE_PATH` | `./uploads` | Where uploaded videos are saved |
| `MODEL_CHECKPOINT_DIR` | `./checkpoints` | Where trained model checkpoints are loaded from |

### Mobile Environment

| Variable | Description |
|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:8000`) |

---

## Camera Setup Guide

For best analysis results, record swings with:

- **Face-on view** (camera facing the golfer) — best for hip/shoulder rotation measurement
- **Down-the-line view** (camera behind the golfer) — best for swing plane analysis
- Phone held **landscape**, at **hip height**
- **5-10 feet** away from the golfer
- Good lighting, minimal background movement
- Record the **full swing** from address to finish (3-5 seconds)

---

## Tech Stack

**Backend:** Python 3.11+, FastAPI, SQLAlchemy, PostgreSQL, MediaPipe, OpenCV, PyTorch

**Mobile:** React Native, Expo SDK 55, Expo Router, expo-camera, expo-secure-store, react-native-svg

**ML Models:** PyTorch (LSTM, 1D-CNN, Attention mechanisms, Contrastive learning)
