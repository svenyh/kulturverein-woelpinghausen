(function () {
  'use strict';

  function hideCoverPlaceholder(cover) {
    cover.classList.add('media-event-card__cover--has-image');
    const placeholder = cover.querySelector('.media-event-card__cover-placeholder');
    if (placeholder) placeholder.hidden = true;
  }

  function initCover(image) {
    const cover = image.closest('.media-event-card__cover');
    if (!cover) return;

    const fallbacks = (image.dataset.fallback || '')
      .split('|')
      .map((value) => value.trim())
      .filter(Boolean);
    let fallbackIndex = 0;

    const showCover = () => {
      image.hidden = false;
      hideCoverPlaceholder(cover);
    };

    const tryFallback = () => {
      if (fallbackIndex < fallbacks.length) {
        image.src = fallbacks[fallbackIndex++];
        return;
      }
      image.hidden = true;
    };

    image.addEventListener('load', () => {
      if (image.naturalWidth > 0) showCover();
      else tryFallback();
    }, { once: true });

    image.addEventListener('error', tryFallback);

    if (image.complete) {
      image.naturalWidth > 0 ? showCover() : tryFallback();
    }
  }

  document.querySelectorAll('[data-event-cover]').forEach(initCover);

  document.querySelectorAll('.media-video[data-video-src]').forEach((container) => {
    const video = container.querySelector('.media-video__player');
    const placeholder = container.querySelector('.media-video__placeholder');
    const source = video && video.querySelector('source');

    if (!video || !placeholder || !source) return;

    const showPlayer = () => {
      container.classList.add('media-video--ready');
      placeholder.hidden = true;
    };

    const showPlaceholder = () => {
      container.classList.remove('media-video--ready');
      placeholder.hidden = false;
    };

    video.addEventListener('loadeddata', showPlayer, { once: true });
    video.addEventListener('canplay', showPlayer, { once: true });
    video.addEventListener('error', showPlaceholder);
    source.addEventListener('error', showPlaceholder);

    showPlaceholder();
    video.load();
  });
})();
