(function () {
  'use strict';

  const FORM_ENDPOINT = '/api/forms';

  function setStatus(notice, state, message) {
    notice.hidden = false;
    notice.dataset.state = state;
    notice.textContent = message;
  }

  function payloadFor(form) {
    const data = new FormData(form);
    const common = {
      type: form.dataset.publicForm,
      email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''),
      message: String(data.get('message') || ''),
      privacy: data.get('privacy') === 'on',
      website: String(data.get('website') || ''),
    };

    if (common.type === 'contact') {
      return {
        ...common,
        name: String(data.get('name') || ''),
        subject: String(data.get('subject') || ''),
      };
    }

    return {
      ...common,
      firstName: String(data.get('firstName') || ''),
      lastName: String(data.get('lastName') || ''),
    };
  }

  async function readResponse(response) {
    try {
      const result = await response.json();
      if (result && typeof result.message === 'string') {
        return result.message;
      }
    } catch {
      // Die allgemeine Meldung unten vermeidet technische Details.
    }
    return response.ok
      ? 'Vielen Dank. Deine Anfrage wurde übermittelt.'
      : 'Die Anfrage konnte gerade nicht gesendet werden. Bitte versuche es später erneut.';
  }

  function initForm(form) {
    const notice = form.querySelector('.form-notice');
    const submitButton = form.querySelector('button[type="submit"]');
    if (!notice || !submitButton) return;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        setStatus(notice, 'error', 'Bitte fülle alle Pflichtfelder korrekt aus.');
        return;
      }

      submitButton.disabled = true;
      submitButton.setAttribute('aria-busy', 'true');
      setStatus(notice, 'pending', 'Deine Anfrage wird gesendet …');

      try {
        const response = await fetch(FORM_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payloadFor(form)),
        });
        const message = await readResponse(response);

        if (!response.ok) {
          setStatus(notice, 'error', message);
          return;
        }

        form.reset();
        setStatus(notice, 'success', message);
      } catch {
        setStatus(
          notice,
          'error',
          'Die Verbindung ist fehlgeschlagen. Bitte prüfe deine Internetverbindung und versuche es erneut.'
        );
      } finally {
        submitButton.disabled = false;
        submitButton.removeAttribute('aria-busy');
      }
    });
  }

  document.querySelectorAll('form[data-public-form]').forEach(initForm);
})();
