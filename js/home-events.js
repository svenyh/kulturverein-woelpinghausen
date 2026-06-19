(function () {
  'use strict';

  const MAX_EVENTS = 4;
  const EMPTY_MESSAGE = 'Aktuell sind noch keine kommenden Termine veröffentlicht.';
  const status = document.getElementById('home-events-status');
  const grid = document.getElementById('home-events-grid');

  if (!status || !grid) return;

  function textElement(tagName, className, text) {
    const element = document.createElement(tagName);
    element.className = className;
    element.textContent = text;
    return element;
  }

  function eventTimestamp(event) {
    const time = /^\d{2}:\d{2}$/.test(event.time || '') ? event.time : '00:00';
    const timestamp = new Date(`${event.date}T${time}:00`).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
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
    const [year, month, day] = event.date.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const monthName = new Intl.DateTimeFormat('de-DE', { month: 'short' })
      .format(date)
      .replace('.', '');

    const card = document.createElement('article');
    card.className = 'event-card';

    const image = document.createElement('div');
    image.className = 'event-card__image event-card__image--logo';

    const logo = document.createElement('img');
    logo.src = 'images/logo-kulturverein.png';
    logo.alt = '';
    logo.className = 'img--contain';
    logo.loading = 'lazy';
    image.appendChild(logo);

    const dateBadge = document.createElement('span');
    dateBadge.className = 'event-card__date';
    dateBadge.appendChild(textElement('span', 'event-card__day', day));
    dateBadge.appendChild(textElement('span', 'event-card__month', monthName));
    image.appendChild(dateBadge);

    const body = document.createElement('div');
    body.className = 'event-card__body';
    body.appendChild(textElement('h3', 'event-card__title', event.title));

    const details = [];
    if (event.time && event.time !== '00:00') details.push(`${event.time} Uhr`);
    if (event.location) details.push(event.location);
    if (details.length) {
      body.appendChild(textElement('p', 'event-card__desc', details.join(' · ')));
    }

    const link = textElement('a', 'event-card__link', 'Mehr Infos →');
    const sourceUrl = validSourceUrl(event.sourceUrl);
    link.href = sourceUrl || 'eventkalender.html';
    if (sourceUrl) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
    body.appendChild(link);

    card.append(image, body);
    return card;
  }

  function upcomingEvents(groups) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    return groups
      .flatMap((group) => (group && Array.isArray(group.events) ? group.events : []))
      .map((event) => ({ event, timestamp: eventTimestamp(event) }))
      .filter(({ event, timestamp }) => event && event.title && event.date && timestamp !== null)
      .filter(({ timestamp }) => timestamp >= startOfToday.getTime())
      .sort((left, right) => left.timestamp - right.timestamp)
      .slice(0, MAX_EVENTS)
      .map(({ event }) => event);
  }

  fetch('data/events.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((groups) => {
      const events = upcomingEvents(Array.isArray(groups) ? groups : []);
      if (!events.length) {
        status.textContent = EMPTY_MESSAGE;
        return;
      }

      const fragment = document.createDocumentFragment();
      events.forEach((event) => fragment.appendChild(renderEvent(event)));
      grid.replaceChildren(fragment);
      grid.hidden = false;
      status.hidden = true;
    })
    .catch(() => {
      status.textContent = 'Termine konnten derzeit nicht geladen werden.';
    });
})();
