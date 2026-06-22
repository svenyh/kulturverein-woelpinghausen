const MEDIA_AREAS = [
  {
    id: 'koeln-2024',
    title: 'Köln 2024',
    coverPath: '/images/events/koeln-2024/koeln-2024-cover.png',
    videoPath: '/videos/koeln-2024.mp4',
  },
  {
    id: 'duesseldorf-2025',
    title: 'Düsseldorf 2025',
    coverPath: '/images/events/duesseldorf-2025/duesseldorf-2025-cover.png',
    videoPath: '/videos/duesseldorf-2025.mp4',
  },
  {
    id: 'leipzig-2026',
    title: 'Leipzig 2026',
    coverPath: '/images/events/leipzig-2026/leipzig-2026-cover.png',
    videoPath: '/videos/leipzig-2026.mp4',
  },
];

const elements = {
  status: document.getElementById('media-status'),
  list: document.getElementById('media-list'),
  statAreas: document.getElementById('stat-areas'),
  statCovers: document.getElementById('stat-covers'),
  statVideos: document.getElementById('stat-videos'),
};

function setStatus(message, type = 'info') {
  elements.status.textContent = message;
  elements.status.dataset.type = type;
}

function displayPath(urlPath) {
  return urlPath.replace(/^\//, '');
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

function createAssetRow(label, path, exists, previewHtml = '') {
  const row = document.createElement('div');
  row.className = 'admin-media-row';

  const rowLabel = document.createElement('p');
  rowLabel.className = 'admin-media-row__label';
  rowLabel.textContent = label;

  const value = document.createElement('div');
  value.className = 'admin-media-row__value';

  const badge = document.createElement('span');
  badge.className = `admin-media-badge admin-media-badge--${exists ? 'yes' : 'no'}`;
  badge.textContent = exists ? 'Vorhanden' : 'Fehlt';

  const pathEl = document.createElement('p');
  pathEl.className = 'admin-media-path';
  pathEl.textContent = displayPath(path);

  value.append(badge, pathEl);
  if (previewHtml) {
    value.insertAdjacentHTML('beforeend', previewHtml);
  }

  row.append(rowLabel, value);
  return row;
}

function renderAreaCard(area, coverExists, videoExists) {
  const card = document.createElement('article');
  card.className = 'admin-media-card';
  card.setAttribute('aria-labelledby', `media-title-${area.id}`);

  const header = document.createElement('div');
  header.className = 'admin-media-card__header';
  header.innerHTML = `<h2 class="admin-media-card__title" id="media-title-${area.id}">${area.title}</h2>`;

  const body = document.createElement('div');
  body.className = 'admin-media-card__body';

  const coverPreview = coverExists
    ? `<div class="admin-media-preview"><img src="${area.coverPath}" alt="Cover ${area.title}" loading="lazy" width="220" height="124"></div>`
    : '';

  body.append(
    createAssetRow('Coverbild', area.coverPath, coverExists, coverPreview),
    createAssetRow('Video', area.videoPath, videoExists),
  );

  card.append(header, body);
  return card;
}

async function loadMediaOverview() {
  setStatus('Medien werden geprüft …', 'info');
  elements.list.replaceChildren();

  const results = await Promise.all(
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

  for (const { area, coverExists, videoExists } of results) {
    if (coverExists) coverCount += 1;
    if (videoExists) videoCount += 1;
    elements.list.append(renderAreaCard(area, coverExists, videoExists));
  }

  elements.statAreas.textContent = String(MEDIA_AREAS.length);
  elements.statCovers.textContent = `${coverCount} / ${MEDIA_AREAS.length}`;
  elements.statVideos.textContent = `${videoCount} / ${MEDIA_AREAS.length}`;

  const complete = coverCount === MEDIA_AREAS.length && videoCount === MEDIA_AREAS.length;
  if (complete) {
    setStatus('Alle erwarteten Medien sind vorhanden.', 'success');
  } else {
    setStatus('Einige Medien fehlen noch. Dateien werden über Git/Cursor gepflegt.', 'warning');
  }
}

loadMediaOverview();
