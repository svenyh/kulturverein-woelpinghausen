(function () {
  'use strict';

  const OFFLINE_MESSAGE = 'Online-Verbindung wird vorbereitet.';

  const state = {
    events: [],
    results: [],
    activeEventId: null,
    galleryPaths: [],
    busy: false,
    apiOnline: false,
  };

  const elements = {
    status: document.getElementById('media-status'),
    list: document.getElementById('media-list'),
    statAreas: document.getElementById('stat-areas'),
    statCovers: document.getElementById('stat-covers'),
    statVideos: document.getElementById('stat-videos'),
    dialog: document.getElementById('media-edit-dialog'),
    editTitle: document.getElementById('media-edit-title'),
    editKicker: document.getElementById('media-edit-kicker'),
    editYear: document.getElementById('media-edit-year'),
    editSlug: document.getElementById('media-edit-slug'),
    editTitleInput: document.getElementById('media-edit-title-input'),
    editSeoTitle: document.getElementById('media-edit-seo-title'),
    editCoverPath: document.getElementById('media-edit-cover-path'),
    editVideoPath: document.getElementById('media-edit-video-path'),
    editDescription: document.getElementById('media-edit-description'),
    editNote: document.getElementById('media-edit-note'),
    editShowWebsite: document.getElementById('media-edit-show-website'),
    editShowArchive: document.getElementById('media-edit-show-archive'),
    galleryList: document.getElementById('media-gallery-list'),
    galleryEmpty: document.getElementById('media-gallery-empty'),
    galleryAdd: document.getElementById('media-gallery-add'),
    editNoteStatus: document.getElementById('media-edit-note-status'),
    editClose: document.getElementById('media-edit-close'),
    editCancel: document.getElementById('media-edit-cancel'),
    editSave: document.getElementById('media-edit-save'),
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function setApiOnline(online) {
    state.apiOnline = online;
    updateSaveButton();
  }

  function setBusy(busy) {
    state.busy = busy;
    updateSaveButton();
    elements.galleryAdd.disabled = busy || !state.activeEventId;
  }

  function updateSaveButton() {
    elements.editSave.disabled = state.busy || !state.apiOnline || !state.activeEventId;
  }

  function displayPath(urlPath) {
    return String(urlPath || '').replace(/^\//, '');
  }

  function isOfflineResponse(response) {
    return !response || response.status === 404 || response.status === 503;
  }

  async function api(path, options) {
    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers: options?.body
          ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
          : options?.headers,
      });
    } catch {
      throw new Error(OFFLINE_MESSAGE);
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      if (isOfflineResponse(response)) {
        throw new Error(OFFLINE_MESSAGE);
      }
    }

    if (!response.ok) {
      if (isOfflineResponse(response)) {
        throw new Error(OFFLINE_MESSAGE);
      }
      throw new Error(payload.error || `HTTP ${response.status}`);
    }

    return payload;
  }

  async function assetExists(urlPath) {
    if (!urlPath) return false;

    try {
      const headResponse = await fetch(urlPath, { method: 'HEAD' });
      if (headResponse.ok) {
        return true;
      }
    } catch {
      // Fallback below.
    }

    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(urlPath)) {
      return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve(true);
        image.onerror = () => resolve(false);
        image.src = urlPath;
      });
    }

    try {
      const response = await fetch(urlPath, { method: 'GET', headers: { Range: 'bytes=0-0' } });
      return response.ok || response.status === 206;
    } catch {
      return false;
    }
  }

  function createBadge(kind, text) {
    const badge = document.createElement('span');
    badge.className = `admin-media-badge admin-media-badge--${kind}`;
    badge.textContent = text;
    return badge;
  }

  function createActionButton(label, options) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${options.primary ? 'btn--primary' : 'btn--outline'}`;
    button.textContent = label;
    button.disabled = Boolean(options.disabled);
    if (options.disabledReason) {
      button.title = options.disabledReason;
    }
    if (options.onClick) {
      button.addEventListener('click', options.onClick);
    }
    return button;
  }

  function renderGalleryList() {
    elements.galleryList.replaceChildren();
    elements.galleryEmpty.hidden = state.galleryPaths.length > 0;

    state.galleryPaths.forEach((path, index) => {
      const item = document.createElement('li');
      item.className = 'admin-media-gallery__item';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'admin-media-gallery__input';
      input.value = path;
      input.spellcheck = false;
      input.autocomplete = 'off';
      input.addEventListener('input', () => {
        state.galleryPaths[index] = input.value.trim();
      });

      const actions = document.createElement('div');
      actions.className = 'admin-media-gallery__actions';

      const upButton = createActionButton('↑', {
        disabled: index === 0,
        onClick: () => {
          if (index === 0) return;
          [state.galleryPaths[index - 1], state.galleryPaths[index]] = [
            state.galleryPaths[index],
            state.galleryPaths[index - 1],
          ];
          renderGalleryList();
        },
      });
      const downButton = createActionButton('↓', {
        disabled: index === state.galleryPaths.length - 1,
        onClick: () => {
          if (index >= state.galleryPaths.length - 1) return;
          [state.galleryPaths[index + 1], state.galleryPaths[index]] = [
            state.galleryPaths[index],
            state.galleryPaths[index + 1],
          ];
          renderGalleryList();
        },
      });
      const removeButton = createActionButton('Entfernen', {
        onClick: () => {
          state.galleryPaths.splice(index, 1);
          renderGalleryList();
        },
      });

      actions.append(upButton, downButton, removeButton);
      item.append(input, actions);
      elements.galleryList.appendChild(item);
    });
  }

  function renderAreaCard(entry) {
    const { event, coverExists, videoExists } = entry;
    const card = document.createElement('article');
    card.className = 'admin-media-card';
    card.setAttribute('aria-labelledby', `media-title-${event.id}`);

    const preview = document.createElement('div');
    preview.className = 'admin-media-card__preview';
    if (coverExists) {
      const img = document.createElement('img');
      img.src = event.coverPath;
      img.alt = `Cover ${event.title}`;
      img.loading = 'lazy';
      img.width = 320;
      img.height = 180;
      preview.appendChild(img);
    } else {
      preview.innerHTML = '<p class="admin-media-card__preview-empty">Kein Cover vorhanden</p>';
    }

    const content = document.createElement('div');
    content.className = 'admin-media-card__content';

    const header = document.createElement('div');
    header.className = 'admin-media-card__header';
    header.innerHTML = `<h2 class="admin-media-card__title" id="media-title-${event.id}">${event.title}</h2>`;

    const badges = document.createElement('div');
    badges.className = 'admin-media-card__badges';
    badges.append(
      createBadge(coverExists ? 'yes' : 'no', coverExists ? 'Cover vorhanden' : 'Cover fehlt'),
      createBadge(videoExists ? 'yes' : 'no', videoExists ? 'Video vorhanden' : 'Video fehlt'),
      createBadge(event.showOnWebsite ? 'yes' : 'no', event.showOnWebsite ? 'Webseite aktiv' : 'Webseite aus'),
      createBadge('soon', 'Upload folgt später'),
    );

    const description = document.createElement('p');
    description.className = 'admin-media-card__description';
    description.textContent = event.description || 'Keine Beschreibung hinterlegt.';

    const meta = document.createElement('p');
    meta.className = 'admin-media-card__meta-line';
    meta.textContent = `${event.gallery.length} Galerie-Bilder · Slug: ${event.slug}`;

    const paths = document.createElement('div');
    paths.className = 'admin-media-card__paths';
    paths.innerHTML = `
      <p><span>Cover:</span> <code>${displayPath(event.coverPath)}</code></p>
      <p><span>Video:</span> <code>${displayPath(event.videoPath) || '–'}</code></p>
    `;

    const actions = document.createElement('div');
    actions.className = 'admin-media-card__actions';
    actions.append(
      createActionButton('Bearbeiten', {
        primary: true,
        disabled: !state.apiOnline,
        disabledReason: state.apiOnline ? '' : OFFLINE_MESSAGE,
        onClick: () => openEditDialog(entry),
      }),
      createActionButton('Cover ansehen', {
        disabled: !coverExists,
        disabledReason: coverExists ? '' : 'Cover ist nicht vorhanden.',
        onClick: () => window.open(event.coverPath, '_blank', 'noopener,noreferrer'),
      }),
      createActionButton('Video prüfen', {
        disabled: !videoExists,
        disabledReason: videoExists ? '' : 'Video ist nicht vorhanden.',
        onClick: () => window.open(event.videoPath, '_blank', 'noopener,noreferrer'),
      }),
    );

    content.append(header, badges, description, meta, paths, actions);
    card.append(preview, content);
    return card;
  }

  async function buildResults(events) {
    return Promise.all(
      events.map(async (event) => {
        const [coverExists, videoExists] = await Promise.all([
          assetExists(event.coverPath),
          assetExists(event.videoPath),
        ]);
        return { event, coverExists, videoExists };
      }),
    );
  }

  async function renderOverview() {
    elements.list.replaceChildren();

    let coverCount = 0;
    let videoCount = 0;

    for (const entry of state.results) {
      if (entry.coverExists) coverCount += 1;
      if (entry.videoExists) videoCount += 1;
      elements.list.append(renderAreaCard(entry));
    }

    elements.statAreas.textContent = String(state.events.length);
    elements.statCovers.textContent = `${coverCount} / ${state.events.length}`;
    elements.statVideos.textContent = `${videoCount} / ${state.events.length}`;

    const complete = coverCount === state.events.length && videoCount === state.events.length;
    if (complete) {
      setStatus('Alle erwarteten Medien sind vorhanden. Metadaten können bearbeitet und gespeichert werden.', 'success');
    } else {
      setStatus('Einige Medien fehlen noch. Metadaten können bearbeitet werden – Upload folgt später.', 'warning');
    }
  }

  function getActiveEntry() {
    return state.results.find((entry) => entry.event.id === state.activeEventId) || null;
  }

  function openEditDialog(entry) {
    const { event, coverExists, videoExists } = entry;
    state.activeEventId = event.id;
    state.galleryPaths = Array.isArray(event.gallery) ? [...event.gallery] : [];

    elements.editKicker.textContent = 'Veranstaltung bearbeiten';
    elements.editTitle.textContent = event.title;
    elements.editYear.textContent = String(event.year || '–');
    elements.editSlug.textContent = event.slug;
    elements.editTitleInput.value = event.title || '';
    elements.editSeoTitle.value = event.seoTitle || '';
    elements.editDescription.value = event.description || '';
    elements.editCoverPath.value = event.coverPath || '';
    elements.editVideoPath.value = event.videoPath || '';
    elements.editNote.value = event.internalNote || '';
    elements.editShowWebsite.checked = event.showOnWebsite !== false;
    elements.editShowArchive.checked = event.showInArchive !== false;
    elements.editNoteStatus.textContent = [
      coverExists ? 'Cover vorhanden' : 'Cover fehlt',
      videoExists ? 'Video vorhanden' : 'Video fehlt',
    ].join(' · ');

    renderGalleryList();
    updateSaveButton();
    elements.dialog.showModal();
  }

  function closeEditDialog() {
    state.activeEventId = null;
    state.galleryPaths = [];
    elements.editNoteStatus.textContent = '';
    updateSaveButton();
    elements.dialog.close();
  }

  function replaceEvent(updatedEvent) {
    state.events = state.events.map((event) => (event.id === updatedEvent.id ? updatedEvent : event));
    state.results = state.results.map((entry) =>
      entry.event.id === updatedEvent.id ? { ...entry, event: updatedEvent } : entry
    );
  }

  function collectGalleryPaths() {
    return elements.galleryList
      .querySelectorAll('.admin-media-gallery__input')
      .values()
      .map((input) => input.value.trim())
      .filter(Boolean);
  }

  async function saveActiveChanges() {
    const entry = getActiveEntry();
    if (!entry || !state.apiOnline) return;

    setBusy(true);
    elements.editNoteStatus.textContent = 'Änderungen werden gespeichert …';

    try {
      const payload = await api('/api/admin/media', {
        method: 'POST',
        body: JSON.stringify({
          id: entry.event.id,
          title: elements.editTitleInput.value.trim(),
          description: elements.editDescription.value,
          seoTitle: elements.editSeoTitle.value,
          internalNote: elements.editNote.value,
          coverPath: elements.editCoverPath.value,
          videoPath: elements.editVideoPath.value,
          gallery: collectGalleryPaths(),
          showOnWebsite: elements.editShowWebsite.checked,
          showInArchive: elements.editShowArchive.checked,
        }),
      });

      replaceEvent(payload.event);
      state.results = await buildResults(state.events);
      await renderOverview();
      elements.editNoteStatus.textContent = payload.message;
      setStatus(`${payload.message} (${payload.event.title})`, 'success');
    } catch (error) {
      elements.editNoteStatus.textContent =
        error.message === OFFLINE_MESSAGE ? OFFLINE_MESSAGE : error.message;
    } finally {
      setBusy(false);
    }
  }

  function addGalleryPath() {
    const path = window.prompt('Pfad zum Galerie-Bild eingeben (z. B. /images/events/koeln-2024/01.jpg):');
    if (!path || !path.trim()) return;
    state.galleryPaths.push(path.trim());
    renderGalleryList();
  }

  async function loadMediaOverview() {
    setBusy(true);
    setStatus('Medien werden geladen …', 'info');
    elements.list.replaceChildren();

    try {
      const payload = await api('/api/admin/media');
      setApiOnline(true);
      state.events = Array.isArray(payload.events) ? payload.events : [];
      state.results = await buildResults(state.events);
      await renderOverview();
    } catch (error) {
      setApiOnline(false);
      setStatus(error.message === OFFLINE_MESSAGE ? OFFLINE_MESSAGE : error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  elements.editClose.addEventListener('click', closeEditDialog);
  elements.editCancel.addEventListener('click', closeEditDialog);
  elements.editSave.addEventListener('click', saveActiveChanges);
  elements.galleryAdd.addEventListener('click', addGalleryPath);
  elements.dialog.addEventListener('cancel', () => {
    state.activeEventId = null;
    state.galleryPaths = [];
    elements.editNoteStatus.textContent = '';
    updateSaveButton();
  });

  loadMediaOverview();
})();
