# NearMe Static Pages

Páginas estáticas para:

- confirmação de e-mail
- redefinição de senha
- termos de uso
- política de privacidade
- exclusão de conta

## Configuração

1. Edite [`config.js`](./config.js)
2. Ajuste `apiBaseUrl` para a URL pública do backend, incluindo `/api`
3. Ajuste `supportEmail`

Exemplo:

```js
window.NEARME_WEB_CONFIG = {
  apiBaseUrl: 'https://api.seudominio.com/api',
  supportEmail: 'suporte@seudominio.com',
  appName: 'NearMe',
};
```

## Publicação no GitHub Pages

1. Publique o conteúdo desta pasta em um repositório estático
2. Ative GitHub Pages
3. Use a URL publicada como `APP_WEB_URL` no backend

Exemplo:

```env
APP_WEB_URL=https://seudominio.com
```
