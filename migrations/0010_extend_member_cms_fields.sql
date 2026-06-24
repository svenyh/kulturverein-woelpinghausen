ALTER TABLE member_events ADD COLUMN category TEXT NOT NULL DEFAULT '';

CREATE TABLE member_helpers__cms_migrate (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  event_name TEXT NOT NULL,
  task TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  contact_person TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'besetzt', 'abgeschlossen')),
  visible INTEGER NOT NULL DEFAULT 1 CHECK (visible IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO member_helpers__cms_migrate (
  id, title, event_name, task, description, category, contact_person, status, visible, created_at, updated_at
)
SELECT
  id,
  task,
  event_name,
  task,
  '',
  '',
  contact_person,
  status,
  visible,
  created_at,
  updated_at
FROM member_helpers;

DROP TABLE member_helpers;

ALTER TABLE member_helpers__cms_migrate RENAME TO member_helpers;

CREATE INDEX IF NOT EXISTS idx_member_helpers_visible_status
  ON member_helpers (visible, status ASC, event_name ASC);
