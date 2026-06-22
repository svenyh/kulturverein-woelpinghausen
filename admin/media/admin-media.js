(function () {
  'use strict';

  const NOTES_STORAGE_PREFIX = 'admin-media-note:';

  const MEDIA_AREAS = [
    {
      id: 'koeln-2024',
      title: 'Köln 2024',
      year: '2024',
      coverPath: '/images/events/koeln-2024/koeln-2024-cover.png',
      videoPath: '/videos/koeln-2024.mp4',
      description:
        'Medien für die Veranstaltung in Köln 2024. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    },
    {
      id: 'duesseldorf-2025',
      title: 'Düsseldorf 2025',
      year: '2025',
      coverPath: '/images/events/duesseldorf-2025/duesseldorf-2025-cover.png',
      videoPath: '/videos/duesseldorf-2025.mp4',
      description:
        'Medien für die Veranstaltung in Düsseldorf 2025. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    },
    {
      id: 'leipzig-2026',
      title: 'Leipzig 2026',
      year: '2026',
      coverPath: '/images/events/leipzig-2026/leipzig-2026-cover.png',
      videoPath: '/videos/leipzig-2026.mp4',
      description:
        'Medien für die Veranstaltung in Leipzig 2026. Cover und Video werden auf der Webseite für diesen Eventbereich genutzt.',
    },
  ];

  const state = {
    results: [],
    activeAreaId: null,
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
    editCoverPath: document.getElementById('media-edit-cover-path'),
    editVideoPath: document.getElementById('media-edit-video-path'),
    editDescription: document.getElementById('media-edit-description'),
    editNote: document.getElementById('media-edit-note'),
    editNoteStatus: document.getElementById('media-edit-note-status'),
    editClose: document.getElementById('media-edit-close'),
    editCancel: document.getElementById('media-edit-cancel'),
    editSaveNote: document.getElementById('media-edit-save-note'),
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function displayPath(urlPath) {
    return urlPath.replace(/^\//, '');
  }

  function noteStorageKey(areaId) {
    return `${NOTES_STORAGE_PREFIX}${areaId}`;
  }

  function loadLocalNote(areaId) {
    try {
      return localStorage.getItem(noteStorageKey(areaId)) || '';
    } catch {
      return '';
    }
  }

  function saveLocalNote(areaId, note) {
    try {
      localStorage.setItem(noteStorageKey(areaId), note);
      return true;
    } catch {
      return false;
    }
  }

  async function assetExists(urlPath) {
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

  function renderAreaCard(entry) {
    const { area, coverExists, videoExists } = entry;
    const card = document.createElement('article');
    card.className = 'admin-media-card';
    card.setAttribute('aria-labelledby', `media-title-${area.id}`);

    const preview = document.createElement('div');
    preview.className = 'admin-media-card__preview';
    if (coverExists) {
      const img = document.createElement('img');
      img.src = area.coverPath;
      img.alt = `Cover ${area.title}`;
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
    header.innerHTML = `<h2 class="admin-media-card__title" id="media-title-${area.id}">${area.title}</h2>`;

    const badges = document.createElement('div');
    badges.className = 'admin-media-card__badges';
    badges.append(
      createBadge(coverExists ? 'yes' : 'no', coverExists ? 'Cover vorhanden' : 'Cover fehlt'),
      createBadge(videoExists ? 'yes' : 'no', videoExists ? 'Video vorhanden' : 'Video fehlt'),
      createBadge('soon', 'Upload folgt später'),
    );

    const paths = document.createElement('div');
    paths.className = 'admin-media-card__paths';
    paths.innerHTML = `
      <p><span>Cover:</span> <code>${displayPath(area.coverPath)}</code></p>
      <p><span>Video:</span> <code>${displayPath(area.videoPath)}</code></p>
    `;

    const actions = document.createElement('div');
    actions.className = 'admin-media-card__actions';
    actions.append(
      createActionButton('Bearbeiten', {
        primary: true,
        onClick: () => openEditDialog(entry),
      }),
      createActionButton('Cover ansehen', {
        disabled: !coverExists,
        disabledReason: coverExists ? '' : 'Cover ist nicht vorhanden.',
        onClick: () => window.open(area.coverPath, '_blank', 'noopener,noreferrer'),
      }),
      createActionButton('Video prüfen', {
        disabled: !videoExists,
        disabledReason: videoExists ? '' : 'Video ist nicht vorhanden.',
        onClick: () => window.open(area.videoPath, '_blank', 'noopener,noreferrer'),
      }),
    );

    content.append(header, badges, paths, actions);
    card.append(preview, content);
    return card;
  }

  function getActiveEntry() {
    return state.results.find((entry) => entry.area.id === state.activeAreaId) || null;
  }

  function openEditDialog(entry) {
    const { area, coverExists, videoExists } = entry;
    state.activeAreaId = area.id;

    elements.editKicker.textContent = 'Veranstaltung bearbeiten';
    elements.editTitle.textContent = area.title;
    elements.editYear.textContent = area.year;
    elements.editCoverPath.textContent = displayPath(area.coverPath);
    elements.editVideoPath.textContent = displayPath(area.videoPath);
    elements.editDescription.textContent = area.description;
    elements.editNote.value = loadLocalNote(area.id);
    elements.editNoteStatus.textContent = '';

    const statusParts = [];
    statusParts.push(coverExists ? 'Cover vorhanden' : 'Cover fehlt');
    statusParts.push(videoExists ? 'Video vorhanden' : 'Video fehlt');
    elements.editNoteStatus.textContent = statusParts.join(' · ');

    elements.dialog.showModal();
  }

  function closeEditDialog() {
    state.activeAreaId = null;
    elements.editNoteStatus.textContent = '';
    elements.dialog.close();
  }

  function saveActiveNote() {
    const entry = getActiveEntry();
    if (!entry) return;

    const note = elements.editNote.value.trim();
    const saved = saveLocalNote(entry.area.id, note);
    if (saved) {
      elements.editNoteStatus.textContent =
        'Notiz nur lokal in diesem Browser gespeichert – nicht auf dem Server.';
    } else {
      elements.editNoteStatus.textContent =
        'Notiz konnte nicht lokal gespeichert werden (Browser-Speicher blockiert).';
    }
  }

  async function loadMediaOverview() {
    setStatus('Medien werden geprüft …', 'info');
    elements.list.replaceChildren();

    state.results = await Promise.all(
      MEDIA_AREAS.map(async (area) => {
        const [coverExists, videoExists] = await Promise.all([
          assetExists(area.coverPath),
          assetExists(area.videoPath),
        ]);
        return { area, coverExists, videoExists };
      }),
    );

    let coverCount = 0;
    let videoCount = 0;

    for (const entry of state.results) {
      if (entry.coverExists) coverCount += 1;
      if (entry.videoExists) videoCount += 1;
      elements.list.append(renderAreaCard(entry));
    }

    elements.statAreas.textContent = String(MEDIA_AREAS.length);
    elements.statCovers.textContent = `${coverCount} / ${MEDIA_AREAS.length}`;
    elements.statVideos.textContent = `${videoCount} / ${MEDIA_AREAS.length}`;

    const complete = coverCount === MEDIA_AREAS.length && videoCount === MEDIA_AREAS.length;
    if (complete) {
      setStatus('Alle erwarteten Medien sind vorhanden. Bearbeiten öffnet Details und interne Notizen.', 'success');
    } else {
      setStatus(
        'Einige Medien fehlen noch. Dateien werden über Git/Cursor gepflegt – Upload folgt später.',
        'warning',
      );
    }
  }

  elements.editClose.addEventListener('click', closeEditDialog);
  elements.editCancel.addEventListener('click', closeEditDialog);
  elements.editSaveNote.addEventListener('click', saveActiveNote);
  elements.dialog.addEventListener('cancel', () => {
    state.activeAreaId = null;
    elements.editNoteStatus.textContent = '';
  });

  loadMediaOverview();
})();
