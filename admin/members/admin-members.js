(function () {
  'use strict';

  const SECTION_LABELS = {
    news: 'Aktuelle Informationen',
    documents: 'Dokumente',
    events: 'Interne Termine',
    helpers: 'Helfer',
  };

  const state = {
    content: { news: [], documents: [], events: [], helpers: [] },
    activeSection: 'news',
    editingId: null,
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
    formTitle: document.getElementById('members-admin-form-title'),
    formStatus: document.getElementById('members-admin-form-status'),
    form: document.getElementById('members-admin-form'),
    fields: document.getElementById('members-admin-fields'),
    close: document.getElementById('members-admin-close'),
    cancel: document.getElementById('members-admin-cancel'),
    save: document.getElementById('members-admin-save'),
  };

  const FIELD_CONFIG = {
    news: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'priority', label: 'Priorität', type: 'number', defaultValue: '0' },
      { name: 'visible', label: 'Sichtbar', type: 'checkbox', defaultChecked: true },
    ],
    documents: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'filename', label: 'Dateiname', type: 'text', required: true },
      { name: 'category', label: 'Kategorie', type: 'text' },
      { name: 'visible', label: 'Sichtbar', type: 'checkbox', defaultChecked: true },
    ],
    events: [
      { name: 'title', label: 'Titel', type: 'text', required: true },
      { name: 'eventDate', label: 'Datum', type: 'date', required: true },
      { name: 'eventTime', label: 'Uhrzeit', type: 'text' },
      { name: 'location', label: 'Ort', type: 'text' },
      { name: 'description', label: 'Beschreibung', type: 'textarea' },
      { name: 'visible', label: 'Sichtbar', type: 'checkbox', defaultChecked: true },
    ],
    helpers: [
      { name: 'eventName', label: 'Veranstaltung', type: 'text', required: true },
      { name: 'task', label: 'Aufgabe', type: 'text', required: true },
      { name: 'contactPerson', label: 'Ansprechpartner', type: 'text' },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'offen', label: 'Offen' },
          { value: 'besetzt', label: 'Besetzt' },
        ],
      },
    ],
  };

  function setStatus(message, type) {
    elements.status.textContent = message;
    elements.status.dataset.type = type || 'info';
  }

  function setFormStatus(message) {
    elements.formStatus.textContent = message || '';
  }

  function setBusy(busy) {
    state.busy = busy;
    elements.save.disabled = busy || !state.apiOnline;
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
    if (parts.length !== 3) return value;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }

  function getItemTitle(section, item) {
    if (section === 'helpers') return item.task;
    return item.title;
  }

  function renderMeta(section, item) {
    if (section === 'news') {
      return `${item.category || 'Info'} · Priorität ${item.priority} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    if (section === 'documents') {
      return `${item.category || 'Dokument'} · ${item.filename} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    if (section === 'events') {
      return `${formatDate(item.eventDate)}${item.eventTime ? ` · ${item.eventTime} Uhr` : ''}${item.location ? ` · ${item.location}` : ''} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    return `${item.eventName} · ${item.status} · ${item.contactPerson || 'Kein Ansprechpartner'}`;
  }

  function renderDescription(section, item) {
    if (section === 'helpers') return item.contactPerson ? `Ansprechpartner: ${item.contactPerson}` : '';
    return item.description || '';
  }

  function renderLists() {
    Object.keys(elements.lists).forEach((section) => {
      const list = elements.lists[section];
      list.replaceChildren();
      state.content[section].forEach((item) => {
        const card = document.createElement('article');
        card.className = 'admin-members-card';

        const header = document.createElement('div');
        header.className = 'admin-members-card__header';
        header.innerHTML = `
          <div>
            <h3 class="admin-members-card__title">${getItemTitle(section, item)}</h3>
            <p class="admin-members-card__meta">${renderMeta(section, item)}</p>
          </div>
          ${item.visible === false ? '<span class="admin-members-badge admin-members-badge--hidden">Ausgeblendet</span>' : ''}
        `;

        const text = document.createElement('p');
        text.className = 'admin-members-card__text';
        text.textContent = renderDescription(section, item);

        const actions = document.createElement('div');
        actions.className = 'admin-members-card__actions';

        const editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.className = 'btn btn--outline';
        editButton.textContent = 'Bearbeiten';
        editButton.addEventListener('click', () => openDialog(section, item.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn--outline';
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => deleteItem(section, item.id));

        actions.append(editButton, deleteButton);
        card.append(header, text, actions);
        list.appendChild(card);
      });
    });
  }

  function switchTab(section) {
    state.activeSection = section;
    elements.tabs.forEach((tab) => {
      tab.classList.toggle('is-active', tab.dataset.membersTab === section);
    });
    elements.panels.forEach((panel) => {
      panel.hidden = panel.dataset.membersPanel !== section;
    });
  }

  function buildForm(section, item) {
    elements.fields.replaceChildren();
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
        input.checked = item ? Boolean(item[field.name]) : field.defaultChecked !== false;
      } else if (field.type === 'select') {
        input = document.createElement('select');
        field.options.forEach((option) => {
          const opt = document.createElement('option');
          opt.value = option.value;
          opt.textContent = option.label;
          input.appendChild(opt);
        });
        input.value = item?.[field.name] || field.options[0].value;
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
      const input = elements.fields.querySelector(`[name="${field.name}"]`);
      if (!input) return;
      if (field.type === 'checkbox') {
        item[field.name] = input.checked;
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
    elements.formTitle.textContent = item ? `${SECTION_LABELS[section]} bearbeiten` : `${SECTION_LABELS[section]} anlegen`;
    buildForm(section, item);
    setFormStatus('');
    elements.dialog.showModal();
  }

  function closeDialog() {
    state.editingId = null;
    setFormStatus('');
    elements.dialog.close();
  }

  async function saveItem() {
    const section = state.activeSection;
    const item = readForm(section);
    setBusy(true);
    setFormStatus('Speichern …');

    try {
      if (state.editingId) {
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
      await loadContent();
      closeDialog();
      setStatus('Änderungen wurden gespeichert.', 'success');
    } catch (error) {
      setFormStatus(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(section, id) {
    if (!window.confirm('Eintrag wirklich löschen?')) return;
    setBusy(true);
    try {
      await api(`/api/admin/members?section=${encodeURIComponent(section)}&id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      await loadContent();
      setStatus('Eintrag wurde gelöscht.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function loadContent() {
    setBusy(true);
    setStatus('Mitgliederinhalte werden geladen …', 'info');
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
      setStatus('Mitgliederinhalte geladen. Einträge können gepflegt werden.', 'success');
    } catch (error) {
      state.apiOnline = false;
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
  elements.dialog.addEventListener('cancel', () => {
    state.editingId = null;
    setFormStatus('');
  });

  switchTab('news');
  loadContent();
})();
