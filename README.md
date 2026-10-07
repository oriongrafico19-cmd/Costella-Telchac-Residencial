# Costella Telchac Residencial · V25 · Base propia

Esta versión NO utiliza Google Apps Script, Google Sheets ni el CRM de terceros.

## Arquitectura
- Landing pública: `index.html`
- Dashboard privado: `admin.html`
- Backend: Cloudflare Worker (`worker.js`)
- Base de datos: Cloudflare D1 (`schema.sql`)
- Leads compatibles: se envían a Calendly.
- Leads no calificados: se guardan directamente en D1 y aparecen en `/admin`.

## Configuración inicial
1. Instala Wrangler y autentícate en Cloudflare.
2. Ejecuta:
   `npx wrangler d1 create costella-leads`
3. Copia el `database_id` que entrega Cloudflare a `wrangler.toml`.
4. Crea las tablas:
   `npx wrangler d1 execute costella-leads --remote --file=./schema.sql`
5. Define la contraseña del dashboard como secreto:
   `npx wrangler secret put ADMIN_PASSWORD`
6. Publica:
   `npx wrangler deploy`

## Dashboard
Abre `/admin`. El panel pide la contraseña del administrador y solo consulta registros con `qualification='alternative'`.

## Importante
La contraseña NO está dentro de `admin.html` ni `config.js`. El navegador la envía por HTTPS en el header `X-Admin-Password` y el Worker la compara con el secreto de Cloudflare.

La landing principal no depende del dashboard para funcionar. El único endpoint propio que usa es `/api/leads`.
