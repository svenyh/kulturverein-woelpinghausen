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

    const dateText = event.time
      ? `${formatDate(event.date)} · ${event.time} Uhr`
      : formatDate(event.date);
    body.appendChild(textElement('p', 'event-calendar-card__date', dateText));
    body.appendChild(textElement('h3', 'event-calendar-card__title', event.title));

    if (event.location) {
      body.appendChild(textElement('p', 'event-calendar-card__location', event.location));
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

  fetch('data/events.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((groups) => renderGroups(Array.isArray(groups) ? groups : []))
    .catch(() => {
      status.textContent = 'Termine konnten derzeit nicht geladen werden.';
    });
})();
