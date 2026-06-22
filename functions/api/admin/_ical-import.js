const TIME_ZONE = 'Europe/Berlin';
const CANDIDATE_RANGE_DAYS = 365;
const FETCH_TIMEOUT_MS = 30000;
const USER_AGENT = 'Kulturverein-Woelpinghausen-Eventimport/1.0';

function datePartsFromToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return {
    today: `${map.year}-${map.month}-${map.day}`,
    rangeEnd: dateKeyFromOffset(CANDIDATE_RANGE_DAYS),
  };
}

function dateKeyFromOffset(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${map.year}-${map.month}-${map.day}`;
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

function buildExportUrls(startDate, endDate, overrideUrl) {
  if (overrideUrl) {
    return [overrideUrl];
  }

  return monthlyDateRanges(startDate, endDate).map((range) => buildExportUrl(range.start, range.end));
}

function unfoldIcs(text) {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n[ \t]/g, '');
}

function unescapeIcsValue(value) {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function parsePropertyLine(line) {
  const colonIndex = line.indexOf(':');
  if (colonIndex === -1) {
    return null;
  }

  const left = line.slice(0, colonIndex);
  const value = unescapeIcsValue(line.slice(colonIndex + 1).trim());
  const segments = left.split(';');
  const name = segments[0].toUpperCase();
  const params = {};

  for (const segment of segments.slice(1)) {
    const separator = segment.indexOf('=');
    if (separator === -1) continue;
    params[segment.slice(0, separator).toUpperCase()] = segment.slice(separator + 1);
  }

  return { name, params, value };
}

function parseVeEvents(icsText) {
  const events = [];
  let inEvent = false;
  let current = {};

  for (const line of unfoldIcs(icsText).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true;
      current = {};
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      inEvent = false;
      events.push(current);
      current = {};
      continue;
    }

    if (!inEvent) continue;

    const property = parsePropertyLine(trimmed);
    if (!property) continue;
    current[property.name] = property;
  }

  return events;
}

function parseDtStart(property) {
  if (!property) {
    return null;
  }

  const value = property.value.trim();
  if (property.params.VALUE === 'DATE' || /^\d{8}$/.test(value)) {
    const dateValue = value.slice(0, 8);
    return {
      date: `${dateValue.slice(0, 4)}-${dateValue.slice(4, 6)}-${dateValue.slice(6, 8)}`,
      time: null,
      dateOnly: true,
    };
  }

  const match = value.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/);
  if (!match) {
    return null;
  }

  return {
    date: `${match[1]}-${match[2]}-${match[3]}`,
    time: `${match[4]}:${match[5]}`,
    dateOnly: false,
  };
}

function propertyValue(value) {
  if (value == null) return '';
  return String(value).trim();
}

function getProperty(vevent, name) {
  const property = vevent[name.toUpperCase()];
  return property ? propertyValue(property.value) : '';
}

function sourceUrl(rawId, urlProperty) {
  const idMatch = rawId.match(/^(\d+)_(\d+)$/);
  if (idMatch) {
    const [, ownerId, eventId] = idMatch;
    return `https://www.sachsenhagen.de/regional/veranstaltungen/detail-${eventId}-${ownerId}.html`;
  }

  return urlProperty || null;
}

function locationIsUnclear(location) {
  if (!location) return true;
  if (/wölpinghausen|\b\d{5}\b/i.test(location)) return false;
  return !location.includes(',') && !location.includes('\n');
}

function buildReviewNote(event, titleCounts) {
  const notes = [];
  const relationText = [event.title, event.location, event.organizer].filter(Boolean).join(' ');

  if (locationIsUnclear(event.location)) {
    notes.push('Ort unklar');
  }
  if (event.isSeries) {
    notes.push('Serienveranstaltung');
  } else if ((titleCounts.get(event.title) || 0) > 1) {
    notes.push('Serienveranstaltung');
  }
  if (/wölpinghausen/i.test(relationText)) {
    notes.push('möglicher Wölpinghausen-Bezug');
  }

  return notes.length ? notes.join('; ') : 'Manuelle Prüfung erforderlich';
}

function veventToCandidate(vevent) {
  const dtStart = parseDtStart(vevent.DTSTART);
  if (!dtStart) {
    return null;
  }

  const rawId = getProperty(vevent, 'X-ID') || getProperty(vevent, 'UID');
  if (!rawId) {
    return null;
  }

  const organizer =
    getProperty(vevent, 'X-ORGANIZER') ||
    getProperty(vevent, 'ORGANIZER').replace(/^mailto:/i, '') ||
    null;

  return {
    rawId,
    sourceUid: getProperty(vevent, 'UID') || rawId,
    date: dtStart.date,
    time: dtStart.time,
    title: getProperty(vevent, 'SUMMARY') || 'Ohne Titel',
    location: getProperty(vevent, 'LOCATION') || null,
    sourceUrl: sourceUrl(rawId, getProperty(vevent, 'URL') || null),
    organizer,
    isSeries: Boolean(getProperty(vevent, 'X-SERIENCONTAINER') || getProperty(vevent, 'RRULE')),
  };
}

async function fetchCalendarText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'text/calendar',
        'User-Agent': USER_AGENT,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`iCalendar-Abruf fehlgeschlagen: HTTP ${response.status}`);
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadImportCandidates(env) {
  const { today, rangeEnd } = datePartsFromToday();
  const exportUrls = buildExportUrls(today, rangeEnd, env.SACHSENHAGEN_ICAL_URL);
  const eventsById = new Map();

  for (const exportUrl of exportUrls) {
    const calendarText = await fetchCalendarText(exportUrl);
    const vevents = parseVeEvents(calendarText);

    for (const vevent of vevents) {
      const candidate = veventToCandidate(vevent);
      if (!candidate) continue;

      const identity =
        candidate.rawId ||
        [candidate.date, candidate.time, candidate.title, candidate.location].join('|');

      if (!eventsById.has(identity)) {
        eventsById.set(identity, candidate);
      }
    }
  }

  const upcoming = Array.from(eventsById.values())
    .filter((event) => event.date >= today && event.date <= rangeEnd)
    .sort((a, b) => {
      const aKey = `${a.date}T${a.time || '00:00'}`;
      const bKey = `${b.date}T${b.time || '00:00'}`;
      return aKey.localeCompare(bKey);
    });

  const titleCounts = new Map();
  for (const event of upcoming) {
    titleCounts.set(event.title, (titleCounts.get(event.title) || 0) + 1);
  }

  return upcoming.map((event) => {
    const reviewNote = buildReviewNote(event, titleCounts);
    return {
      ...event,
      reviewNote,
      isSeriesFlag: (event.isSeries || reviewNote.includes('Serienveranstaltung')) ? 1 : 0,
    };
  });
}
