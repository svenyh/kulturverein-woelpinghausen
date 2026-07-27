(function () {
  'use strict';

  function initGalleryFromManifest(manifestPath, galleryEl, statusEl) {
    if (!galleryEl) return;

    fetch(manifestPath)
      .then((response) => {
        if (!response.ok) throw new Error('Manifest not found');
        return response.json();
      })
      .then((payload) => {
        const images = Array.isArray(payload.images) ? payload.images : [];
        galleryEl.replaceChildren();

        if (!images.length) {
          if (statusEl) statusEl.textContent = 'Noch keine Bilder hinterlegt.';
          return;
        }

        images.forEach((item) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'reisen-gallery__item';

          const img = document.createElement('img');
          img.src = item.src;
          img.alt = item.alt || '';
          img.loading = 'lazy';
          img.className = 'js-lightbox-img';
          img.width = 800;
          img.height = 600;

          button.appendChild(img);
          galleryEl.appendChild(button);
        });

        if (statusEl) statusEl.hidden = true;
        galleryEl.hidden = false;
      })
      .catch(() => {
        if (statusEl) statusEl.textContent = 'Galerie konnte nicht geladen werden.';
      });
  }

  window.ReisenReport = {
    initGalleryFromManifest,
  };
})();
