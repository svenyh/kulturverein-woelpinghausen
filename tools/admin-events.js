(function () {
  'use strict';

  const state = {
    groups: [],
    events: [],
    dirty: false,
    busy: false,
  };

  const elements = {
    status: document.getElementById('admin-status'),
    summary: document.getElementById('candidate-summary'),
    list: document.getElementById('candidate-list'),
    empty: document.getElementById('candidate-empty'),
    month: document.getElementById('filter-month'),
    organizer: document.getElementById('filter-organizer'),
    series: document.getElementById('filter-series'),
    importButton: document.getElementById('import-events'),
    saveButton: document.getElementById('save-selection'),
    publishButton: document.getElementById('publish-events'),
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function setBusy(busy) {
    state.busy = busy;
    elements.importButton.disabled = busy;
    elements.publishButton.disabled = busy || state.dirty;
    elements.saveButton.disabled = busy || !state.events.length || !state.dirty;
  }

  function organizationName(event) {
    const value = event.organizer || event.location || 'Nicht angegeben';
    return String(value).split(/\r?\n/)[0].trim() || 'Nicht angegeben';
  }

  function isSeries(event) {
    return String(event.reviewNote || '').includes('Serienveranstaltung');
  }

  function formatDate(date) {
    const parsed = new Date(`${date}T12:00:00`);
    if (Number.isNaN(parsed.getTime())) return date || 'Datum fehlt';
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsed);
  }

  function addOptions(select, values) {
    const firstOption = select.options[0].cloneNode(true);
    select.replaceChildren(firstOption);
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  function prepareFilters() {
    const months = state.groups.map((group) => group.month).filter(Boolean);
    const organizations = Array.from(new Set(state.events.map(organizationName)))
      .sort((a, b) => a.localeCompare(b, 'de'));
    addOptions(elements.month, months);
    addOptions(elements.organizer, organizations);
  }

  function matchesFilters(event) {
    const groupMonth = state.groups.find((group) => group.events.includes(event))?.month || '';
    const seriesValue = elements.series.value;
    return (
      (!elements.month.value || groupMonth === elements.month.value) &&
      (!elements.organizer.value || organizationName(event) === elements.organizer.value) &&
      (!seriesValue || (seriesValue === 'yes') === isSeries(event))
    );
  }

  function textElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function createEventCard(event) {
    const card = document.createElement('article');
    card.className = 'admin-event-card';

    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'admin-event-card__approval';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = event.showOnWebsite === true;
    checkbox.dataset.rawId = event.rawId;
    checkbox.addEventListener('change', () => {
      event.showOnWebsite = checkbox.checked;
      state.dirty = true;
      setBusy(false);
      updateSummary();
      setStatus('Ungespeicherte Änderungen vorhanden.', 'warning');
    });
    checkboxLabel.append(checkbox, document.createTextNode(' Auf Website anzeigen'));

    const content = document.createElement('div');
    content.className = 'admin-event-card__content';
    const meta = textElement(
      'p',
      'admin-event-card__meta',
      `${formatDate(event.date)} | ${event.time || 'ohne Uhrzeit'}`
    );
    const title = textElement('h3', 'admin-event-card__title', event.title || 'Ohne Titel');
    const organization = textElement(
      'p',
      'admin-event-card__detail',
      `Organisation: ${organizationName(event)}`
    );
    const location = textElement(
      'p',
      'admin-event-card__detail',
      `Ort: ${event.location || 'Nicht angegeben'}`
    );
    const review = textElement(
      'p',
      'admin-event-card__note',
      event.reviewNote || 'Manuelle Prüfung erforderlich'
    );
    const badge = textElement(
      'span',
      `admin-event-card__badge${isSeries(event) ? ' is-series' : ''}`,
      isSeries(event) ? 'Serie' : 'Einzeltermin'
    );

    content.append(meta, title, organization, location, review, badge);
    card.append(checkboxLabel, content);
    return card;
  }

  function filteredEvents() {
    return state.events.filter(matchesFilters);
  }

  function updateSummary() {
    const visible = filteredEvents().length;
    const approved = state.events.filter((event) => event.showOnWebsite === true).length;
    elements.summary.textContent = `${visible} von ${state.events.length} sichtbar | ${approved} zur Veröffentlichung ausgewählt`;
  }

  function renderEvents() {
    const events = filteredEvents();
    elements.list.replaceChildren(...events.map(createEventCard));
    elements.empty.hidden = events.length > 0;
    updateSummary();
  }

  async function api(path, options) {
    const response = await fetch(path, {
      ...options,
      headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `HTTP ${response.status}`);
    return payload;
  }

  async function loadCandidates(message) {
    setBusy(true);
    setStatus(message || 'Kandidaten werden geladen...');
    try {
      const payload = await api('/api/candidates');
      state.groups = payload.groups || [];
      state.events = state.groups.flatMap((group) => Array.isArray(group.events) ? group.events : []);
      state.dirty = false;
      prepareFilters();
      renderEvents();
      setStatus(
        state.events.length ? `${state.events.length} Kandidaten geladen.` : (payload.message || 'Noch keine Kandidaten geladen.'),
        state.events.length ? 'success' : 'info'
      );
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function importEvents() {
    const confirmed = window.confirm(
      'Termine neu laden? Die Kandidatenliste wird ersetzt und alle Freigaben werden auf Nein gesetzt.'
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus('Termine werden aus der Quelle geladen...');
    try {
      const payload = await api('/api/import', { method: 'POST' });
      await loadCandidates(payload.message);
    } catch (error) {
      setStatus(error.message, 'error');
      setBusy(false);
    }
  }

  async function saveSelection() {
    setBusy(true);
    setStatus('Auswahl wird gespeichert...');
    try {
      const selections = state.events.map((event) => ({
        rawId: event.rawId,
        showOnWebsite: event.showOnWebsite === true,
      }));
      const payload = await api('/api/selection', {
        method: 'POST',
        body: JSON.stringify({ selections }),
      });
      state.dirty = false;
      setStatus(`${payload.message} ${payload.approvedCount} Termine sind freigegeben.`, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function publishEvents() {
    setBusy(true);
    setStatus('Eventkalender wird lokal veröffentlicht...');
    try {
      const payload = await api('/api/publish', { method: 'POST' });
      setStatus(payload.message, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  [elements.month, elements.organizer, elements.series].forEach((select) => {
    select.addEventListener('change', renderEvents);
  });
  elements.importButton.addEventListener('click', importEvents);
  elements.saveButton.addEventListener('click', saveSelection);
  elements.publishButton.addEventListener('click', publishEvents);
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadCandidates();
})();
