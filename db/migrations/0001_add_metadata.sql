-- Migration 0001: add image metadata columns to photos table
-- Run via: wrangler d1 execute hangar24-db --remote --file=db/migrations/0001_add_metadata.sql
ALTER TABLE photos ADD COLUMN title TEXT;
ALTER TABLE photos ADD COLUMN description TEXT;
ALTER TABLE photos ADD COLUMN keywords TEXT;
ALTER TABLE photos ADD COLUMN taken_at TEXT;
ALTER TABLE photos ADD COLUMN camera TEXT;
ALTER TABLE photos ADD COLUMN lens TEXT;
ALTER TABLE photos ADD COLUMN aperture TEXT;
ALTER TABLE photos ADD COLUMN shutter TEXT;
ALTER TABLE photos ADD COLUMN iso TEXT;
ALTER TABLE photos ADD COLUMN focal_length TEXT;
ALTER TABLE photos ADD COLUMN flash TEXT;
ALTER TABLE photos ADD COLUMN white_balance TEXT;
