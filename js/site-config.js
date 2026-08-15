/**
 * Zentrale Site-Konfiguration für URLs und Preview-Modus.
 * Beim Domain-Go-Live: previewNoindex entfernen/deaktivieren und baseUrl ersetzen.
 */
(function () {
  'use strict';

  window.KVW_SITE = {
    /** Aktuelle Preview-Basis-URL – beim Go-Live durch die endgültige Domain ersetzen. */
    baseUrl: 'https://kulturverein-woelpinghausen.pages.dev',
    /** Solange true: noindex auf öffentlichen Seiten (meta robots). Beim Go-Live auf false setzen. */
    previewNoindex: true,
    legalName: 'Kulturverein Wölpinghausen i.G.',
    instagramUrl: 'https://www.instagram.com/kulturverein_woelpinghausen?igsh=enQyNnpzdjk0ZGs=',
    instagramHandle: '@kulturverein_woelpinghausen',
    logoPath: '/images/logo-kulturverein.png',
  };
})();
