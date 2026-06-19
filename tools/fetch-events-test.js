const fs = require('node:fs/promises');
const path = require('node:path');
const ical = require('node-ical');

const TIME_ZONE = 'Europe/Berlin';
const MAX_EVENTS = 20;
const CANDIDATE_RANGE_DAYS = 365;
const OUTPUT_PATH = path.resolve(__dirname, '..', 'data', 'events-test.json');
const CANDIDATES_PATH = path.resolve(__dirname, '..', 'data', 'events-candidates.json');
const REVIEW_PATH = path.resolve(__dirname, '..', 'data', 'events-candidates-review.md');

function dateParts(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

function dateKey(date) {
  const { year, month, day } = dateParts(date);
  return `${year}-${month}-${day}`;
}

function timeKey(date, isAllDay) {
  if (isAllDay) return null;

  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date);
}

function buildExportUrl(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split('-');
  const [endYear, endMonth, endDay] = endDate.split('-');
  const url = new URL('https://www.sachsenhagen.de/veranstaltungen/veranstaltungen.ical');

  const params = {
    zeitauswahl: '4',
    auswahl_woche_tage: '28',
    onlyMonat_select: `${startYear}${startMonth}`,
    beginn_datum: startDate,
    beginn_tag: startDay,
    beginn_monat: startMonth,
    beginn_jahr: startYear,
    ende_datum: endDate,
    ende_tag: endDay,
    ende_monat: endMonth,
    ende_jahr: endYear,
    suchwort: '',
    rubrik: '0',
    selected_kommune: '28050',
    ort: '28054',
    destination: '0',
    dest_id: '0',
    selected_destination: '0',
    select_ort: '0',
    highlights: '0',
    serie: '0',
    verband: '0',
    ressort: '0',
    von: '',
    bis: '',
  };

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function monthlyDateRanges(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
  const end = new Date(Date.UTC(endYear, endMonth - 1, endDay));
  let cursor = new Date(Date.UTC(startYear, startMonth - 1, startDay));
  const ranges = [];

  while (cursor <= end) {
    const monthEnd = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 0));
    const rangeEnd = monthEnd < end ? monthEnd : end;
    ranges.push({
      start: cursor.toISOString().slice(0, 10),
      end: rangeEnd.toISOString().slice(0, 10),
    });
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
  }

  return ranges;
}

function buildExportUrls(startDate, endDate) {
  if (process.env.SACHSENHAGEN_ICAL_URL) {
    return [process.env.SACHSENHAGEN_ICAL_URL];
  }

  return monthlyDateRanges(startDate, endDate)
    .map((range) => buildExportUrl(range.start, range.end));
}

function propertyValue(value) {
  if (value == null) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(propertyValue).filter(Boolean).join(', ');
  if (typeof value === 'object' && 'val' in value) return propertyValue(value.val);
  return String(value).trim();
}

function customProperty(event, name) {
  const withoutExtensionPrefix = name.replace(/^X-/i, '');
  const candidates = [
    name,
    name.toLowerCase(),
    name.toUpperCase(),
    withoutExtensionPrefix,
    withoutExtensionPrefix.toLowerCase(),
    withoutExtensionPrefix.toUpperCase(),
  ];
  const direct = candidates.map((candidate) => event[candidate]).find((value) => value != null);
  return propertyValue(direct);
}

function sourceUrl(event, rawId) {
  const idMatch = rawId.match(/^(\d+)_(\d+)$/);
  if (idMatch) {
    const [, ownerId, eventId] = idMatch;
    return `https://www.sachsenhagen.de/regional/veranstaltungen/detail-${eventId}-${ownerId}.html`;
  }

  return propertyValue(event.url) || null;
}

function organizerName(event) {
  return (
    customProperty(event, 'X-ORGANIZER') ||
    propertyValue(event.organizer) ||
    null
  );
}

function isAllDayEvent(event) {
  return Boolean(event.start?.dateOnly || event.datetype === 'date');
}

