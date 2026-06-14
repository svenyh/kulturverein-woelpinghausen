/**
 * Kulturverein Wölpinghausen – zentrales JavaScript
 * Header/Footer, Navigation, Lightbox
 */
(function () {
  'use strict';

  /** Zentrale Site-Konfiguration – hier URLs später leicht ändern */
  const SITE = {
    instagramUrl: 'https://www.instagram.com/kulturverein_woelpinghausen?igsh=enQyNnpzdjk0ZGs=',
    instagramHandle: '@kulturverein_woelpinghausen',
    instagramLabel: 'Instagram Kulturverein Wölpinghausen',
    logoSrc: 'images/logo-kulturverein.png',
    logoAlt: 'Logo Kulturverein Wölpinghausen',
  };

  const NAV = [
    { id: 'startseite', label: 'Startseite', href: 'index.html' },
    { id: 'termine', label: 'Termine', href: 'termine.html' },
    { id: 'ausfluege', label: 'Ausflüge', href: 'ausfluege.html' },
    { id: 'galerie', label: 'Galerie', href: 'galerie.html' },
    { id: 'partnervereine', label: 'Partnervereine', href: 'partnervereine.html' },
    { id: 'mitglied-werden', label: 'Mitglied werden', href: 'mitglied-werden.html' },
    { id: 'kontakt', label: 'Kontakt', href: 'kontakt.html' },
  ];

  const INSTAGRAM_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>';

  function logoImg(className, size) {
    return `<img src="${SITE.logoSrc}" alt="${SITE.logoAlt}" class="logo-img ${className}" width="${size}" height="${size}">`;
  }

  function instagramAttrs() {
    return `href="${SITE.instagramUrl}" target="_blank" rel="noopener noreferrer" aria-label="${SITE.instagramLabel}"`;
  }

  function renderHeader(activePage) {
    const links = NAV.map(
      (item) =>
        `<li><a href="${item.href}" class="nav__link${item.id === activePage ? ' nav__link--active' : ''}">${item.label}</a></li>`
    ).join('');

    return `
    <header class="header" id="header">
      <div class="container header__inner">
        <a href="index.html" class="header__logo" aria-label="Zur Startseite">
          ${logoImg('header__logo-img', 52)}
          <span class="header__logo-text">
            <span class="header__logo-name">Kulturverein</span>
            <span class="header__logo-place">Wölpinghausen</span>
          </span>
        </a>
        <button class="burger" id="burger" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav">
          <span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span>
        </button>
        <nav class="nav" id="nav" aria-label="Hauptnavigation">
          <ul class="nav__list">${links}</ul>
        </nav>
        <a href="login.html" class="header__login" aria-label="Mitglieder-Login">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
          Login
        </a>
        <a ${instagramAttrs()} class="header__instagram">${INSTAGRAM_SVG}</a>
      </div>
    </header>`;
  }

  function renderFooter() {
    const links = NAV.map((item) => `<li><a href="${item.href}">${item.label}</a></li>`).join('');
    return `
    <footer class="footer">
      <div class="container footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="footer__logo">
            ${logoImg('footer__logo-img', 56)}
            <span>Kulturverein<br>Wölpinghausen</span>
          </a>
          <p class="footer__tagline">Gemeinsam. Heimat. Tradition.</p>
        </div>
        <div class="footer__col">
          <h3 class="footer__heading">Kontakt</h3>
          <address class="footer__address">
            Kulturverein Wölpinghausen e.V.<br>Musterstraße 12<br>31515 Wölpinghausen<br>
            <a href="mailto:info@kulturverein-woelpinghausen.de">info@kulturverein-woelpinghausen.de</a><br>
            <a href="tel:+495089123456">05089 / 123456</a>
          </address>
        </div>
        <div class="footer__col">
          <h3 class="footer__heading">Schnellnavigation</h3>
          <ul class="footer__links">${links}</ul>
        </div>
        <div class="footer__col">
          <h3 class="footer__heading">Folge uns</h3>
          <a ${instagramAttrs()} class="footer__instagram">
            ${INSTAGRAM_SVG} ${SITE.instagramHandle}
          </a>
        </div>
      </div>
      <div class="footer__bottom">
        <div class="container footer__bottom-inner">
          <p>&copy; 2026 Kulturverein Wölpinghausen e.V.</p>
          <div class="footer__legal">
            <a href="impressum.html">Impressum</a><span aria-hidden="true">|</span><a href="datenschutz.html">Datenschutz</a>
          </div>
        </div>
      </div>
    </footer>`;
  }

  function initNav() {
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const header = document.getElementById('header');
    if (!burger || !nav) return;

    function toggle(forceClose) {
      const open = forceClose === true ? false : !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
      document.body.style.overflow = open ? 'hidden' : '';
    }

    burger.addEventListener('click', () => toggle());
    nav.querySelectorAll('.nav__link').forEach((l) => l.addEventListener('click', () => {
      if (window.innerWidth < 992) toggle(true);
    }));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) { toggle(true); burger.focus(); }
    });
    window.addEventListener('scroll', () => {
      if (header) header.style.boxShadow = window.scrollY > 10 ? '0 4px 20px rgba(0,0,0,0.25)' : '';
    }, { passive: true });
  }

  function initLightbox() {
    const gallery = document.querySelector('[data-lightbox]');
    if (!gallery) return;

    const overlay = document.createElement('div');
    overlay.className = 'lightbox';
    overlay.hidden = true;
    overlay.innerHTML = '<button class="lightbox__close" aria-label="Schließen">&times;</button><img class="lightbox__img" alt="">';
    document.body.appendChild(overlay);

    const img = overlay.querySelector('.lightbox__img');
    const close = () => { overlay.hidden = true; document.body.style.overflow = ''; };

    gallery.querySelectorAll('img').forEach((thumb) => {
      thumb.style.cursor = 'pointer';
      thumb.addEventListener('click', () => {
        img.src = thumb.src;
        img.alt = thumb.alt;
        overlay.hidden = false;
        document.body.style.overflow = 'hidden';
      });
    });

    overlay.querySelector('.lightbox__close').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) close(); });
  }

  function initInstagramLinks() {
    document.querySelectorAll('[data-instagram-link]').forEach((el) => {
      el.href = SITE.instagramUrl;
      el.target = '_blank';
      el.rel = 'noopener noreferrer';
      el.setAttribute('aria-label', SITE.instagramLabel);
    });
  }

  function initFavicon() {
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.rel = 'icon';
      document.head.appendChild(icon);
    }
    icon.href = SITE.logoSrc;
    icon.type = 'image/png';

    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      apple.href = SITE.logoSrc;
      document.head.appendChild(apple);
    }
  }

  function initForms() {
    document.querySelectorAll('[data-form-notice]').forEach((form) => {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const notice = form.querySelector('.form-notice') || document.getElementById(form.dataset.formNotice);
        if (notice) {
          notice.hidden = false;
          notice.textContent = form.dataset.successMessage || 'Vielen Dank! Die digitale Verarbeitung wird in Kürze freigeschaltet.';
        }
        form.reset();
      });
    });
  }

  function initImageFallbacks() {
    document.querySelectorAll('img').forEach((img) => {
      if (img.dataset.fallbackInit) return;
      img.dataset.fallbackInit = '1';

      const chain = [
        img.dataset.fallback,
        SITE.logoSrc,
      ].filter(Boolean);

      let step = 0;
      const tryNext = () => {
        while (step < chain.length) {
          const next = chain[step++];
          if (next && next !== img.getAttribute('src')) {
            if (next.includes('logo')) {
              img.classList.add('img--contain');
            }
            img.src = next;
            return;
          }
        }
        img.classList.add('img--error');
      };

      img.addEventListener('error', tryNext);
    });
  }

  function markActiveNav(activePage) {
    document.querySelectorAll('.nav__link').forEach((link) => {
      link.classList.remove('nav__link--active');
    });
    if (!activePage) return;
    const match = NAV.find((item) => item.id === activePage);
    if (!match) return;
    const activeLink = document.querySelector(`.nav__link[href="${match.href}"]`);
    if (activeLink) activeLink.classList.add('nav__link--active');
  }

  function boot() {
    const page = document.body.dataset.page || '';
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');

    if (headerSlot && !document.getElementById('header')) {
      headerSlot.innerHTML = renderHeader(page);
    } else {
      markActiveNav(page);
    }

    if (footerSlot && !footerSlot.querySelector('.footer')) {
      footerSlot.innerHTML = renderFooter();
    }

    initNav();
    initLightbox();
    initInstagramLinks();
    initFavicon();
    initImageFallbacks();
    initForms();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  window.KVW = SITE;
})();
