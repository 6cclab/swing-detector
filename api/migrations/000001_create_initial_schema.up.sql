CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    name TEXT NOT NULL,
    handedness TEXT NOT NULL DEFAULT 'right',
    notifications BOOLEAN NOT NULL DEFAULT true,
    camera_angle TEXT NOT NULL DEFAULT 'face-on',
    units TEXT NOT NULL DEFAULT 'yards',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS swings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'pending',
    video_path TEXT NOT NULL,
    handedness TEXT NOT NULL DEFAULT 'right',
    analysis_json TEXT,
    overall_score DOUBLE PRECISION,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_swings_user_id ON swings (user_id);
CREATE INDEX IF NOT EXISTS idx_swings_status ON swings (status);
