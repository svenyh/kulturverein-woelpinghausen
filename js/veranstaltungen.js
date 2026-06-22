(function () {
  'use strict';

  const statusEl = document.getElementById('veranstaltungen-status');
  const listEl = document.getElementById('veranstaltungen-list');

  if (!statusEl || !listEl) return;

  function createCard(event) {
    const article = document.createElement('article');
    article.className = 'veranstaltungen-card';

    const cover = document.createElement('div');
    cover.className = 'veranstaltungen-card__cover';

    if (event.coverPath) {
      const img = document.createElement('img');
      img.src = event.coverPath;
      img.alt = `Cover ${event.title}`;
      img.loading = 'lazy';
      img.width = 640;
      img.height = 360;
      img.addEventListener('error', () => {
        img.remove();
        cover.appendChild(createCoverPlaceholder(event.title));
      });
      cover.appendChild(img);
    } else {
      cover.appendChild(createCoverPlaceholder(event.title));
    }

    const body = document.createElement('div');
    body.className = 'veranstaltungen-card__body';

    const year = document.createElement('p');
    year.className = 'veranstaltungen-card__year';
    year.textContent = event.year ? String(event.year) : 'Veranstaltung';

    const title = document.createElement('h2');
    title.className = 'veranstaltungen-card__title';
    title.textContent = event.title;

    const description = document.createElement('p');
    description.className = 'veranstaltungen-card__description';
    description.textContent = event.description || 'Weitere Informationen und Medien auf der Detailseite.';

    const actions = document.createElement('div');
    actions.className = 'veranstaltungen-card__actions';

    const link = document.createElement('a');
    link.className = 'btn btn--primary';
    link.href = `/veranstaltungen/${encodeURIComponent(event.slug)}/`;
    link.textContent = 'Mehr anzeigen';

    actions.appendChild(link);
    body.append(year, title, description, actions);
    article.append(cover, body);
    return article;
  }

  function createCoverPlaceholder(title) {
    const placeholder = document.createElement('div');
    placeholder.className = 'veranstaltungen-card__cover-placeholder';
    placeholder.textContent = title;
    return placeholder;
  }

  async function loadEvents() {
    statusEl.textContent = 'Veranstaltungen werden geladen …';

    try {
      const response = await fetch('/api/media');
      const payload = await response.json();
      const events = Array.isArray(payload.events) ? payload.events : [];

      listEl.replaceChildren();

      if (!events.length) {
        statusEl.textContent = 'Aktuell sind keine Veranstaltungen veröffentlicht.';
        return;
      }

      events.forEach((event) => {
        listEl.appendChild(createCard(event));
      });

      statusEl.hidden = true;
      listEl.hidden = false;
    } catch {
      statusEl.textContent = 'Veranstaltungen konnten nicht geladen werden.';
    }
  }

  loadEvents();
})();
