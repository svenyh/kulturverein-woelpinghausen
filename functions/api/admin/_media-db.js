const MEDIA_EVENT_COLUMNS = `
  id,
  title,
  year,
  slug,
  description,
  internal_note,
  cover_path,
  video_path,
  gallery_json,
  show_on_website,
  show_in_archive,
  seo_title,
  updated_at
`.trim();

export function parseGalleryJson(value) {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim());
  } catch {
    return [];
  }
}

export function stringifyGalleryJson(gallery) {
  if (!Array.isArray(gallery)) {
    return '[]';
  }
  return JSON.stringify(gallery);
}

function rowToBaseMediaEvent(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    slug: row.slug,
    description: row.description || '',
    coverPath: row.cover_path || '',
    videoPath: row.video_path || '',
    gallery: parseGalleryJson(row.gallery_json),
    showOnWebsite: row.show_on_website === 1,
    showInArchive: row.show_in_archive === 1,
    seoTitle: row.seo_title || '',
    updatedAt: row.updated_at || null,
  };
}

export function rowToMediaEvent(row) {
  return {
    ...rowToBaseMediaEvent(row),
    internalNote: row.internal_note || '',
  };
}

export function rowToPublicMediaEvent(row) {
  return rowToBaseMediaEvent(row);
}

export async function listMediaEvents(db) {
  const result = await db
    .prepare(
      `SELECT ${MEDIA_EVENT_COLUMNS}
       FROM media_events
       ORDER BY year ASC, title ASC`
    )
    .all();

  return (result.results || []).map(rowToMediaEvent);
}

export async function listPublicMediaEvents(db) {
  const result = await db
    .prepare(
      `SELECT ${MEDIA_EVENT_COLUMNS}
       FROM media_events
       WHERE show_on_website = 1
       ORDER BY year ASC, title ASC`
    )
    .all();

  return (result.results || []).map(rowToPublicMediaEvent);
}

export async function getMediaEventById(db, id) {
  const row = await db
    .prepare(
      `SELECT ${MEDIA_EVENT_COLUMNS}
       FROM media_events
       WHERE id = ?`
    )
    .bind(id)
    .first();

  return row ? rowToMediaEvent(row) : null;
}

export async function getPublicMediaEventBySlug(db, slug) {
  const row = await db
    .prepare(
      `SELECT ${MEDIA_EVENT_COLUMNS}
       FROM media_events
       WHERE slug = ? AND show_on_website = 1`
    )
    .bind(slug)
    .first();

  return row ? rowToPublicMediaEvent(row) : null;
}

export async function updateMediaEvent(db, payload) {
  const result = await db
    .prepare(
      `UPDATE media_events
       SET title = ?,
           description = ?,
           seo_title = ?,
           internal_note = ?,
           cover_path = ?,
           video_path = ?,
           gallery_json = ?,
           show_on_website = ?,
           show_in_archive = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      payload.title,
      payload.description,
      payload.seoTitle,
      payload.internalNote,
      payload.coverPath,
      payload.videoPath,
      stringifyGalleryJson(payload.gallery),
      payload.showOnWebsite ? 1 : 0,
      payload.showInArchive ? 1 : 0,
      payload.id
    )
    .run();

  return result.meta?.changes > 0;
}
