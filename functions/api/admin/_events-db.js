const TIME_ZONE = 'Europe/Berlin';

const CANDIDATE_COLUMNS = `
  raw_id,
  source_uid,
  event_date,
  event_time,
  end_time,
  title,
  description,
  location,
  category,
  source_url,
  organizer,
  is_series,
  review_note,
  selected_for_website,
  published_on_website,
  source_status
`.trim();

export function monthLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return 'Unbekannter Monat';
  }

  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function rowToCandidate(row) {
  return {
    rawId: row.raw_id,
    date: row.event_date,
    time: row.event_time || null,
    endTime: row.end_time || null,
    title: row.title,
    description: row.description || null,
    location: row.location || null,
    category: row.category || null,
    sourceUrl: row.source_url || null,
    organizer: row.organizer || null,
    showOnWebsite: row.selected_for_website === 1,
    reviewNote: row.review_note || null,
  };
}

export function candidateToRow(event) {
  const reviewNote = event.reviewNote == null ? null : String(event.reviewNote);
  const isSeries = reviewNote ? reviewNote.includes('Serienveranstaltung') : false;

  return {
    raw_id: event.rawId,
    source_uid: event.sourceUid || event.rawId || null,
    event_date: event.date,
    event_time: event.time || null,
    title: event.title || 'Ohne Titel',
    location: event.location || null,
    source_url: event.sourceUrl || null,
    organizer: event.organizer || null,
    is_series: isSeries ? 1 : 0,
    review_note: reviewNote,
    selected_for_website: event.showOnWebsite === true ? 1 : 0,
    published_on_website: 0,
    source_status: 'active',
  };
}

export function groupEventsByMonth(rows) {
  const groups = [];
  const groupsByMonth = new Map();

  for (const row of rows) {
    const candidate = rowToCandidate(row);
    const month = monthLabel(candidate.date);

    if (!groupsByMonth.has(month)) {
      const group = { month, events: [] };
      groupsByMonth.set(month, group);
      groups.push(group);
    }

    groupsByMonth.get(month).events.push(candidate);
  }

  return groups;
}

export async function listActiveCandidateRows(db) {
  const result = await db
    .prepare(
      `SELECT ${CANDIDATE_COLUMNS}
       FROM events
       WHERE source_status = 'active' AND origin = 'imported'
       ORDER BY event_date ASC, COALESCE(event_time, '') ASC, title ASC`
    )
    .all();

  return result.results || [];
}

export async function listActiveRawIds(db) {
  const result = await db
    .prepare(
      `SELECT raw_id FROM events
       WHERE source_status = 'active' AND origin = 'imported'
       ORDER BY raw_id ASC`
    )
    .all();

  return (result.results || []).map((row) => row.raw_id);
}

export async function updateSelections(db, selections) {
  const statements = selections.map((selection) =>
    db
      .prepare(
        `UPDATE events
         SET selected_for_website = ?, updated_at = CURRENT_TIMESTAMP
         WHERE raw_id = ? AND source_status = 'active'`
      )
      .bind(selection.showOnWebsite ? 1 : 0, selection.rawId)
  );

  await db.batch(statements);
}

export function rowToPublicEvent(row) {
  return {
    date: row.event_date,
    time: row.event_time || null,
    endTime: row.end_time || null,
    title: row.title,
    description: row.description || null,
    location: row.location || null,
    category: row.category || null,
    sourceUrl: row.source_url || null,
    organizer: row.organizer || null,
  };
}

export function groupPublishedEventsByMonth(rows) {
  const groups = [];
  const groupsByMonth = new Map();

  for (const row of rows) {
    const event = rowToPublicEvent(row);
    const month = monthLabel(event.date);

    if (!groupsByMonth.has(month)) {
      const group = { month, events: [] };
      groupsByMonth.set(month, group);
      groups.push(group);
    }

    groupsByMonth.get(month).events.push(event);
  }

  return groups;
}

export async function listPublishedEventRows(db) {
  const result = await db
    .prepare(
      `SELECT event_date, event_time, end_time, title, description, location, category,
              source_url, organizer
       FROM events
       WHERE source_status = 'active' AND published_on_website = 1
       ORDER BY event_date ASC, COALESCE(event_time, '') ASC, title ASC`
    )
    .all();

  return result.results || [];
}

export async function publishSelectedEvents(db) {
  await db
    .prepare(
      `UPDATE events
       SET published_on_website = selected_for_website,
           published_at = CASE
             WHEN selected_for_website = 1 THEN CURRENT_TIMESTAMP
             ELSE NULL
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE source_status = 'active' AND origin = 'imported'`
    )
    .run();

  const countResult = await db
    .prepare(
      `SELECT COUNT(*) AS count
       FROM events
       WHERE source_status = 'active' AND published_on_website = 1`
    )
    .first();

  return Number(countResult?.count || 0);
}

