const config = window.NEARME_WEB_CONFIG || {};
const apiBaseUrl = (config.apiBaseUrl || '').replace(/\/+$/, '');

const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

const status = document.getElementById('status');
const button = document.getElementById('verify-button');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = `status${isError ? ' error' : ''}`;
}

async function verifyEmail() {
  if (!token) {
    setStatus('O link de confirmação está incompleto.', true);
    button.disabled = true;
    return;
  }

  if (!apiBaseUrl) {
    setStatus('Configure site/config.js com a URL da API antes de publicar esta página.', true);
    button.disabled = true;
    return;
  }

  button.disabled = true;
  setStatus('Validando seu e-mail...');

  try {
    const response = await fetch(`${apiBaseUrl}/auth/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Não foi possível confirmar o e-mail.',
      );
    }

    setStatus(payload.message || 'E-mail confirmado com sucesso.');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Não foi possível confirmar o e-mail.', true);
    button.disabled = false;
  }
}

button.addEventListener('click', () => {
  void verifyEmail();
});

void verifyEmail();
