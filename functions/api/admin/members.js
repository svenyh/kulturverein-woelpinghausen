import {
  createMemberItem,
  deleteMemberItem,
  isValidSection,
  listAllMemberContent,
  updateMemberItem,
} from './_members-db.js';
import { requireAdminAccess } from './_require-access.js';

const MAX_BODY_BYTES = 128 * 1024;

function jsonResponse(payload, status) {
  return Response.json(payload, {
    status: status || 200,
    headers: { 'Cache-Control': 'no-store' },
  });
}

async function readJsonBody(request) {
  const text = await request.text();
  if (!text) return {};
  if (text.length > MAX_BODY_BYTES) {
    throw new Error('Die Anfrage ist zu gross.');
  }
  return JSON.parse(text);
}

function validateBoolean(value, fieldName) {
  if (typeof value !== 'boolean') {
    return { error: `${fieldName} muss true oder false sein.`, status: 400 };
  }
  return { value };
}

function validateString(value, fieldName, { required = true, allowEmpty = false } = {}) {
  if (typeof value !== 'string') {
    return { error: `${fieldName} muss ein Text sein.`, status: 400 };
  }
  const trimmed = value.trim();
  if (required && !trimmed && !allowEmpty) {
    return { error: `${fieldName} fehlt.`, status: 400 };
  }
  return { value: trimmed };
}

function validateFilename(value) {
  const text = validateString(value, 'filename');
  if (text.error) return text;
  if (text.value.includes('..') || text.value.includes('/') || text.value.includes('\\')) {
    return { error: 'filename ist ungueltig.', status: 400 };
  }
  return text;
}

function validateDate(value) {
  const text = validateString(value, 'eventDate');
  if (text.error) return text;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text.value)) {
    return { error: 'eventDate muss im Format JJJJ-MM-TT sein.', status: 400 };
  }
  return text;
}

function validateStatus(value) {
  if (value !== 'offen' && value !== 'besetzt') {
    return { error: 'status muss offen oder besetzt sein.', status: 400 };
  }
  return { value };
}

function validatePriority(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return { error: 'priority muss eine Zahl sein.', status: 400 };
  }
  return { value: Math.round(number) };
}

function validatePayload(section, body, { partial = false } = {}) {
  if (!isValidSection(section)) {
    return { error: 'section ist ungueltig.', status: 400 };
  }

  if (section === 'news') {
    const title = validateString(body.title, 'title', { required: !partial });
    if (title.error) return title;
    const description = validateString(body.description, 'description', { required: false, allowEmpty: true });
    if (description.error) return description;
    const category = validateString(body.category, 'category', { required: false, allowEmpty: true });
    if (category.error) return category;
    const priority = validatePriority(body.priority ?? 0);
    if (priority.error) return priority;
    const visible = validateBoolean(body.visible, 'visible');
    if (visible.error) return visible;
    return {
      payload: {
        title: title.value,
        description: description.value,
        category: category.value,
        priority: priority.value,
        visible: visible.value,
      },
    };
  }

  if (section === 'documents') {
    const title = validateString(body.title, 'title', { required: !partial });
    if (title.error) return title;
    const description = validateString(body.description, 'description', { required: false, allowEmpty: true });
    if (description.error) return description;
    const filename = validateFilename(body.filename);
    if (filename.error) return filename;
    const category = validateString(body.category, 'category', { required: false, allowEmpty: true });
    if (category.error) return category;
    const visible = validateBoolean(body.visible, 'visible');
    if (visible.error) return visible;
    return {
      payload: {
        title: title.value,
        description: description.value,
        filename: filename.value,
        category: category.value,
        visible: visible.value,
      },
    };
  }

  if (section === 'events') {
    const title = validateString(body.title, 'title', { required: !partial });
    if (title.error) return title;
    const eventDate = validateDate(body.eventDate);
    if (eventDate.error) return eventDate;
    const eventTime = validateString(body.eventTime, 'eventTime', { required: false, allowEmpty: true });
    if (eventTime.error) return eventTime;
    const location = validateString(body.location, 'location', { required: false, allowEmpty: true });
    if (location.error) return location;
    const description = validateString(body.description, 'description', { required: false, allowEmpty: true });
    if (description.error) return description;
    const visible = validateBoolean(body.visible, 'visible');
    if (visible.error) return visible;
    return {
      payload: {
        title: title.value,
        eventDate: eventDate.value,
        eventTime: eventTime.value,
        location: location.value,
        description: description.value,
        visible: visible.value,
      },
    };
  }

  const eventName = validateString(body.eventName, 'eventName', { required: !partial });
  if (eventName.error) return eventName;
  const task = validateString(body.task, 'task', { required: !partial });
  if (task.error) return task;
  const contactPerson = validateString(body.contactPerson, 'contactPerson', { required: false, allowEmpty: true });
  if (contactPerson.error) return contactPerson;
  const status = validateStatus(body.status || 'offen');
  if (status.error) return status;
  return {
    payload: {
      eventName: eventName.value,
      task: task.value,
      contactPerson: contactPerson.value,
      status: status.value,
    },
  };
}

