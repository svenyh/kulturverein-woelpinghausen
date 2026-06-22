CREATE TABLE IF NOT EXISTS media_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  year INTEGER,
  slug TEXT NOT NULL,
  description TEXT,
  internal_note TEXT,
  cover_path TEXT,
  video_path TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_media_events_slug
  ON media_events (slug);

INSERT OR IGNORE INTO media_events (
  id,
  title,
  year,
  slug,
  description,
  internal_note,
  cover_path,
  video_path,
  updated_at
) VALUES
  (
    'koeln-2024',
    'Köln 2024',
    2024,
    'koeln-2024',
    'Medien für die Veranstaltung in Köln 2024. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    '',
    '/images/events/koeln-2024/koeln-2024-cover.png',
    '/videos/koeln-2024.mp4',
    CURRENT_TIMESTAMP
  ),
  (
    'duesseldorf-2025',
    'Düsseldorf 2025',
    2025,
    'duesseldorf-2025',
    'Medien für die Veranstaltung in Düsseldorf 2025. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    '',
    '/images/events/duesseldorf-2025/duesseldorf-2025-cover.png',
    '/videos/duesseldorf-2025.mp4',
    CURRENT_TIMESTAMP
  ),
  (
    'leipzig-2026',
    'Leipzig 2026',
    2026,
    'leipzig-2026',
    'Medien für die Veranstaltung in Leipzig 2026. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    '',
    '/images/events/leipzig-2026/leipzig-2026-cover.png',
    '/videos/leipzig-2026.mp4',
    CURRENT_TIMESTAMP
  );
