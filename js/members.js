(function () {
  'use strict';

  const PENDING_FILE_HINT = 'Datei wird noch ergänzt';
  const PLACEHOLDER_FILENAMES = new Set(['folgt.pdf', 'folgt.txt']);

  const sections = {
    news: {
      status: document.getElementById('members-news-status'),
      list: document.getElementById('members-news-list'),
      empty: 'Keine Informationen vorhanden.',
    },
    documents: {
      status: document.getElementById('members-documents-status'),
      list: document.getElementById('members-documents-list'),
      empty: 'Keine Dokumente vorhanden.',
    },
    events: {
      status: document.getElementById('members-events-status'),
      list: document.getElementById('members-events-list'),
      empty: 'Keine Termine vorhanden.',
    },
    helpers: {
      status: document.getElementById('members-helpers-status'),
      list: document.getElementById('members-helpers-list'),
      empty: 'Keine Helfereinsätze vorhanden.',
    },
  };

  const fileExistsCache = new Map();

  function formatDate(value) {
    const parts = String(value || '').split('-');
    if (!value || parts.length !== 3) return 'Termin folgt';
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function isPlaceholderFilename(filename) {
    const normalized = String(filename || '').trim().toLowerCase();
    return !normalized || PLACEHOLDER_FILENAMES.has(normalized);
  }

  async function fileExists(urlPath) {
    if (fileExistsCache.has(urlPath)) return fileExistsCache.get(urlPath);

    let exists = false;
    try {
      const response = await fetch(urlPath, { method: 'HEAD' });
      const contentType = String(response.headers.get('content-type') || '').toLowerCase();
      exists = response.ok && !contentType.includes('text/html');
    } catch {
      exists = false;
    }

    fileExistsCache.set(urlPath, exists);
    return exists;
  }

  function createBadge(text) {
    const badge = document.createElement('span');
    badge.className = 'members-badge';
    badge.textContent = text;
    return badge;
  }

  function createCard(title, text, metaNodes) {
    const card = document.createElement('article');
    card.className = 'members-card';

    if (metaNodes?.length) {
      const meta = document.createElement('div');
      meta.className = 'members-card__meta';
      metaNodes.forEach((node) => meta.appendChild(node));
      card.appendChild(meta);
    }

    const heading = document.createElement('h3');
    heading.className = 'members-card__title';
    heading.textContent = title;
    card.appendChild(heading);

    if (text) {
      const paragraph = document.createElement('p');
      paragraph.className = 'members-card__text';
      paragraph.textContent = text;
      card.appendChild(paragraph);
    }

    return card;
  }

  function createPendingNotice() {
    const notice = document.createElement('p');
    notice.className = 'members-file-pending';
    notice.textContent = PENDING_FILE_HINT;
    return notice;
  }

  async function appendDownloadAction(card, item) {
    const filename = String(item.filename || '').trim();
    if (!filename || isPlaceholderFilename(filename)) {
      card.appendChild(createPendingNotice());
      return;
    }

    const urlPath = `/downloads/${encodeURIComponent(filename)}`;
    const exists = await fileExists(urlPath);
    if (!exists) {
      card.appendChild(createPendingNotice());
      return;
    }

    const link = document.createElement('a');
    link.href = urlPath;
    link.className = 'members-download';
    link.textContent = 'PDF herunterladen';
    link.setAttribute('download', '');
    card.appendChild(link);
  }

  function renderList(target, items, renderer, emptyText) {
    target.list.replaceChildren();
    if (!items.length) {
      target.status.textContent = emptyText;
      target.status.hidden = false;
      target.list.hidden = true;
      return;
    }

    Promise.all(items.map((item) => renderer(item))).then((nodes) => {
      nodes.forEach((node) => target.list.appendChild(node));
      target.status.hidden = true;
      target.list.hidden = false;
    });
  }

  function renderNews(items) {
    renderList(
      sections.news,
      items,
      async (item) => createCard(item.title, item.description, [createBadge(item.category || 'Aktuelles')]),
      sections.news.empty
    );
  }

  function renderDocuments(items) {
    renderList(
      sections.documents,
      items,
      async (item) => {
        const card = createCard(item.title, item.description, [createBadge(item.category || 'Dokument')]);
        await appendDownloadAction(card, item);
        return card;
      },
      sections.documents.empty
    );
  }

  function renderEvents(items) {
    renderList(
      sections.events,
      items,
      async (item) => {
        const card = createCard(item.title, item.description, [createBadge(item.category || 'Termin')]);
        const details = document.createElement('dl');
        details.className = 'members-card__details';
        const dateText = item.eventDate
          ? `${formatDate(item.eventDate)}${item.eventTime ? ` · ${item.eventTime} Uhr` : ''}`
          : 'Termin folgt';
        details.innerHTML = `
          <div><dt>Datum</dt><dd>${dateText}</dd></div>
          <div><dt>Ort</dt><dd>${item.location || 'Ort folgt'}</dd></div>
        `;
        card.appendChild(details);
        return card;
      },
      sections.events.empty
    );
  }

  function renderHelpers(items) {
    renderList(
      sections.helpers,
      items,
      async (item) => {
        const card = createCard(item.title, item.description, [createBadge(item.eventName || 'Helfer gesucht')]);
        if (item.contactPerson) {
          const contact = document.createElement('p');
          contact.className = 'members-card__text';
          contact.textContent = `Ansprechpartner: ${item.contactPerson}`;
          card.appendChild(contact);
        }
        const note = document.createElement('p');
        note.className = 'members-contact-note';
        note.textContent = 'Bei Interesse bitte an den Vorstand wenden.';
        card.appendChild(note);
        return card;
      },
      sections.helpers.empty
    );
  }

  async function loadSection(path, key) {
    const response = await fetch(path);
    const payload = await response.json();
    return payload[key] || [];
  }

  async function boot() {
    Object.values(sections).forEach((section) => {
      if (section.status) section.status.textContent = 'Inhalte werden geladen …';
    });

    try {
      const [news, documents, events, helpers] = await Promise.all([
        loadSection('/api/members/news', 'news'),
        loadSection('/api/members/documents', 'documents'),
        loadSection('/api/members/events', 'events'),
        loadSection('/api/members/helpers', 'helpers'),
      ]);

      renderNews(news);
      renderDocuments(documents);
      renderEvents(events);
      renderHelpers(helpers);
    } catch {
      Object.values(sections).forEach((section) => {
        if (section.status) section.status.textContent = 'Inhalte konnten nicht geladen werden.';
      });
    }
  }

  boot();
})();
