CREATE TABLE IF NOT EXISTS events (
  raw_id TEXT PRIMARY KEY,
  source_uid TEXT,
  event_date TEXT NOT NULL,
  event_time TEXT,
  title TEXT NOT NULL,
  location TEXT,
  source_url TEXT,
  organizer TEXT,
  is_series INTEGER NOT NULL DEFAULT 0 CHECK (is_series IN (0, 1)),
  review_note TEXT,
  selected_for_website INTEGER NOT NULL DEFAULT 0
    CHECK (selected_for_website IN (0, 1)),
  published_on_website INTEGER NOT NULL DEFAULT 0
    CHECK (published_on_website IN (0, 1)),
  source_status TEXT NOT NULL DEFAULT 'active'
    CHECK (source_status IN ('active', 'missing', 'cancelled')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  last_seen_at TEXT,
  imported_at TEXT,
  selected_by TEXT,
  selected_at TEXT,
  published_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_public_date
  ON events (published_on_website, source_status, event_date, event_time);

CREATE INDEX IF NOT EXISTS idx_events_selection
  ON events (selected_for_website, event_date, event_time);