function normalizeEvent(event) {
  const rawId = customProperty(event, 'X-ID') || propertyValue(event.uid);

  return {
    date: dateKey(event.start),
    time: timeKey(event.start, isAllDayEvent(event)),
    title: propertyValue(event.summary) || 'Ohne Titel',
    location: propertyValue(event.location) || null,
    sourceUrl: sourceUrl(event, rawId),
    organizer: organizerName(event),
    rawId: rawId || null,
  };
}

function monthLabel(date) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: TIME_ZONE,
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function recurrenceInfo(event) {
  return (
    customProperty(event, 'X-SERIENCONTAINER') ||
    (event.rrule ? propertyValue(event.uid) : '')
  );
}

function locationIsUnclear(location) {
  if (!location) return true;
  if (/wölpinghausen|\b\d{5}\b/i.test(location)) return false;
  return !location.includes(',') && !location.includes('\n');
}

function candidateReviewNote(event, titleCounts) {
  const normalized = normalizeEvent(event);
  const notes = [];
  const relationText = [normalized.title, normalized.location, normalized.organizer]
    .filter(Boolean)
    .join(' ');

  if (locationIsUnclear(normalized.location)) {
    notes.push('Ort unklar');
  }
  if (recurrenceInfo(event) || (titleCounts.get(normalized.title) || 0) > 1) {
    notes.push('Serienveranstaltung');
  }
  if (/wölpinghausen/i.test(relationText)) {
    notes.push('möglicher Wölpinghausen-Bezug');
  }

  return notes.length ? notes.join('; ') : 'Manuelle Prüfung erforderlich';
}

function buildCandidateGroups(events) {
  const titleCounts = new Map();
  for (const event of events) {
    const title = propertyValue(event.summary) || 'Ohne Titel';
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  }

  const groups = [];
  const groupsByMonth = new Map();

  for (const event of events) {
    const month = monthLabel(event.start);
    if (!groupsByMonth.has(month)) {
      const group = { month, events: [] };
      groupsByMonth.set(month, group);
      groups.push(group);
    }

    groupsByMonth.get(month).events.push({
      ...normalizeEvent(event),
      showOnWebsite: false,
      reviewNote: candidateReviewNote(event, titleCounts),
    });
  }

  return groups;
}

function candidateEvents(groups) {
  return groups.flatMap((group) => group.events);
}

function reviewDate(date) {
  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
}

