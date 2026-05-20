-- Add preference columns if they don't exist (safe for existing DBs)
ALTER TABLE users ADD COLUMN IF NOT EXISTS notifications BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS camera_angle TEXT NOT NULL DEFAULT 'face-on';
ALTER TABLE users ADD COLUMN IF NOT EXISTS units TEXT NOT NULL DEFAULT 'yards';
