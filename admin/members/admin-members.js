(function () {
  'use strict';

  const SECTION_LABELS = {
    news: 'Informationen',
    documents: 'Dokumente',
    events: 'Termine',
    helpers: 'Helfer',
  };

  const EMPTY_LABELS = {
    news: 'Noch keine Informationen vorhanden.',
    documents: 'Noch keine Dokumente vorhanden.',
    events: 'Noch keine Termine vorhanden.',
    helpers: 'Noch keine Helfer-Einsätze vorhanden.',
  };

  const STATUS_LABELS = {
    offen: 'Offen',
    besetzt: 'Besetzt',
    abgeschlossen: 'Abgeschlossen',
  };

  const state = {
    content: { news: [], documents: [], events: [], helpers: [] },
    activeSection: 'news',
    editingId: null,
    pendingDelete: null,
    busy: false,
    apiOnline: false,
  };

  const elements = {
    status: document.getElementById('members-admin-status'),
    tabs: document.querySelectorAll('[data-members-tab]'),
    panels: document.querySelectorAll('[data-members-panel]'),
    lists: {
      news: document.getElementById('members-admin-list-news'),
      documents: document.getElementById('members-admin-list-documents'),
      events: document.getElementById('members-admin-list-events'),
      helpers: document.getElementById('members-admin-list-helpers'),
    },
    addButtons: document.querySelectorAll('[data-members-add]'),
    dialog: document.getElementById('members-admin-dialog'),
    deleteDialog: document.getElementById('members-admin-delete-dialog'),
    formTitle: document.getElementById('members-admin-form-title'),
    formStatus: document.getElementById('members-admin-form-status'),
    form: document.getElementById('members-admin-form'),
    fields: document.getElementById('members-admin-fields'),
    close: document.getElementById('members-admin-close'),
    cancel: document.getElementById('members-admin-cancel'),
    save: document.getElementById('members-admin-save'),
    deleteCancel: document.getElementById('members-admin-delete-cancel'),
    deleteConfirm: document.getElementById('members-admin-delete-confirm'),
  };

  const FIELD_CONFIG = {
    news: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'priority', label: 'Priorität (Sortierung)', type: 'number', defaultValue: '0' },
      { name: 'visible', label: 'Aktiv', type: 'checkbox', defaultChecked: true },
    ],
    documents: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'filename', label: 'Dateiname', type: 'filename', required: true },
      { name: 'visible', label: 'Aktiv', type: 'checkbox', defaultChecked: true },
    ],
    events: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'eventDate', label: 'Datum', type: 'date', required: true },
      { name: 'eventTime', label: 'Uhrzeit', type: 'text' },
      { name: 'location', label: 'Ort', type: 'text' },
      { name: 'visible', label: 'Aktiv', type: 'checkbox', defaultChecked: true },
    ],
    helpers: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'eventName', label: 'Veranstaltung', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'contactPerson', label: 'Ansprechpartner', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'offen', label: 'Offen' },
          { value: 'besetzt', label: 'Besetzt' },
          { value: 'abgeschlossen', label: 'Abgeschlossen' },
        ],
      },
      { name: 'visible', label: 'Aktiv', type: 'checkbox', defaultChecked: true },
    ],
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function setFormStatus(message) {
    elements.formStatus.textContent = message || '';
    elements.formStatus.dataset.type = message ? 'error' : '';
  }

  function setBusy(busy) {
    state.busy = busy;
    elements.save.disabled = busy || !state.apiOnline;
    elements.addButtons.forEach((button) => {
      button.disabled = busy || !state.apiOnline;
    });
  }

  async function api(path, options) {
    const response = await fetch(path, {
      ...options,
      headers: options?.body
        ? { 'Content-Type': 'application/json', ...(options.headers || {}) }
        : options?.headers,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(payload.error || `HTTP ${response.status}`);
    }
    return payload;
  }

  function formatDate(value) {
    const parts = String(value || '').split('-');
    if (parts.length !== 3) return value || '–';
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function formatTimestamp(value) {
    if (!value) return '–';
    const normalized = String(value).replace(' ', 'T');
    const date = new Date(normalized);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getItemTitle(section, item) {
    return item.title || item.task || 'Ohne Titel';
  }

  function getSectionItems(section) {
    const items = state.content[section] || [];
    if (section === 'news') {
      return [...items].sort((a, b) => {
        const priorityDiff = (b.priority ?? 0) - (a.priority ?? 0);
        if (priorityDiff !== 0) return priorityDiff;
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
    }
    if (section === 'events') {
      return [...items].sort((a, b) => String(a.eventDate || '').localeCompare(String(b.eventDate || '')));
    }
    return items;
  }

  function renderDetails(section, item) {
    const rows = [];
    rows.push(`ID: ${item.id}`);
    rows.push(`Kategorie: ${item.category || '–'}`);
    if (section === 'news') rows.push(`Priorität: ${item.priority ?? 0}`);
    if (section === 'documents') rows.push(`Datei: ${item.filename || '–'}`);
    if (section === 'events') {
      rows.push(`Datum: ${formatDate(item.eventDate)}${item.eventTime ? ` · ${item.eventTime} Uhr` : ''}`);
      rows.push(`Ort: ${item.location || '–'}`);
    }
    if (section === 'helpers') {
      rows.push(`Veranstaltung: ${item.eventName || '–'}`);
      rows.push(`Status: ${STATUS_LABELS[item.status] || item.status}`);
      rows.push(`Ansprechpartner: ${item.contactPerson || '–'}`);
    }
    rows.push(`Erstellt: ${formatTimestamp(item.createdAt)}`);
    rows.push(`Aktualisiert: ${formatTimestamp(item.updatedAt)}`);
    return rows.join(' · ');
  }

  function itemToApiPayload(section, item) {
    if (section === 'news') {
      return {
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        priority: Number(item.priority ?? 0),
        visible: Boolean(item.visible),
      };
    }
    if (section === 'documents') {
      return {
        title: item.title,
        description: item.description || '',
        filename: item.filename,
        category: item.category || '',
        visible: Boolean(item.visible),
      };
    }
    if (section === 'events') {
      return {
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        eventDate: item.eventDate,
        eventTime: item.eventTime || '',
        location: item.location || '',
        visible: Boolean(item.visible),
      };
    }
    return {
      title: item.title,
      eventName: item.eventName,
      task: item.title,
      description: item.description || '',
      category: item.category || '',
      contactPerson: item.contactPerson || '',
      status: item.status || 'offen',
      visible: Boolean(item.visible),
    };
  }

  function renderLists() {
    Object.keys(elements.lists).forEach((section) => {
      const list = elements.lists[section];
      list.replaceChildren();

      if (!state.content[section].length) {
        const empty = document.createElement('p');
        empty.className = 'admin-members-empty';
        empty.textContent = EMPTY_LABELS[section];
        list.appendChild(empty);
        return;
      }

      getSectionItems(section).forEach((item) => {
        const card = document.createElement('article');
        card.className = 'admin-members-card';
        if (!item.visible) card.classList.add('admin-members-card--inactive');

        const top = document.createElement('div');
        top.className = 'admin-members-card__top';

        const statusBadge = document.createElement('span');
        statusBadge.className = `admin-members-badge ${item.visible ? 'admin-members-badge--active' : 'admin-members-badge--inactive'}`;
        statusBadge.textContent = item.visible ? '🟢 Aktiv' : '🔴 Inaktiv';

        const actions = document.createElement('div');
        actions.className = 'admin-members-card__toolbar';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'admin-members-icon-btn';
        editButton.title = 'Bearbeiten';
        editButton.textContent = '✏️';
        editButton.addEventListener('click', () => openDialog(section, item.id));

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'admin-members-icon-btn';
        toggleButton.title = item.visible ? 'Deaktivieren' : 'Aktivieren';
        toggleButton.textContent = '👁️';
        toggleButton.addEventListener('click', () => toggleVisibility(section, item.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'admin-members-icon-btn admin-members-icon-btn--danger';
        deleteButton.title = 'Löschen';
        deleteButton.textContent = '🗑️';
        deleteButton.addEventListener('click', () => openDeleteDialog(section, item.id));

        actions.append(editButton, toggleButton, deleteButton);
        top.append(statusBadge, actions);

        const title = document.createElement('h3');
        title.className = 'admin-members-card__title';
        title.textContent = getItemTitle(section, item);

        const description = document.createElement('p');
        description.className = 'admin-members-card__text';
        description.textContent = item.description || 'Keine Beschreibung hinterlegt.';

        const meta = document.createElement('p');
        meta.className = 'admin-members-card__meta';
        meta.textContent = renderDetails(section, item);

        card.append(top, title, description, meta);
        list.appendChild(card);
      });
    });
  }

  function switchTab(section) {
    state.activeSection = section;
    elements.tabs.forEach((tab) => {
      const isActive = tab.dataset.membersTab === section;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.membersPanel !== section;
    });
  }

  function buildForm(section, item) {
    elements.fields.replaceChildren();

    if (section === 'documents') {
      const hint = document.createElement('p');
      hint.className = 'admin-members-form-hint';
      hint.textContent =
        'PDF auswählen oder Dateiname eingeben. Dateien liegen unter /downloads/. Upload-Endpunkt ist vorbereitet – bis zur Aktivierung bitte Datei manuell ablegen.';
      elements.fields.appendChild(hint);
    }

    FIELD_CONFIG[section].forEach((field) => {
      const group = document.createElement('div');
      group.className = 'form-group';

      const label = document.createElement('label');
      label.textContent = field.label;
      label.setAttribute('for', `members-field-${field.name}`);
      group.appendChild(label);

      let input;
      if (field.type === 'textarea') {
        input = document.createElement('textarea');
        input.value = item?.[field.name] || '';
      } else if (field.type === 'checkbox') {
        input = document.createElement('input');
        input.type = 'checkbox';
        input.checked = item ? Boolean(item.visible) : field.defaultChecked !== false;
        input.name = 'visible';
      } else if (field.type === 'select') {
        input = document.createElement('select');
        field.options.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.label;
          input.appendChild(opt);
        });
        input.value = item?.[field.name] || field.options[0].value;
      } else if (field.type === 'filename') {
        const wrap = document.createElement('div');
        wrap.className = 'admin-members-file-field';

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,application/pdf';
        fileInput.id = 'members-field-file-picker';

        input = document.createElement('input');
        input.type = 'text';
        input.id = 'members-field-filename';
        input.name = 'filename';
        input.placeholder = 'z. B. satzung.pdf';
        input.value = item?.filename ?? '';
        input.required = true;

        fileInput.addEventListener('change', () => {
          const file = fileInput.files?.[0];
          if (!file) return;
          input.value = file.name;
        });

        wrap.append(fileInput, input);
        group.appendChild(wrap);
        elements.fields.appendChild(group);
        return;
      } else {
        input = document.createElement('input');
        input.type = field.type;
        input.value = item?.[field.name] ?? field.defaultValue ?? '';
      }

      input.id = `members-field-${field.name}`;
      input.name = field.name;
      if (field.required) input.required = true;
      group.appendChild(input);
      elements.fields.appendChild(group);
    });
  }

  function readForm(section) {
    const item = {};
    FIELD_CONFIG[section].forEach((field) => {
      if (field.type === 'filename') {
        const input = elements.fields.querySelector('[name="filename"]');
        item.filename = input?.value.trim() || '';
        return;
      }
      const input = elements.fields.querySelector(`[name="${field.name}"]`);
      if (!input) return;
      if (field.type === 'checkbox') {
        item.visible = input.checked;
      } else if (field.type === 'number') {
        item[field.name] = Number(input.value || 0);
      } else {
        item[field.name] = input.value.trim();
      }
    });
    return item;
  }

  function openDialog(section, id) {
    state.activeSection = section;
    state.editingId = id || null;
    const item = id ? state.content[section].find((entry) => entry.id === id) : null;
    elements.formTitle.textContent = item
      ? `${SECTION_LABELS[section]} bearbeiten`
      : `${SECTION_LABELS[section]} neu anlegen`;
    buildForm(section, item);
    setFormStatus('');
    elements.dialog.showModal();
  }

  function closeDialog() {
    state.editingId = null;
    setFormStatus('');
    elements.dialog.close();
  }

  function openDeleteDialog(section, id) {
    state.pendingDelete = { section, id };
    elements.deleteDialog.showModal();
  }

  function closeDeleteDialog() {
    state.pendingDelete = null;
    elements.deleteDialog.close();
  }

  async function saveItem() {
    const section = state.activeSection;
    if (!elements.form.reportValidity()) return;

    const item = readForm(section);
    const isEdit = Boolean(state.editingId);
    setBusy(true);
    setFormStatus('Speichern …');

    try {
      if (isEdit) {
        await api('/api/admin/members', {
          method: 'PATCH',
          body: JSON.stringify({ section, id: state.editingId, item }),
        });
      } else {
        await api('/api/admin/members', {
          method: 'POST',
          body: JSON.stringify({ section, item }),
        });
      }
      await loadContent(false);
      closeDialog();
      setStatus(isEdit ? 'Eintrag geändert.' : 'Eintrag gespeichert.', 'success');
    } catch (error) {
      setFormStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleVisibility(section, id) {
    const item = state.content[section].find((entry) => entry.id === id);
    if (!item) return;

    const nextItem = { ...item, visible: !item.visible };
    setBusy(true);

    try {
      await api('/api/admin/members', {
        method: 'PATCH',
        body: JSON.stringify({
          section,
          id,
          item: itemToApiPayload(section, nextItem),
        }),
      });
      await loadContent(false);
      setStatus(nextItem.visible ? 'Eintrag aktiviert.' : 'Eintrag deaktiviert.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const pending = state.pendingDelete;
    if (!pending) return;

    setBusy(true);
    try {
      await api(
        `/api/admin/members?section=${encodeURIComponent(pending.section)}&id=${encodeURIComponent(pending.id)}`,
        { method: 'DELETE' }
      );
      await loadContent(false);
      closeDeleteDialog();
      setStatus('Eintrag gelöscht.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function loadContent(showLoadedMessage = true) {
    setBusy(true);
    if (showLoadedMessage) setStatus('Mitgliederinhalte werden geladen …', 'info');
    try {
      const payload = await api('/api/admin/members');
      state.content = {
        news: payload.news || [],
        documents: payload.documents || [],
        events: payload.events || [],
        helpers: payload.helpers || [],
      };
      state.apiOnline = true;
      renderLists();
      switchTab(state.activeSection);
      if (showLoadedMessage) {
        setStatus('Mitgliederinhalte geladen. Einträge können gepflegt werden.', 'success');
      }
    } catch (error) {
      state.apiOnline = false;
      Object.keys(elements.lists).forEach((section) => {
        elements.lists[section].replaceChildren();
      });
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  elements.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.membersTab));
  });

  elements.addButtons.forEach((button) => {
    button.addEventListener('click', () => openDialog(button.dataset.membersAdd));
  });

  elements.close.addEventListener('click', closeDialog);
  elements.cancel.addEventListener('click', closeDialog);
  elements.save.addEventListener('click', saveItem);
  elements.deleteCancel.addEventListener('click', closeDeleteDialog);
  elements.deleteConfirm.addEventListener('click', confirmDelete);
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveItem();
  });
  elements.dialog.addEventListener('cancel', () => {
    state.editingId = null;
    setFormStatus('');
  });
  elements.deleteDialog.addEventListener('cancel', () => {
    state.pendingDelete = null;
  });

  switchTab('news');
  loadContent();
})();
