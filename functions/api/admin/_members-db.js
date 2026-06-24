const SECTIONS = ['news', 'documents', 'events', 'helpers'];

const TABLE_BY_SECTION = {
  news: 'member_news',
  documents: 'member_documents',
  events: 'member_events',
  helpers: 'member_helpers',
};

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function createId(section, title) {
  const prefix = {
    news: 'news',
    documents: 'doc',
    events: 'event',
    helpers: 'helper',
  }[section];
  const base = slugify(title) || 'eintrag';
  return `${prefix}-${base}-${Date.now().toString(36)}`;
}

function rowToNews(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    priority: row.priority ?? 0,
    visible: row.visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDocument(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    filename: row.filename,
    category: row.category || '',
    visible: row.visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToMemberEvent(row) {
  return {
    id: row.id,
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time || '',
    location: row.location || '',
    description: row.description || '',
    visible: row.visible === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToHelper(row) {
  return {
    id: row.id,
    eventName: row.event_name,
    task: row.task,
    contactPerson: row.contact_person || '',
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const MAPPERS = {
  news: rowToNews,
  documents: rowToDocument,
  events: rowToMemberEvent,
  helpers: rowToHelper,
};

export function isValidSection(section) {
  return SECTIONS.includes(section);
}

export function toPublicNews(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || '',
    createdAt: row.created_at,
  };
}

export function toPublicDocument(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    filename: row.filename || '',
    category: row.category || '',
  };
}

export function toPublicMemberEvent(row) {
  return {
    id: row.id,
    title: row.title,
    eventDate: row.event_date,
    eventTime: row.event_time || '',
    location: row.location || '',
    description: row.description || '',
  };
}

export function toPublicHelper(row) {
  return {
    id: row.id,
    eventName: row.event_name,
    task: row.task,
    contactPerson: row.contact_person || '',
    status: row.status,
  };
}

export async function listMemberNews(db, { visibleOnly = false } = {}) {
  const where = visibleOnly ? 'WHERE visible = 1' : '';
  const result = await db
    .prepare(
      `SELECT id, title, description, category, priority, visible, created_at, updated_at
       FROM member_news
       ${where}
       ORDER BY priority DESC, created_at DESC, title ASC`
    )
    .all();
  const mapper = visibleOnly ? toPublicNews : rowToNews;
  return (result.results || []).map(mapper);
}

export async function listMemberDocuments(db, { visibleOnly = false } = {}) {
  const where = visibleOnly ? 'WHERE visible = 1' : '';
  const result = await db
    .prepare(
      `SELECT id, title, description, filename, category, visible, created_at, updated_at
       FROM member_documents
       ${where}
       ORDER BY category ASC, title ASC`
    )
    .all();
  const mapper = visibleOnly ? toPublicDocument : rowToDocument;
  return (result.results || []).map(mapper);
}

export async function listMemberEventsInternal(db, { visibleOnly = false } = {}) {
  const where = visibleOnly ? 'WHERE visible = 1' : '';
  const result = await db
    .prepare(
      `SELECT id, title, event_date, event_time, location, description, visible, created_at, updated_at
       FROM member_events
       ${where}
       ORDER BY event_date ASC, event_time ASC, title ASC`
    )
    .all();
  const mapper = visibleOnly ? toPublicMemberEvent : rowToMemberEvent;
  return (result.results || []).map(mapper);
}

export async function listMemberHelpers(db, { visibleOnly = false } = {}) {
  void visibleOnly;
  const result = await db
    .prepare(
      `SELECT id, event_name, task, contact_person, status, created_at, updated_at
       FROM member_helpers
       ORDER BY CASE status WHEN 'offen' THEN 0 ELSE 1 END, event_name ASC, task ASC`
    )
    .all();
  const mapper = visibleOnly ? toPublicHelper : rowToHelper;
  return (result.results || []).map(mapper);
}

export async function listAllMemberContent(db) {
  const [news, documents, events, helpers] = await Promise.all([
    listMemberNews(db),
    listMemberDocuments(db),
    listMemberEventsInternal(db),
    listMemberHelpers(db),
  ]);
  return { news, documents, events, helpers };
}

async function getById(db, section, id) {
  const table = TABLE_BY_SECTION[section];
  const mapper = MAPPERS[section];
  const row = await db.prepare(`SELECT * FROM ${table} WHERE id = ?`).bind(id).first();
  return row ? mapper(row) : null;
}

export async function createMemberItem(db, section, payload) {
  const table = TABLE_BY_SECTION[section];
  const id = payload.id?.trim() || createId(section, payload.title || payload.eventName || payload.task);

  if (section === 'news') {
    await db
      .prepare(
        `INSERT INTO member_news (id, title, description, category, priority, visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        id,
        payload.title,
        payload.description,
        payload.category,
        payload.priority,
        payload.visible ? 1 : 0
      )
      .run();
  } else if (section === 'documents') {
    await db
      .prepare(
        `INSERT INTO member_documents (id, title, description, filename, category, visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        id,
        payload.title,
        payload.description,
        payload.filename,
        payload.category,
        payload.visible ? 1 : 0
      )
      .run();
  } else if (section === 'events') {
    await db
      .prepare(
        `INSERT INTO member_events (id, title, event_date, event_time, location, description, visible, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(
        id,
        payload.title,
        payload.eventDate,
        payload.eventTime,
        payload.location,
        payload.description,
        payload.visible ? 1 : 0
      )
      .run();
  } else if (section === 'helpers') {
    await db
      .prepare(
        `INSERT INTO member_helpers (id, event_name, task, contact_person, status, updated_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`
      )
      .bind(id, payload.eventName, payload.task, payload.contactPerson, payload.status)
      .run();
  }

  return getById(db, section, id);
}

export async function updateMemberItem(db, section, id, payload) {
  const existing = await getById(db, section, id);
  if (!existing) return null;

  if (section === 'news') {
    await db
      .prepare(
        `UPDATE member_news
         SET title = ?, description = ?, category = ?, priority = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        payload.title,
        payload.description,
        payload.category,
        payload.priority,
        payload.visible ? 1 : 0,
        id
      )
      .run();
  } else if (section === 'documents') {
    await db
      .prepare(
        `UPDATE member_documents
         SET title = ?, description = ?, filename = ?, category = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        payload.title,
        payload.description,
        payload.filename,
        payload.category,
        payload.visible ? 1 : 0,
        id
      )
      .run();
  } else if (section === 'events') {
    await db
      .prepare(
        `UPDATE member_events
         SET title = ?, event_date = ?, event_time = ?, location = ?, description = ?, visible = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(
        payload.title,
        payload.eventDate,
        payload.eventTime,
        payload.location,
        payload.description,
        payload.visible ? 1 : 0,
        id
      )
      .run();
  } else if (section === 'helpers') {
    await db
      .prepare(
        `UPDATE member_helpers
         SET event_name = ?, task = ?, contact_person = ?, status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`
      )
      .bind(payload.eventName, payload.task, payload.contactPerson, payload.status, id)
      .run();
  }

  return getById(db, section, id);
}

export async function deleteMemberItem(db, section, id) {
  const table = TABLE_BY_SECTION[section];
  const result = await db.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
  return result.meta?.changes > 0;
}

export { getById as getMemberItemById };
