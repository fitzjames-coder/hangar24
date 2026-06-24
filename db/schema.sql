-- Hangar 24 photos table (lean core; grows per feature)
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT,
  uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
  title TEXT,
  description TEXT,
  keywords TEXT,
  taken_at TEXT,
  camera TEXT,
  lens TEXT,
  aperture TEXT,
  shutter TEXT,
  iso TEXT,
  focal_length TEXT,
  focal_length_35mm TEXT,
  flash TEXT,
  white_balance TEXT,
  metering TEXT,
  megapixels TEXT,
  aspect_ratio TEXT,
  file_size TEXT
);
-- DISPOSABLE TEST DATA — delete before go-live
INSERT INTO photos (r2_key, original_filename, uploaded_at) VALUES
  ('seed/placeholder-1.jpg','D-ABYG.jpg','2026-06-23T09:00:00Z'),
  ('seed/placeholder-2.jpg','EI-LRA.jpg','2026-06-23T09:05:00Z'),
  ('seed/placeholder-3.jpg','JA873A.jpg','2026-06-23T09:10:00Z');
