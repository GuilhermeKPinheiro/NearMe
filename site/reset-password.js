const config = window.NEARME_WEB_CONFIG || {};
const apiBaseUrl = (config.apiBaseUrl || '').replace(/\/+$/, '');
const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

const form = document.getElementById('reset-form');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirm-password');
const status = document.getElementById('status');
const submitButton = document.getElementById('submit-button');

function setStatus(message, isError = false) {
  status.textContent = message;
  status.className = `status${isError ? ' error' : ''}`;
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!token) {
    setStatus('O link de redefinição está incompleto.', true);
    return;
  }

  if (!apiBaseUrl) {
    setStatus('Configure site/config.js com a URL da API antes de publicar esta página.', true);
    return;
  }

  if (passwordInput.value.length < 6) {
    setStatus('A nova senha precisa ter pelo menos 6 caracteres.', true);
    return;
  }

  if (passwordInput.value !== confirmInput.value) {
    setStatus('As senhas informadas precisam ser iguais.', true);
    return;
  }

  submitButton.disabled = true;
  setStatus('Atualizando sua senha...');

  try {
    const response = await fetch(`${apiBaseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        password: passwordInput.value,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(
        Array.isArray(payload.message) ? payload.message.join(', ') : payload.message || 'Não foi possível redefinir a senha.',
      );
    }

    setStatus(payload.message || 'Senha redefinida com sucesso.');
    form.reset();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : 'Não foi possível redefinir a senha.', true);
    submitButton.disabled = false;
    return;
  }

  submitButton.disabled = false;
});