function reviewText(value, fallback) {
  if (!value) return fallback;
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '<br>')
    .replace(/([*_`])/g, '\\$1');
}

function buildReviewMarkdown(groups) {
  const lines = [
    '# Termin-Prüfliste für Donnerstag',
    '',
    '> Lokale Arbeitsdatei für die manuelle Auswahl. Eine Checkbox veröffentlicht noch keinen Termin.',
    '',
  ];

  for (const group of groups) {
    lines.push(`## ${group.month}`, '');

    for (const event of group.events) {
      lines.push(
        `### ${reviewDate(event.date)}`,
        '',
        '- [ ] Auf Website anzeigen?',
        `- **Uhrzeit:** ${event.time ? `${event.time} Uhr` : 'Keine Uhrzeit angegeben'}`,
        `- **Titel:** ${reviewText(event.title, 'Ohne Titel')}`,
        `- **Ort:** ${reviewText(event.location, 'Keine Ortsangabe')}`,
        `- **Prüfhinweis:** ${reviewText(event.reviewNote, 'Manuelle Prüfung erforderlich')}`,
        ''
      );
    }
  }

  return `${lines.join('\n')}\n`;
}

function frequentLocations(events, limit = 10) {
  const counts = new Map();
  for (const event of events) {
    const location = propertyValue(event.location) || 'Ohne Ortsangabe';
    counts.set(location, (counts.get(location) || 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'de'))
    .slice(0, limit);
}

function logDiagnostics(events, outputEvents, candidateSourceEvents) {
  const locationsOutsideWoelpinghausen = events
    .map((event) => propertyValue(event.location))
    .filter((location) => location && !/wölpinghausen/i.test(location));
  const locationSamples = [...new Set(locationsOutsideWoelpinghausen)].slice(0, 10);
  const seriesIds = events.map(recurrenceInfo).filter(Boolean);

  const titleCounts = new Map();
  for (const event of events) {
    const title = propertyValue(event.summary) || 'Ohne Titel';
    titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
  }
  const repeatedTitles = [...titleCounts.entries()]
    .filter(([, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([title, count]) => `${title} (${count})`);

  console.log(`[events-test] Geladene Termine: ${events.length}`);
  console.log(`[events-test] Ausgegebene Termine: ${outputEvents.length}`);
  console.log(
    `[events-test] Auffällige Orte ohne explizites Wölpinghausen: ${locationsOutsideWoelpinghausen.length}`
  );
  if (locationSamples.length) {
    console.log(`[events-test] Ortsbeispiele: ${locationSamples.join(' | ')}`);
  }
  console.log(`[events-test] Termine mit Serienhinweis: ${seriesIds.length}`);
  if (repeatedTitles.length) {
    console.log(`[events-test] Mögliche Wiederholungen: ${repeatedTitles.join(' | ')}`);
  }

  const topLocations = frequentLocations(candidateSourceEvents)
    .map(([location, count]) => `${location.replace(/\n/g, ', ')} (${count})`)
    .join(' | ');
  console.log(`[events-test] Kandidaten für manuelle Prüfung: ${candidateSourceEvents.length}`);
  if (topLocations) {
    console.log(`[events-test] Häufigste Kandidatenorte: ${topLocations}`);
  }
}

async function main() {
  const today = dateKey(new Date());
  const rangeEnd = dateKey(
    new Date(Date.now() + CANDIDATE_RANGE_DAYS * 24 * 60 * 60 * 1000)
  );
  const exportUrls = buildExportUrls(today, rangeEnd);
  const eventsById = new Map();

  console.log(`[events-test] Lade ${exportUrls.length} iCalendar-Zeiträume.`);

  for (const [index, exportUrl] of exportUrls.entries()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    let response;

    console.log(`[events-test] Zeitraum ${index + 1}/${exportUrls.length}: ${exportUrl}`);
    try {
      response = await fetch(exportUrl, {
        headers: {
          Accept: 'text/calendar',
          'User-Agent': 'Woelpinghausener-Kulturverein-Eventimport-Test/0.1',
        },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      throw new Error(`iCalendar-Abruf fehlgeschlagen: HTTP ${response.status}`);
    }

    const calendarText = await response.text();
    const calendar = await ical.async.parseICS(calendarText);
    const periodEvents = Object.values(calendar).filter(
      (entry) => entry?.type === 'VEVENT' && entry.start instanceof Date
    );

    for (const event of periodEvents) {
      const normalized = normalizeEvent(event);
      const identity = normalized.rawId || [
        normalized.date,
        normalized.time,
        normalized.title,
        normalized.location,
      ].join('|');
      if (!eventsById.has(identity)) {
        eventsById.set(identity, event);
      }
    }
  }

  const events = Array.from(eventsById.values());
  const upcoming = events
    .filter((event) => {
      const eventDate = dateKey(event.start);
      return eventDate >= today && eventDate <= rangeEnd;
    })
    .sort((a, b) => a.start - b.start);
  const outputEvents = upcoming.slice(0, MAX_EVENTS).map(normalizeEvent);
  const candidateSourceEvents = upcoming;
  const candidateGroups = buildCandidateGroups(candidateSourceEvents);

  logDiagnostics(events, outputEvents, candidateSourceEvents);

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(outputEvents, null, 2)}\n`, 'utf8');
  await fs.writeFile(
    CANDIDATES_PATH,
    `${JSON.stringify(candidateGroups, null, 2)}\n`,
    'utf8'
  );
  await fs.writeFile(REVIEW_PATH, buildReviewMarkdown(candidateGroups), 'utf8');

  console.log(`[events-test] Testdatei geschrieben: ${OUTPUT_PATH}`);
  console.log(`[events-test] Manuelle Prüfdatei geschrieben: ${CANDIDATES_PATH}`);
  console.log(`[events-test] Markdown-Prüfliste geschrieben: ${REVIEW_PATH}`);
  console.log(JSON.stringify(outputEvents, null, 2));
}

main().catch((error) => {
  console.error(`[events-test] Fehler: ${error.message}`);
  process.exitCode = 1;
});
