import assert from 'node:assert/strict';
import { onRequest } from '../functions/api/forms.js';

const configuredEnv = {
  MAIL_API_KEY: 'test-key',
  CONTACT_EMAIL: 'contact@example.test',
  FROM_EMAIL: 'sender@example.test',
};

const validContact = {
  type: 'contact',
  name: 'Testperson',
  email: 'person@example.test',
  phone: '',
  subject: 'Allgemeine Frage',
  message: 'Das ist eine Testnachricht.',
  privacy: true,
  website: '',
};

function requestFor(payload, options = {}) {
  return new Request('https://example.test/api/forms', {
    method: options.method || 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.method === 'GET' ? undefined : JSON.stringify(payload),
  });
}

async function call(payload, env = configuredEnv, options = {}) {
  return onRequest({
    request: requestFor(payload, options),
    env,
  });
}

let sentPayload;
globalThis.fetch = async (_url, init) => {
  sentPayload = JSON.parse(init.body);
  return new Response(JSON.stringify({ id: 'test-id' }), { status: 200 });
};

let response = await call(validContact, {});
assert.equal(response.status, 503);

response = await call(validContact);
assert.equal(response.status, 200);
assert.equal(sentPayload.subject, 'Neue Kontaktanfrage – Kulturverein Wölpinghausen');
assert.equal(sentPayload.reply_to, validContact.email);

response = await call({
  type: 'membership',
  firstName: 'Erika',
  lastName: 'Muster',
  email: 'erika@example.test',
  phone: '',
  message: '',
  privacy: true,
  website: '',
});
assert.equal(response.status, 200);
assert.equal(sentPayload.subject, 'Neue Mitgliedsanfrage – Kulturverein Wölpinghausen');

response = await call({ ...validContact, privacy: false });
assert.equal(response.status, 400);

response = await call({ ...validContact, message: 'Zu kurz' });
assert.equal(response.status, 400);

response = await call(
  validContact,
  {
    ...configuredEnv,
    FORM_RATE_LIMITER: {
      limit: async () => ({ success: false }),
    },
  }
);
assert.equal(response.status, 429);

response = await call(validContact, configuredEnv, {
  headers: { 'Content-Length': String(20 * 1024) },
});
assert.equal(response.status, 413);

response = await call({
  ...validContact,
  message: 'x'.repeat(20 * 1024),
});
assert.equal(response.status, 413);

response = await call(validContact, configuredEnv, { method: 'GET' });
assert.equal(response.status, 405);

globalThis.fetch = async () => new Response('nicht verfügbar', { status: 500 });
response = await call(validContact);
assert.equal(response.status, 502);

console.log('Formular-API: 10 Prüfungen erfolgreich.');