export async function upsertImportedEvents(db, events) {
  const existingIds = new Set(await listActiveRawIds(db));
  let importedCount = 0;
  let updatedCount = 0;
  const statements = [];

  for (const event of events) {
    if (!event.rawId) continue;

    if (existingIds.has(event.rawId)) {
      updatedCount += 1;
    } else {
      importedCount += 1;
      existingIds.add(event.rawId);
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO events (
             raw_id,
             source_uid,
             event_date,
             event_time,
             title,
             location,
             source_url,
             organizer,
             is_series,
             review_note,
             selected_for_website,
             published_on_website,
             source_status,
             last_seen_at,
             imported_at,
             updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT(raw_id) DO UPDATE SET
             source_uid = excluded.source_uid,
             event_date = excluded.event_date,
             event_time = excluded.event_time,
             title = excluded.title,
             location = excluded.location,
             source_url = excluded.source_url,
             organizer = excluded.organizer,
             is_series = excluded.is_series,
             review_note = excluded.review_note,
             source_status = 'active',
             last_seen_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP`
        )
        .bind(
          event.rawId,
          event.sourceUid || event.rawId,
          event.date,
          event.time,
          event.title,
          event.location,
          event.sourceUrl,
          event.organizer,
          event.isSeriesFlag ? 1 : 0,
          event.reviewNote
        )
    );
  }

  if (statements.length) {
    const chunkSize = 100;
    for (let index = 0; index < statements.length; index += chunkSize) {
      await db.batch(statements.slice(index, index + chunkSize));
    }
  }

  return {
    importedCount,
    updatedCount,
    candidateCount: events.length,
  };
}

function rowToAdminEvent(row) {
  return {
    id: row.raw_id,
    title: row.title,
    description: row.description || '',
    date: row.event_date,
    startTime: row.event_time || '',
    endTime: row.end_time || '',
    location: row.location || '',
    category: row.category || '',
    sourceUrl: row.source_url || '',
    status: row.published_on_website === 1 ? 'published' : 'draft',
    origin: row.origin,
    sourceStatus: row.source_status,
  };
}

const ADMIN_EVENT_COLUMNS = `
  raw_id, title, description, event_date, event_time, end_time, location, category,
  source_url, published_on_website, origin, source_status
`.trim();

export async function listAdminEvents(db) {
  const result = await db
    .prepare(
      `SELECT ${ADMIN_EVENT_COLUMNS}
       FROM events
       WHERE origin = 'manual'
       ORDER BY event_date DESC, COALESCE(event_time, '') DESC, title ASC`
    )
    .all();
  return (result.results || []).map(rowToAdminEvent);
}

export async function createManualEvent(db, event) {
  const id = `manual:${crypto.randomUUID()}`;
  await db
    .prepare(
      `INSERT INTO events (
         raw_id, source_uid, event_date, event_time, end_time, title, description,
         location, category, source_url, selected_for_website, published_on_website,
         source_status, origin, published_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'manual',
         CASE WHEN ? = 1 THEN CURRENT_TIMESTAMP ELSE NULL END, CURRENT_TIMESTAMP)`
    )
    .bind(
      id,
      id,
      event.date,
      event.startTime || null,
      event.endTime || null,
      event.title,
      event.description || null,
      event.location || null,
      event.category || null,
      event.sourceUrl || null,
      event.published,
      event.published,
      event.published
    )
    .run();
  return getAdminEvent(db, id);
}

export async function getAdminEvent(db, id) {
  const row = await db
    .prepare(`SELECT ${ADMIN_EVENT_COLUMNS} FROM events WHERE raw_id = ?`)
    .bind(id)
    .first();
  return row ? rowToAdminEvent(row) : null;
}

export async function updateAdminEvent(db, id, event) {
  const result = await db
    .prepare(
      `UPDATE events
       SET event_date = ?, event_time = ?, end_time = ?, title = ?, description = ?,
           location = ?, category = ?, source_url = ?,
           selected_for_website = ?,
           published_on_website = ?,
           published_at = CASE
             WHEN ? = 1 AND published_on_website = 0 THEN CURRENT_TIMESTAMP
             WHEN ? = 0 THEN NULL
             ELSE published_at
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE raw_id = ? AND origin = 'manual'`
    )
    .bind(
      event.date,
      event.startTime || null,
      event.endTime || null,
      event.title,
      event.description || null,
      event.location || null,
      event.category || null,
      event.sourceUrl || null,
      event.published,
      event.published,
      event.published,
      event.published,
      id
    )
    .run();
  return result.meta?.changes ? getAdminEvent(db, id) : null;
}

export async function deleteAdminEvent(db, id) {
  const result = await db
    .prepare(`DELETE FROM events WHERE raw_id = ? AND origin = 'manual'`)
    .bind(id)
    .run();
  return Boolean(result.meta?.changes);
}
