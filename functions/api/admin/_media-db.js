const MEDIA_EVENT_COLUMNS = `
  id,
  title,
  year,
  slug,
  description,
  internal_note,
  cover_path,
  video_path,
  updated_at
`.trim();

export function rowToMediaEvent(row) {
  return {
    id: row.id,
    title: row.title,
    year: row.year,
    slug: row.slug,
    description: row.description || '',
    internalNote: row.internal_note || '',
    coverPath: row.cover_path || '',
    videoPath: row.video_path || '',
    updatedAt: row.updated_at || null,
  };
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

export async function updateMediaEvent(db, payload) {
  const result = await db
    .prepare(
      `UPDATE media_events
       SET description = ?,
           internal_note = ?,
           cover_path = ?,
           video_path = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(
      payload.description,
      payload.internalNote,
      payload.coverPath,
      payload.videoPath,
      payload.id
    )
    .run();

  return result.meta?.changes > 0;
}
