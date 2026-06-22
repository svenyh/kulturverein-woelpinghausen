ALTER TABLE media_events ADD COLUMN gallery_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE media_events ADD COLUMN show_on_website INTEGER NOT NULL DEFAULT 1
  CHECK (show_on_website IN (0, 1));
ALTER TABLE media_events ADD COLUMN show_in_archive INTEGER NOT NULL DEFAULT 1
  CHECK (show_in_archive IN (0, 1));
ALTER TABLE media_events ADD COLUMN seo_title TEXT NOT NULL DEFAULT '';

UPDATE media_events
SET
  gallery_json = COALESCE(gallery_json, '[]'),
  show_on_website = COALESCE(show_on_website, 1),
  show_in_archive = COALESCE(show_in_archive, 1),
  seo_title = COALESCE(seo_title, '')
WHERE id IN ('koeln-2024', 'duesseldorf-2025', 'leipzig-2026');
