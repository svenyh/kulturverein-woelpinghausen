const TIME_ZONE = 'Europe/Berlin';

const CANDIDATE_COLUMNS = `
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
    title: row.title,
    location: row.location || null,
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
       WHERE source_status = 'active'
       ORDER BY event_date ASC, COALESCE(event_time, '') ASC, title ASC`
    )
    .all();

  return result.results || [];
}

export async function listActiveRawIds(db) {
  const result = await db
    .prepare(`SELECT raw_id FROM events WHERE source_status = 'active' ORDER BY raw_id ASC`)
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
