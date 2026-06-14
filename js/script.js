/**
 * Kulturverein Wölpinghausen – zentrales JavaScript
 * Header/Footer, Navigation, Lightbox
 */
(function () {
  'use strict';

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

  function renderHeader(activePage) {
    const links = NAV.map(
      (item) =>
        `<li><a href="${item.href}" class="nav__link${item.id === activePage ? ' nav__link--active' : ''}">${item.label}</a></li>`
    ).join('');

    return `
    <header class="header" id="header">
      <div class="container header__inner">
        <a href="index.html" class="header__logo" aria-label="Zur Startseite">
          <img src="images/logo-kulturverein.png" alt="Logo Kulturverein Wölpinghausen" width="48" height="48">
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
        <a href="https://instagram.com" class="header__instagram" target="_blank" rel="noopener noreferrer" aria-label="Instagram">${INSTAGRAM_SVG}</a>
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
            <img src="images/logo-kulturverein.png" alt="" width="56" height="56">
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
          <a href="https://instagram.com" class="footer__instagram" target="_blank" rel="noopener noreferrer">
            ${INSTAGRAM_SVG} @kulturverein_woelpinghausen
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

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page || '';
    const headerSlot = document.getElementById('site-header');
    const footerSlot = document.getElementById('site-footer');
    if (headerSlot) headerSlot.innerHTML = renderHeader(page);
    if (footerSlot) footerSlot.innerHTML = renderFooter();
    initNav();
    initLightbox();
    initForms();
  });
})();
