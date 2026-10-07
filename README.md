# Costella Telchac Residencial · D1 + Dashboard de leads no calificados

Esta versión usa Cloudflare Workers + Workers Static Assets + D1. No usa Google Apps Script, Google Sheets ni CRM externo.

## Estructura
- `/` — landing pública.
- `/admin` — dashboard de leads no calificados.
- `/api/leads` — guarda únicamente registros con `qualification = alternative`.
- `/api/admin/leads` — consulta únicamente leads no calificados y requiere `x-admin-key`.
- `/api/admin/lead` — actualiza seguimiento y notas de leads no calificados.

## D1
Base: `costella-leads`
Database ID: `94d71374-2590-4764-bec5-9f94f884f088`

Si la tabla aún no existe, ejecuta `schema.sql` una vez en la consola SQL de D1.

## Deploy
En Cloudflare Workers & Pages, usa:
- Build command: vacío
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

El frontend está en `public/`; el Worker y la configuración quedan fuera de los assets públicos.

## Dashboard
Abre `/admin` y escribe la clave de administrador configurada en `wrangler.toml`.

> Para producción, sustituye `ADMIN_KEY` por un Cloudflare Secret (`npx wrangler secret put ADMIN_KEY`) y elimina el valor de `[vars]` del repositorio público.

## Booking
Los leads compatibles se envían a la videollamada de Calendly configurada en `public/config.js`.
