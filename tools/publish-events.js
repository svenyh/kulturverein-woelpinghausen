const fs = require('node:fs/promises');
const path = require('node:path');

const TIME_ZONE = 'Europe/Berlin';
const CANDIDATES_PATH = path.resolve(__dirname, '..', 'data', 'events-candidates.json');
const PUBLIC_PATH = path.resolve(__dirname, '..', 'data', 'events.json');

function monthLabel(dateString) {
  const date = new Date(`${dateString}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Ungültiges Veranstaltungsdatum: ${dateString}`);
  }

  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function publicEvent(event) {
  return {
    date: event.date,
    time: event.time || null,
    title: event.title,
    location: event.location || null,
    sourceUrl: event.sourceUrl || null,
    organizer: event.organizer || null,
  };
}

function groupApprovedEvents(events) {
  const groups = [];
  const byMonth = new Map();

  for (const event of events) {
    const month = monthLabel(event.date);
    if (!byMonth.has(month)) {
      const group = { month, events: [] };
      byMonth.set(month, group);
      groups.push(group);
    }
    byMonth.get(month).events.push(publicEvent(event));
  }

  return groups;
}

async function main() {
  const raw = await fs.readFile(CANDIDATES_PATH, 'utf8');
  const candidateGroups = JSON.parse(raw);
  if (!Array.isArray(candidateGroups)) {
    throw new Error('events-candidates.json muss eine Liste von Monatsgruppen enthalten.');
  }

  const candidates = candidateGroups.flatMap((group) =>
    Array.isArray(group.events) ? group.events : []
  );
  const approved = candidates
    .filter((event) => event.showOnWebsite === true)
    .sort((a, b) => {
      const aKey = `${a.date || ''}T${a.time || '00:00'}`;
      const bKey = `${b.date || ''}T${b.time || '00:00'}`;
      return aKey.localeCompare(bKey);
    });
  const publicGroups = groupApprovedEvents(approved);

  await fs.mkdir(path.dirname(PUBLIC_PATH), { recursive: true });
  await fs.writeFile(PUBLIC_PATH, `${JSON.stringify(publicGroups, null, 2)}\n`, 'utf8');

  console.log(`[events-publish] Kandidaten geprüft: ${candidates.length}`);
  console.log(`[events-publish] Freigegebene Termine: ${approved.length}`);
  console.log(`[events-publish] Nicht freigegebene Termine: ${candidates.length - approved.length}`);
  console.log(`[events-publish] Öffentliche Datei geschrieben: ${PUBLIC_PATH}`);
}

main().catch((error) => {
  console.error(`[events-publish] Fehler: ${error.message}`);
  process.exitCode = 1;
});
