(function () {
  'use strict';

  const SECTION_LABELS = {
    news: 'Aktuelle Informationen',
    documents: 'Dokumente',
    events: 'Interne Termine',
    helpers: 'Helfer & Organisation',
  };

  const EMPTY_LABELS = {
    news: 'Noch keine Informationen vorhanden.',
    documents: 'Noch keine Dokumente vorhanden.',
    events: 'Noch keine internen Termine vorhanden.',
    helpers: 'Noch keine Helfer-Einsätze vorhanden.',
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
      { name: 'filename', label: 'Dateiname (z. B. satzung.pdf)', type: 'text', required: true },
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
      { name: 'visible', label: 'Sichtbar', type: 'checkbox', defaultChecked: true },
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

  function getItemTitle(section, item) {
    if (section === 'helpers') return item.task;
    return item.title;
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

  function renderMeta(section, item) {
    if (section === 'news') {
      return `${item.category || 'Info'} · Anzeige-Priorität ${item.priority ?? 0} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    if (section === 'documents') {
      return `${item.category || 'Dokument'} · ${item.filename || '–'} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    if (section === 'events') {
      return `${formatDate(item.eventDate)}${item.eventTime ? ` · ${item.eventTime} Uhr` : ''}${item.location ? ` · ${item.location}` : ''} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
    }
    return `${item.eventName} · ${item.status === 'offen' ? 'Offen' : 'Besetzt'} · ${item.visible ? 'Sichtbar' : 'Ausgeblendet'}`;
  }

  function renderDescription(section, item) {
    if (section === 'helpers') {
      return item.contactPerson ? `Ansprechpartner: ${item.contactPerson}` : 'Kein Ansprechpartner hinterlegt.';
    }
    return item.description || '';
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
        eventDate: item.eventDate,
        eventTime: item.eventTime || '',
        location: item.location || '',
        description: item.description || '',
        visible: Boolean(item.visible),
      };
    }
    return {
      eventName: item.eventName,
      task: item.task,
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
        if (item.visible === false) {
          card.classList.add('admin-members-card--hidden');
        }

        const header = document.createElement('div');
        header.className = 'admin-members-card__header';

        const copy = document.createElement('div');
        const title = document.createElement('h3');
        title.className = 'admin-members-card__title';
        title.textContent = getItemTitle(section, item);

        const meta = document.createElement('p');
        meta.className = 'admin-members-card__meta';
        meta.textContent = renderMeta(section, item);

        copy.append(title, meta);
        header.appendChild(copy);

        if (item.visible === false) {
          const badge = document.createElement('span');
          badge.className = 'admin-members-badge admin-members-badge--hidden';
          badge.textContent = 'Ausgeblendet';
          header.appendChild(badge);
        }

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

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'btn btn--outline';
        toggleButton.textContent = item.visible ? 'Ausblenden' : 'Sichtbar machen';
        toggleButton.addEventListener('click', () => toggleVisibility(section, item.id));

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'btn btn--outline admin-members-card__delete';
        deleteButton.textContent = 'Löschen';
        deleteButton.addEventListener('click', () => deleteItem(section, item.id));

        actions.append(editButton, toggleButton, deleteButton);
        card.append(header, text, actions);
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
        'Dateien werden aktuell noch über Git/Cursor in /downloads/ gepflegt. Upload folgt später. Der Dateiname verknüpft z. B. satzung.pdf mit /downloads/satzung.pdf.';
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
    elements.formTitle.textContent = item
      ? `${SECTION_LABELS[section]} bearbeiten`
      : `${SECTION_LABELS[section]} anlegen`;
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
    const form = elements.form;

    if (!form.reportValidity()) {
      return;
    }

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

  async function toggleVisibility(section, id) {
    const item = state.content[section].find((entry) => entry.id === id);
    if (!item) return;

    const nextItem = { ...item, visible: !item.visible };
    setBusy(true);
    setStatus(nextItem.visible ? 'Eintrag wird sichtbar gemacht …' : 'Eintrag wird ausgeblendet …', 'info');

    try {
      await api('/api/admin/members', {
        method: 'PATCH',
        body: JSON.stringify({
          section,
          id,
          item: itemToApiPayload(section, nextItem),
        }),
      });
      await loadContent();
      setStatus(nextItem.visible ? 'Eintrag ist jetzt sichtbar.' : 'Eintrag wurde ausgeblendet.', 'success');
    } catch (error) {
      setStatus(error.message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function deleteItem(section, id) {
    if (!window.confirm('Eintrag wirklich löschen?')) return;
    setBusy(true);
    setStatus('Eintrag wird gelöscht …', 'info');
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
      switchTab(state.activeSection);
      setStatus('Mitgliederinhalte geladen. Einträge können gepflegt werden.', 'success');
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
  elements.form.addEventListener('submit', (event) => {
    event.preventDefault();
    saveItem();
  });
  elements.dialog.addEventListener('cancel', () => {
    state.editingId = null;
    setFormStatus('');
  });

  switchTab('news');
  loadContent();
})();
