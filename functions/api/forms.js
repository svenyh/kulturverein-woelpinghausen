const MAX_BODY_BYTES = 16 * 1024;
const RESEND_ENDPOINT = 'https://api.resend.com/emails';

const FORM_DEFINITIONS = {
  contact: {
    mailSubject: 'Neue Kontaktanfrage – Kulturverein Wölpinghausen',
    required: ['name', 'email', 'subject', 'message'],
  },
  membership: {
    mailSubject: 'Neue Mitgliedsanfrage – Kulturverein Wölpinghausen',
    required: ['firstName', 'lastName', 'email'],
  },
};

function jsonResponse(status, message) {
  return Response.json(
    { ok: status >= 200 && status < 300, message },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

function hasMailConfiguration(env) {
  return ['MAIL_API_KEY', 'CONTACT_EMAIL', 'FROM_EMAIL'].every(
    (key) => typeof env[key] === 'string' && env[key].trim()
  );
}

async function readLimitedBody(request) {
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function cleanString(value, maximumLength, required) {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim();
  if ((required && !cleaned) || cleaned.length > maximumLength) return null;
  return cleaned;
}

function validatePayload(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  const definition = FORM_DEFINITIONS[input.type];
  if (!definition || input.privacy !== true) return null;

  const fields = {
    type: input.type,
    email: cleanString(input.email, 254, true),
    phone: cleanString(input.phone ?? '', 50, false),
    message: cleanString(
      input.message ?? '',
      5000,
      definition.required.includes('message')
    ),
    website: cleanString(input.website ?? '', 500, false),
  };

  if (input.type === 'contact') {
    fields.name = cleanString(input.name, 120, true);
    fields.subject = cleanString(input.subject, 160, true);
  } else {
    fields.firstName = cleanString(input.firstName, 100, true);
    fields.lastName = cleanString(input.lastName, 100, true);
  }

  if (Object.values(fields).some((value) => value === null)) return null;

  const emailPattern =
    /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$/i;
  if (!emailPattern.test(fields.email)) return null;
  if (fields.type === 'contact' && fields.message.length < 20) return null;

  const phonePattern = /^[0-9+()/. -]*$/;
  if (fields.phone && !phonePattern.test(fields.phone)) return null;

  return { fields, definition };
}

function formatMailText(fields) {
  if (fields.type === 'contact') {
    return [
      `Name: ${fields.name}`,
      `E-Mail: ${fields.email}`,
      `Telefon: ${fields.phone || 'Nicht angegeben'}`,
      `Angegebener Betreff: ${fields.subject}`,
      '',
      'Nachricht:',
      fields.message,
    ].join('\n');
  }

  return [
    `Vorname: ${fields.firstName}`,
    `Nachname: ${fields.lastName}`,
    `E-Mail: ${fields.email}`,
    `Telefon: ${fields.phone || 'Nicht angegeben'}`,
    '',
    'Nachricht:',
    fields.message || 'Nicht angegeben',
  ].join('\n');
}

async function sendWithResend(env, fields, definition) {
  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.MAIL_API_KEY.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL.trim(),
      to: [env.CONTACT_EMAIL.trim()],
      reply_to: fields.email,
      subject: definition.mailSubject,
      text: formatMailText(fields),
    }),
  });

  return response.ok;
}

async function applyRateLimit(context) {
  const limiter = context.env.FORM_RATE_LIMITER;
  if (!limiter || typeof limiter.limit !== 'function') return true;

  const clientAddress =
    context.request.headers.get('CF-Connecting-IP') || 'local-or-unknown';

  try {
    const result = await limiter.limit({ key: `public-form:${clientAddress}` });
    return result.success !== false;
  } catch {
    return true;
  }
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return jsonResponse(405, 'Diese Anfrage wird nicht unterstützt.');
  }

  const contentLength = Number(context.request.headers.get('Content-Length'));
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse(413, 'Die Anfrage ist zu groß.');
  }

  if (!(await applyRateLimit(context))) {
    return jsonResponse(
      429,
      'Es wurden zu viele Anfragen gesendet. Bitte warte kurz und versuche es erneut.'
    );
  }

  const contentType = context.request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return jsonResponse(415, 'Bitte sende das Formular erneut ab.');
  }

  let rawBody;
  try {
    rawBody = await readLimitedBody(context.request);
  } catch {
    return jsonResponse(400, 'Die Formulardaten konnten nicht gelesen werden.');
  }
  if (rawBody === null) {
    return jsonResponse(413, 'Die Anfrage ist zu groß.');
  }

  let input;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return jsonResponse(400, 'Die Formulardaten sind ungültig.');
  }

  const validated = validatePayload(input);
  if (!validated) {
    return jsonResponse(
      400,
      'Bitte prüfe die Pflichtfelder und sende das Formular erneut ab.'
    );
  }

  if (validated.fields.website) {
    return jsonResponse(200, 'Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt.');
  }

  if (!hasMailConfiguration(context.env)) {
    return jsonResponse(
      503,
      'Das Formular ist noch nicht vollständig eingerichtet. Bitte versuche es später erneut.'
    );
  }

  try {
    const sent = await sendWithResend(
      context.env,
      validated.fields,
      validated.definition
    );
    if (!sent) {
      return jsonResponse(
        502,
        'Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es später erneut.'
      );
    }
  } catch {
    return jsonResponse(
      502,
      'Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es später erneut.'
    );
  }

  return jsonResponse(200, 'Vielen Dank! Deine Nachricht wurde erfolgreich übermittelt.');
}
