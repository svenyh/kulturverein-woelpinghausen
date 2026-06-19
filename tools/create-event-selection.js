const fs = require('node:fs/promises');
const path = require('node:path');

const CANDIDATES_PATH = path.resolve(__dirname, '..', 'data', 'events-candidates.json');
const SELECTION_PATH = path.resolve(__dirname, '..', 'data', 'events-selection.md');
const GROUPED_SELECTION_PATH = path.resolve(
  __dirname,
  '..',
  'data',
  'events-selection-grouped.md'
);

const ORGANIZATION_GROUPS = [
  'Sportverein Wölpinghausen',
  'TTC Wölpinghausen',
  'Schützenhaus / Schützenverein',
  'Jugendfeuerwehr',
  'Grüne Mitte',
  'Sonstige',
];

function displayDate(date) {
  const [year, month, day] = String(date).split('-');
  return year && month && day ? `${day}.${month}.${year}` : String(date || 'Ohne Datum');
}

function markdownText(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '<br>')
    .replace(/([*_`])/g, '\\$1');
}

function createMarkdown(groups) {
  const lines = [
    '# Lokale Termin-Freigabe',
    '',
    '> Setze in data/events-candidates.json bei gewünschten Terminen showOnWebsite auf true und führe danach npm.cmd run events:publish aus.',
    '',
  ];
  let number = 0;

  for (const group of groups) {
    if (!group || !Array.isArray(group.events)) continue;
    lines.push(`## ${markdownText(group.month, 'Ohne Monat')}`, '');

    for (const event of group.events) {
      number += 1;
      lines.push(
        `### ${number}. ${displayDate(event.date)}`,
        '',
        `- **Uhrzeit:** ${event.time ? `${event.time} Uhr` : 'Keine Uhrzeit angegeben'}`,
        `- **Titel:** ${markdownText(event.title, 'Ohne Titel')}`,
        `- **Ort:** ${markdownText(event.location, 'Keine Ortsangabe')}`,
        `- **Prüfhinweis:** ${markdownText(event.reviewNote, 'Manuelle Prüfung erforderlich')}`,
        ''
      );
    }
  }

  return { markdown: `${lines.join('\n')}\n`, count: number };
}

function isSeriesEvent(event) {
  return /serienveranstaltung/i.test(String(event.reviewNote || ''));
}

function organizationGroup(event) {
  const text = [event.title, event.location, event.organizer]
    .filter(Boolean)
    .join(' ');

  if (/\bttc\b/i.test(text)) return 'TTC Wölpinghausen';
  if (/jugendfeuerwehr|kinderfeuerwehr/i.test(text)) return 'Jugendfeuerwehr';
  if (/grüne mitte/i.test(text)) return 'Grüne Mitte';
  if (/schützenhaus|schützenverein|schützenfest/i.test(text)) {
    return 'Schützenhaus / Schützenverein';
  }
  if (/sportverein wölpinghausen/i.test(text)) return 'Sportverein Wölpinghausen';
  return 'Sonstige';
}

function chronologicalKey(event) {
  return `${event.date || ''}T${event.time || '00:00'}`;
}

function groupedEvents(groups) {
  let number = 0;
  return groups.flatMap((group) =>
    Array.isArray(group.events)
      ? group.events.map((event) => ({
          ...event,
          candidateNumber: ++number,
          organizationGroup: organizationGroup(event),
          seriesEvent: isSeriesEvent(event),
        }))
      : []
  );
}

function appendGroupedEvent(lines, event) {
  lines.push(
    `#### ${event.candidateNumber}. ${displayDate(event.date)}`,
    '',
    '- [ ] Auf Website anzeigen?',
    `- **Uhrzeit:** ${event.time ? `${event.time} Uhr` : 'Keine Uhrzeit angegeben'}`,
    `- **Titel:** ${markdownText(event.title, 'Ohne Titel')}`,
    `- **Ort:** ${markdownText(event.location, 'Keine Ortsangabe')}`,
    `- **Serienveranstaltung:** ${event.seriesEvent ? 'Ja' : 'Nein'}`,
    ''
  );
}

function createGroupedMarkdown(groups) {
  const events = groupedEvents(groups);
  const lines = [
    '# Gruppierte lokale Termin-Freigabe',
    '',
    '> Diese Liste dient ausschließlich der manuellen Prüfung. Es wird kein Termin automatisch freigegeben.',
    '',
  ];

  for (const seriesEvent of [true, false]) {
    lines.push(seriesEvent ? '## Serienveranstaltungen' : '## Einzelveranstaltungen', '');

    for (const groupName of ORGANIZATION_GROUPS) {
      const matching = events
        .filter(
          (event) =>
            event.seriesEvent === seriesEvent && event.organizationGroup === groupName
        )
        .sort((a, b) => chronologicalKey(a).localeCompare(chronologicalKey(b)));
      if (!matching.length) continue;

      lines.push(`### ${groupName} (${matching.length})`, '');
      for (const event of matching) {
        appendGroupedEvent(lines, event);
      }
    }
  }

  const groupCounts = Object.fromEntries(
    ORGANIZATION_GROUPS.map((groupName) => [
      groupName,
      events.filter((event) => event.organizationGroup === groupName).length,
    ])
  );

  return {
    markdown: `${lines.join('\n')}\n`,
    count: events.length,
    seriesCount: events.filter((event) => event.seriesEvent).length,
    groupCounts,
  };
}

async function main() {
  const raw = await fs.readFile(CANDIDATES_PATH, 'utf8');
  const groups = JSON.parse(raw);
  if (!Array.isArray(groups)) {
    throw new Error('events-candidates.json muss eine Liste von Monatsgruppen enthalten.');
  }

  const { markdown, count } = createMarkdown(groups);
  const grouped = createGroupedMarkdown(groups);
  await fs.writeFile(SELECTION_PATH, markdown, 'utf8');
  await fs.writeFile(GROUPED_SELECTION_PATH, grouped.markdown, 'utf8');

  console.log(`[events-selection] Termine: ${count}`);
  console.log(`[events-selection] Datei geschrieben: ${SELECTION_PATH}`);
  console.log(`[events-selection] Gruppierte Datei geschrieben: ${GROUPED_SELECTION_PATH}`);
  console.log(`[events-selection] Serienveranstaltungen: ${grouped.seriesCount}`);
  for (const [groupName, groupCount] of Object.entries(grouped.groupCounts)) {
    console.log(`[events-selection] ${groupName}: ${groupCount}`);
  }
}

main().catch((error) => {
  console.error(`[events-selection] Fehler: ${error.message}`);
  process.exitCode = 1;
});
