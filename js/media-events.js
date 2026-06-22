(function () {
  'use strict';

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
