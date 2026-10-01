# Costella Telchac Residencial

Esta versión está deliberadamente aplanada para evitar problemas al subir archivos desde el navegador de GitHub.

Todos los archivos públicos están en la raíz:

- index.html
- admin.html
- style.css
- main.js
- config.js
- imágenes WebP/PNG

## Cloudflare

- Root directory: /
- Build command: vacío
- Deploy command: npx wrangler deploy
- Preview command: vacío o npx wrangler preview

No requiere Worker script ni API secrets.

## Configuración

Edita `config.js` para booking, webinar, leads y Meta Pixel.

Importante: esta versión sacrifica carpetas internas de assets para maximizar compatibilidad con la carga web de GitHub. La experiencia visual y las animaciones siguen siendo HTML/CSS/JS.
