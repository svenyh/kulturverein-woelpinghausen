ALTER TABLE events ADD COLUMN description TEXT;
ALTER TABLE events ADD COLUMN end_time TEXT;
ALTER TABLE events ADD COLUMN category TEXT;
ALTER TABLE events ADD COLUMN origin TEXT NOT NULL DEFAULT 'imported'
  CHECK (origin IN ('imported', 'manual'));

CREATE INDEX IF NOT EXISTS idx_events_admin_origin_date
  ON events (origin, event_date, event_time);
