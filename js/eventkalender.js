(function () {
  'use strict';

  const EMPTY_MESSAGE = 'Aktuell sind noch keine Termine zur Veröffentlichung freigegeben.';
  const status = document.getElementById('event-calendar-status');
  const groupsRoot = document.getElementById('event-calendar-groups');

  if (!status || !groupsRoot) return;

  function textElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function formatDate(dateString) {
    const [year, month, day] = String(dateString).split('-');
    if (!year || !month || !day) return dateString;
    return `${day}.${month}.${year}`;
  }

  function validSourceUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
    } catch {
      return null;
    }
  }

  function renderEvent(event) {
    const card = document.createElement('article');
    card.className = 'event-calendar-card';

    const body = document.createElement('div');
    body.className = 'event-calendar-card__body';

    const timeText = event.time
      ? `${event.time}${event.endTime ? `–${event.endTime}` : ''} Uhr`
      : '';
    const dateText = timeText
      ? `${formatDate(event.date)} · ${timeText}`
      : formatDate(event.date);
    body.appendChild(textElement('p', 'event-calendar-card__date', dateText));
    body.appendChild(textElement('h3', 'event-calendar-card__title', event.title));

    if (event.location) {
      body.appendChild(textElement('p', 'event-calendar-card__location', event.location));
    }
    if (event.category) {
      body.appendChild(textElement('p', 'event-calendar-card__organizer', event.category));
    }
    if (event.description) {
      body.appendChild(textElement('p', 'event-calendar-card__organizer', event.description));
    }
    if (event.organizer) {
      body.appendChild(
        textElement('p', 'event-calendar-card__organizer', `Veranstalter: ${event.organizer}`)
      );
    }

    const sourceUrl = validSourceUrl(event.sourceUrl);
    if (sourceUrl) {
      const link = textElement('a', 'event-calendar-card__link', 'Weitere Informationen');
      link.href = sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      body.appendChild(link);
    }

    card.appendChild(body);
    return card;
  }

  function renderGroups(groups) {
    const visibleGroups = groups.filter(
      (group) => group && Array.isArray(group.events) && group.events.length > 0
    );

    if (!visibleGroups.length) {
      status.textContent = EMPTY_MESSAGE;
      return;
    }

    const fragment = document.createDocumentFragment();
    for (const group of visibleGroups) {
      const section = document.createElement('section');
      section.className = 'event-calendar-month';
      section.appendChild(textElement('h2', 'event-calendar-month__title', group.month));

      const grid = document.createElement('div');
      grid.className = 'event-calendar-grid';
      for (const event of group.events) {
        grid.appendChild(renderEvent(event));
      }
      section.appendChild(grid);
      fragment.appendChild(section);
    }

    groupsRoot.replaceChildren(fragment);
    groupsRoot.hidden = false;
    status.hidden = true;
  }

  function hasVisibleGroups(groups) {
    return (
      Array.isArray(groups) &&
      groups.some((group) => group && Array.isArray(group.events) && group.events.length > 0)
    );
  }

  async function loadEventGroups() {
    try {
      const apiResponse = await fetch('/api/events', { cache: 'no-store' });
      if (apiResponse.ok) {
        const apiGroups = await apiResponse.json();
        if (hasVisibleGroups(apiGroups)) {
          return apiGroups;
        }
      }
    } catch {
      // Fallback auf data/events.json.
    }

    const jsonResponse = await fetch('data/events.json', { cache: 'no-store' });
    if (!jsonResponse.ok) throw new Error(`HTTP ${jsonResponse.status}`);
    const jsonGroups = await jsonResponse.json();
    return Array.isArray(jsonGroups) ? jsonGroups : [];
  }

  loadEventGroups()
    .then((groups) => {
      renderGroups(groups);
      injectEventStructuredData(groups);
    })
    .catch(() => {
      status.textContent = 'Termine konnten derzeit nicht geladen werden.';
    });

  function injectEventStructuredData(groups) {
    const events = [];
    for (const group of groups || []) {
      if (!group || !Array.isArray(group.events)) continue;
      for (const event of group.events) {
        if (!event?.title || !event?.date) continue;
        const item = {
          '@type': 'Event',
          name: event.title,
          startDate: event.time ? `${event.date}T${event.time}:00` : event.date,
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          eventStatus: 'https://schema.org/EventScheduled',
        };
        if (event.endTime) item.endDate = `${event.date}T${event.endTime}:00`;
        if (event.location) {
          item.location = { '@type': 'Place', name: event.location };
        }
        if (event.description) item.description = event.description;
        const sourceUrl = validSourceUrl(event.sourceUrl);
        if (sourceUrl) item.url = sourceUrl;
        events.push(item);
      }
    }
    if (!events.length) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': events,
    });
    document.head.appendChild(script);
  }
})();