export async function onRequestGet(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env } = context;
  if (!env.DB) return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);

  try {
    const content = await listAllMemberContent(env.DB);
    return jsonResponse(content);
  } catch (error) {
    return jsonResponse({ error: error.message || 'Mitgliederinhalte konnten nicht geladen werden.' }, 500);
  }
}

export async function onRequestPost(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env, request } = context;
  if (!env.DB) return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    return jsonResponse({ error: error.message || 'Ungueltige Anfrage.' }, status);
  }

  const validation = validatePayload(body.section, body.item || body);
  if (validation.error) return jsonResponse({ error: validation.error }, validation.status);

  try {
    const item = await createMemberItem(env.DB, body.section, validation.payload);
    return jsonResponse({ message: 'Eintrag wurde erstellt.', item }, 201);
  } catch (error) {
    return jsonResponse({ error: error.message || 'Eintrag konnte nicht erstellt werden.' }, 500);
  }
}

export async function onRequestPatch(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env, request } = context;
  if (!env.DB) return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : 500;
    return jsonResponse({ error: error.message || 'Ungueltige Anfrage.' }, status);
  }

  if (!body?.id || typeof body.id !== 'string') {
    return jsonResponse({ error: 'id fehlt.' }, 400);
  }

  const validation = validatePayload(body.section, body.item || body);
  if (validation.error) return jsonResponse({ error: validation.error }, validation.status);

  try {
    const item = await updateMemberItem(env.DB, body.section, body.id.trim(), validation.payload);
    if (!item) return jsonResponse({ error: 'Eintrag wurde nicht gefunden.' }, 404);
    return jsonResponse({ message: 'Eintrag wurde aktualisiert.', item });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Eintrag konnte nicht aktualisiert werden.' }, 500);
  }
}

export async function onRequestDelete(context) {
  const denied = requireAdminAccess(context);
  if (denied) return denied;

  const { env, request } = context;
  if (!env.DB) return jsonResponse({ error: 'D1-Binding DB fehlt.' }, 503);

  const url = new URL(request.url);
  const section = url.searchParams.get('section');
  const id = url.searchParams.get('id');

  if (!isValidSection(section)) {
    return jsonResponse({ error: 'section ist ungueltig.' }, 400);
  }
  if (!id?.trim()) {
    return jsonResponse({ error: 'id fehlt.' }, 400);
  }

  try {
    const deleted = await deleteMemberItem(env.DB, section, id.trim());
    if (!deleted) return jsonResponse({ error: 'Eintrag wurde nicht gefunden.' }, 404);
    return jsonResponse({ message: 'Eintrag wurde geloescht.' });
  } catch (error) {
    return jsonResponse({ error: error.message || 'Eintrag konnte nicht geloescht werden.' }, 500);
  }
}
