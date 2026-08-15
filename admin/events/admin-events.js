(function () {
  'use strict';

  const PAGE_SIZE = 50;
  const OFFLINE_MESSAGE = 'Online-Verbindung wird vorbereitet.';
  const state = {
    groups: [],
    events: [],
    managedEvents: [],
    page: 1,
    dirty: false,
    busy: false,
    apiOnline: false,
  };

  const elements = {
    status: document.getElementById('admin-status'),
    offlineNotice: document.getElementById('offline-notice'),
    summary: document.getElementById('candidate-summary'),
    list: document.getElementById('candidate-list'),
    empty: document.getElementById('candidate-empty'),
    year: document.getElementById('filter-year'),
    month: document.getElementById('filter-month'),
    organizer: document.getElementById('filter-organizer'),
    series: document.getElementById('filter-series'),
    importButton: document.getElementById('import-events'),
    saveButton: document.getElementById('save-selection'),
    publishButton: document.getElementById('publish-events'),
    statLoaded: document.getElementById('stat-loaded'),
    statVisible: document.getElementById('stat-visible'),
    statSelected: document.getElementById('stat-selected'),
    statSeries: document.getElementById('stat-series'),
    pagination: document.getElementById('candidate-pagination'),
    pagePrevious: document.getElementById('page-previous'),
    pageNext: document.getElementById('page-next'),
    pageStatus: document.getElementById('page-status'),
    newEventButton: document.getElementById('new-event'),
    eventForm: document.getElementById('event-form'),
    eventId: document.getElementById('event-id'),
    cancelEventButton: document.getElementById('cancel-event'),
    saveEventButton: document.getElementById('save-event'),
    upcomingEvents: document.getElementById('upcoming-events'),
    upcomingEventsEmpty: document.getElementById('upcoming-events-empty'),
    pastEvents: document.getElementById('past-events'),
    pastEventsEmpty: document.getElementById('past-events-empty'),
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function setApiOnline(online) {
    state.apiOnline = online;
    elements.offlineNotice.hidden = online;
    updateActionButtons();
  }

  function updateActionButtons() {
    elements.importButton.disabled = state.busy || !state.apiOnline;
    elements.publishButton.disabled = state.busy || state.dirty || !state.apiOnline;
    elements.saveButton.disabled = state.busy || !state.events.length || !state.dirty || !state.apiOnline;
    elements.newEventButton.disabled = state.busy || !state.apiOnline;
    elements.saveEventButton.disabled = state.busy;
    updatePaginationControls();
  }

  function setBusy(busy) {
    state.busy = busy;
    updateActionButtons();
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
    const years = Array.from(
      new Set(state.events.map((event) => String(event.date || '').slice(0, 4)).filter(Boolean))
    ).sort();
    const organizations = Array.from(new Set(state.events.map(organizationName))).sort((a, b) =>
      a.localeCompare(b, 'de')
    );
    addOptions(elements.year, years);
    addOptions(elements.month, months);
    addOptions(elements.organizer, organizations);
  }

  function matchesFilters(event) {
    const seriesValue = elements.series.value;
    return (
      (!elements.year.value || String(event.date || '').startsWith(elements.year.value)) &&
      (!elements.month.value || event._month === elements.month.value) &&
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
      updateStats();
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

  function updateStats(visibleEvents) {
    const visible = visibleEvents || filteredEvents();
    const approved = state.events.filter((event) => event.showOnWebsite === true).length;
    const series = state.events.filter(isSeries).length;
    elements.statLoaded.textContent = String(state.events.length);
    elements.statVisible.textContent = String(visible.length);
    elements.statSelected.textContent = String(approved);
    elements.statSeries.textContent = String(series);
  }

  function updatePaginationControls(visibleCount) {
    const count = visibleCount == null ? filteredEvents().length : visibleCount;
    const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
    elements.pagination.hidden = count <= PAGE_SIZE;
    elements.pagePrevious.disabled = state.busy || state.page <= 1;
    elements.pageNext.disabled = state.busy || state.page >= pageCount;
    elements.pageStatus.textContent = `Seite ${state.page} von ${pageCount}`;
  }

  function renderEvents() {
    const events = filteredEvents();
    const pageCount = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
    state.page = Math.min(state.page, pageCount);
    const pageStart = (state.page - 1) * PAGE_SIZE;
    const pageEvents = events.slice(pageStart, pageStart + PAGE_SIZE);
    elements.list.replaceChildren(...pageEvents.map(createEventCard));
    elements.empty.hidden = events.length > 0;
    elements.summary.textContent = events.length
      ? `Seite ${state.page} von ${pageCount} · ${pageEvents.length} Termine auf dieser Seite`
      : '0 Termine';
    updateStats(events);
    updatePaginationControls(events.length);
  }

  function createManagedEventCard(event) {
    const card = document.createElement('article');
    card.className = 'admin-events-compact-card';
    const content = document.createElement('div');
    content.className = 'admin-events-compact-card__content';
    content.append(
      textElement('h4', '', event.title),
      textElement(
        'p',
        '',
        `${formatDate(event.date)} · ${event.startTime || 'ohne Uhrzeit'}${event.endTime ? `–${event.endTime}` : ''}${event.location ? ` · ${event.location}` : ''}`
      )
    );
    if (event.category) content.append(textElement('p', '', event.category));
    const status = textElement(
      'span',
      `admin-events-compact-card__status${event.status === 'published' ? ' is-published' : ''}`,
      event.status === 'published' ? 'Veröffentlicht' : 'Entwurf'
    );
    content.append(status);

    const actions = document.createElement('div');
    actions.className = 'admin-events-compact-card__actions';
    const edit = textElement('button', 'btn btn--outline', 'Bearbeiten');
    edit.type = 'button';
    edit.addEventListener('click', () => openEventForm(event));
    const remove = textElement('button', 'btn btn--outline', 'Löschen');
    remove.type = 'button';
    remove.addEventListener('click', () => removeEvent(event));
    actions.append(edit, remove);
    card.append(content, actions);
    return card;
  }

  function renderManagedEvents() {
    const today = new Date();
    const todayKey = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, '0'),
      String(today.getDate()).padStart(2, '0'),
    ].join('-');
    const upcoming = state.managedEvents
      .filter((event) => event.date >= todayKey)
      .sort((left, right) => left.date.localeCompare(right.date) || left.startTime.localeCompare(right.startTime));
    const past = state.managedEvents
      .filter((event) => event.date < todayKey)
      .sort((left, right) => right.date.localeCompare(left.date) || right.startTime.localeCompare(left.startTime));
    elements.upcomingEvents.replaceChildren(...upcoming.map(createManagedEventCard));
    elements.pastEvents.replaceChildren(...past.map(createManagedEventCard));
    elements.upcomingEventsEmpty.hidden = upcoming.length > 0;
    elements.pastEventsEmpty.hidden = past.length > 0;
  }

  function openEventForm(event) {
    const values = event || {
      id: '',
      title: '',
      description: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      category: '',
      sourceUrl: '',
      status: 'draft',
    };
    elements.eventId.value = values.id || '';
    for (const name of ['title', 'description', 'date', 'startTime', 'endTime', 'location', 'category', 'sourceUrl', 'status']) {
      elements.eventForm.elements[name].value = values[name] || (name === 'status' ? 'draft' : '');
    }
    elements.eventForm.hidden = false;
    elements.eventForm.elements.title.focus();
  }

  function closeEventForm() {
    elements.eventForm.reset();
    elements.eventId.value = '';
    elements.eventForm.hidden = true;
  }

  async function loadManagedEvents() {
    const payload = await api('/api/admin/events');
    state.managedEvents = Array.isArray(payload.events) ? payload.events : [];
    renderManagedEvents();
  }

  async function saveEvent(event) {
    event.preventDefault();
    if (!elements.eventForm.reportValidity()) return;
    const formData = new FormData(elements.eventForm);
    const payload = Object.fromEntries(formData.entries());
    const id = elements.eventId.value;
    if (id) payload.id = id;

    setBusy(true);
    setStatus(id ? 'Termin wird gespeichert...' : 'Termin wird erstellt...');
    try {
      const result = await api('/api/admin/events', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(payload),
      });
      await loadManagedEvents();
      closeEventForm();
      setStatus(result.message, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function removeEvent(event) {
    if (!window.confirm(`Termin „${event.title}“ wirklich löschen?`)) return;
    setBusy(true);
    setStatus('Termin wird gelöscht...');
    try {
      const result = await api(`/api/admin/events?id=${encodeURIComponent(event.id)}`, {
        method: 'DELETE',
      });
      await loadManagedEvents();
      if (elements.eventId.value === event.id) closeEventForm();
      setStatus(result.message, 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  function isOfflineResponse(response) {
    return !response || response.status === 404 || response.status === 503;
  }

  async function api(path, options) {
    let response;
    try {
      response = await fetch(path, {
        ...options,
        headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
      });
    } catch {
      throw new Error(OFFLINE_MESSAGE);
    }

    let payload = {};
    try {
      payload = await response.json();
    } catch {
      if (isOfflineResponse(response)) {
        throw new Error(OFFLINE_MESSAGE);
      }
    }

    if (!response.ok) {
      if (isOfflineResponse(response)) {
        throw new Error(OFFLINE_MESSAGE);
      }
      throw new Error(payload.error || `HTTP ${response.status}`);
    }

    return payload;
  }

  function handleOffline(message) {
    setApiOnline(false);
    setStatus(message || OFFLINE_MESSAGE, 'info');
    setBusy(false);
  }

  async function loadCandidates(message) {
    setBusy(true);
    setStatus(message || 'Kandidaten werden geladen...');
    try {
      const payload = await api('/api/admin/candidates');
      setApiOnline(true);
      state.groups = payload.groups || [];
      state.events = state.groups.flatMap((group) =>
        Array.isArray(group.events)
          ? group.events.map((event) => ({ ...event, _month: group.month || '' }))
          : []
      );
      state.page = 1;
      state.dirty = false;
      prepareFilters();
      renderEvents();
      await loadManagedEvents();
      setStatus(
        state.events.length ? `${state.events.length} Kandidaten geladen.` : (payload.message || 'Noch keine Kandidaten geladen.'),
        state.events.length ? 'success' : 'info'
      );
    } catch (error) {
      handleOffline(error.message === OFFLINE_MESSAGE ? OFFLINE_MESSAGE : OFFLINE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  async function importEvents() {
    const confirmed = window.confirm(
      'Termine neu laden? Neue Kandidaten werden importiert. Bestehende Freigaben bleiben für gleiche Termin-IDs erhalten.'
    );
    if (!confirmed) return;

    setBusy(true);
    setStatus('Termine werden aus der Quelle geladen...');
    try {
      const payload = await api('/api/admin/import', { method: 'POST' });
      await loadCandidates(payload.message);
    } catch (error) {
      if (error.message === OFFLINE_MESSAGE) {
        handleOffline(OFFLINE_MESSAGE);
      } else {
        setStatus(error.message, 'error');
      }
    } finally {
      setBusy(false);
    }
  }

  async function publishEvents() {
    setBusy(true);
    setStatus('Eventkalender wird veröffentlicht...');
    try {
      const payload = await api('/api/admin/publish', { method: 'POST' });
      setStatus(payload.message, 'success');
    } catch (error) {
      if (error.message === OFFLINE_MESSAGE) {
        handleOffline(OFFLINE_MESSAGE);
      } else {
        setStatus(error.message, 'error');
      }
    } finally {
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
      const payload = await api('/api/admin/selection', {
        method: 'POST',
        body: JSON.stringify({ selections }),
      });
      state.dirty = false;
      setStatus(`${payload.message} ${payload.approvedCount} Termine sind freigegeben.`, 'success');
    } catch (error) {
      handleOffline(error.message === OFFLINE_MESSAGE ? OFFLINE_MESSAGE : OFFLINE_MESSAGE);
    } finally {
      setBusy(false);
    }
  }

  [elements.year, elements.month, elements.organizer, elements.series].forEach((select) => {
    select.addEventListener('change', () => {
      state.page = 1;
      renderEvents();
    });
  });
  elements.pagePrevious.addEventListener('click', () => {
    if (state.page <= 1) return;
    state.page -= 1;
    renderEvents();
  });
  elements.pageNext.addEventListener('click', () => {
    const pageCount = Math.ceil(filteredEvents().length / PAGE_SIZE);
    if (state.page >= pageCount) return;
    state.page += 1;
    renderEvents();
  });
  elements.importButton.addEventListener('click', importEvents);
  elements.saveButton.addEventListener('click', saveSelection);
  elements.publishButton.addEventListener('click', publishEvents);
  elements.newEventButton.addEventListener('click', () => openEventForm());
  elements.cancelEventButton.addEventListener('click', closeEventForm);
  elements.eventForm.addEventListener('submit', saveEvent);
  window.addEventListener('beforeunload', (event) => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = '';
  });

  loadCandidates();
})();
