(function () {
  'use strict';

  document.querySelectorAll('[data-event-cover]').forEach((image) => {
    const showCover = () => {
      image.hidden = false;
    };

    const showFallback = () => {
      image.hidden = true;
    };

    image.addEventListener('load', showCover, { once: true });
    image.addEventListener('error', showFallback);

    if (image.complete) {
      image.naturalWidth > 0 ? showCover() : showFallback();
    }
  });

  document.querySelectorAll('.media-video[data-video-src]').forEach((container) => {
    const video = container.querySelector('.media-video__player');
    const placeholder = container.querySelector('.media-video__placeholder');
    const source = video && video.querySelector('source');

    if (!video || !placeholder || !source) return;

    const showPlayer = () => {
      video.hidden = false;
      placeholder.hidden = true;
    };

    const showPlaceholder = () => {
      video.hidden = true;
      placeholder.hidden = false;
    };

    video.addEventListener('loadedmetadata', showPlayer, { once: true });
    video.addEventListener('error', showPlaceholder);
    source.addEventListener('error', showPlaceholder);

    if (video.readyState >= 1) {
      showPlayer();
    } else {
      showPlaceholder();
      video.load();
    }
  });
})();
