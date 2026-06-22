(function () {
  'use strict';

  const root = document.getElementById('veranstaltungen-detail');
  if (!root) return;

  const statusEl = document.getElementById('veranstaltungen-detail-status');
  const titleEl = document.getElementById('veranstaltungen-detail-title');
  const heroTitleEl = document.getElementById('veranstaltungen-hero-title');
  const yearEl = document.getElementById('veranstaltungen-detail-year');
  const coverEl = document.getElementById('veranstaltungen-detail-cover');
  const descriptionEl = document.getElementById('veranstaltungen-detail-description');
  const gallerySection = document.getElementById('veranstaltungen-gallery-section');
  const galleryEl = document.getElementById('veranstaltungen-gallery');
  const videoSection = document.getElementById('veranstaltungen-video-section');
  const videoEl = document.getElementById('veranstaltungen-video');

  function getSlugFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const index = parts.indexOf('veranstaltungen');
    if (index === -1 || index >= parts.length - 1) return '';
    return decodeURIComponent(parts[index + 1]);
  }

  function initGalleryLightbox(container) {
    const thumbs = container.querySelectorAll('.js-lightbox-img');
    if (!thumbs.length) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Bildansicht');
    overlay.innerHTML =
      '<button type="button" class="lightbox__close" aria-label="Schließen">&times;</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Vorheriges Bild" hidden>&#8249;</button>' +
      '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Nächstes Bild" hidden>&#8250;</button>' +
      '<figure class="lightbox__figure">' +
      '<img class="lightbox__img" alt="">' +
      '<figcaption class="lightbox__caption"></figcaption>' +
      '</figure>';
    document.body.appendChild(overlay);

    const imgEl = overlay.querySelector('.lightbox__img');
    const caption = overlay.querySelector('.lightbox__caption');
    const prevBtn = overlay.querySelector('.lightbox__nav--prev');
    const nextBtn = overlay.querySelector('.lightbox__nav--next');
    const closeBtn = overlay.querySelector('.lightbox__close');
    const items = Array.from(thumbs);
    let currentIndex = 0;

    const show = (index) => {
      currentIndex = index;
      const thumb = items[currentIndex];
      imgEl.src = thumb.currentSrc || thumb.src;
      imgEl.alt = thumb.alt;
      caption.textContent = thumb.alt || '';
      caption.hidden = !thumb.alt;
      const hasMultiple = items.length > 1;
      prevBtn.hidden = !hasMultiple;
      nextBtn.hidden = !hasMultiple;
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      closeBtn.focus();
    };

    const close = () => {
      overlay.hidden = true;
      document.body.style.overflow = '';
      imgEl.removeAttribute('src');
    };

    const step = (dir) => {
      show((currentIndex + dir + items.length) % items.length);
    };

    items.forEach((thumb, index) => {
      thumb.closest('button')?.addEventListener('click', () => show(index));
    });

    prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      step(-1);
    });
    nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      step(1);
    });
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener('keydown', (e) => {
      if (overlay.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  function renderGallery(gallery, eventTitle) {
    galleryEl.replaceChildren();

    gallery.forEach((path, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'veranstaltungen-gallery__item';

      const img = document.createElement('img');
      img.src = path;
      img.alt = `${eventTitle} – Foto ${index + 1}`;
      img.className = 'js-lightbox-img';
      img.loading = index < 4 ? 'eager' : 'lazy';
      img.width = 480;
      img.height = 360;

      button.appendChild(img);
      galleryEl.appendChild(button);
    });

    gallerySection.hidden = gallery.length === 0;
    if (gallery.length > 0) {
      initGalleryLightbox(galleryEl);
    }
  }

  function renderVideo(videoPath) {
    videoEl.replaceChildren();

    if (!videoPath) {
      videoSection.hidden = true;
      return;
    }

    const player = document.createElement('video');
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.setAttribute('aria-label', 'Veranstaltungsvideo');

    const source = document.createElement('source');
    source.src = videoPath;
    source.type = 'video/mp4';

    player.appendChild(source);
    player.addEventListener('error', () => {
      videoSection.hidden = true;
    });

    videoEl.appendChild(player);
    videoSection.hidden = false;
  }

  function renderCover(coverPath, title) {
    coverEl.replaceChildren();

    if (!coverPath) {
      coverEl.hidden = true;
      return;
    }

    const img = document.createElement('img');
    img.src = coverPath;
    img.alt = `Cover ${title}`;
    img.width = 960;
    img.height = 540;
    img.addEventListener('error', () => {
      coverEl.hidden = true;
    });

    coverEl.appendChild(img);
    coverEl.hidden = false;
  }

  function applySeo(event) {
    if (event.seoTitle) {
      document.title = `${event.seoTitle} – Kulturverein Wölpinghausen`;
    } else {
      document.title = `${event.title} – Kulturverein Wölpinghausen`;
    }

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta && event.description) {
      descriptionMeta.setAttribute('content', event.description);
    }
  }

  async function loadEvent() {
    const slug = getSlugFromPath();
    if (!slug) {
      statusEl.textContent = 'Veranstaltung nicht gefunden.';
      root.hidden = true;
      return;
    }

    statusEl.textContent = 'Veranstaltung wird geladen …';

    try {
      const response = await fetch(`/api/media?slug=${encodeURIComponent(slug)}`);
      const payload = await response.json();

      if (!response.ok || !payload.event) {
        statusEl.textContent = 'Veranstaltung nicht gefunden oder nicht veröffentlicht.';
        root.hidden = true;
        return;
      }

      const event = payload.event;
      applySeo(event);

      titleEl.textContent = event.title;
      heroTitleEl.textContent = event.title;
      yearEl.textContent = event.year ? String(event.year) : 'Veranstaltung';
      descriptionEl.textContent = event.description || '';

      renderCover(event.coverPath, event.title);
      renderGallery(Array.isArray(event.gallery) ? event.gallery : [], event.title);
      renderVideo(event.videoPath);

      statusEl.hidden = true;
      root.hidden = false;
    } catch {
      statusEl.textContent = 'Veranstaltung konnte nicht geladen werden.';
      root.hidden = true;
    }
  }

  loadEvent();
})();
