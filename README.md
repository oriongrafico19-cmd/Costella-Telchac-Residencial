# Costella Telchac Residencial · D1 + Dashboard de leads no calificados

Esta versión NO usa Google Apps Script, Google Sheets ni CRM externo.

Arquitectura: landing → Cloudflare Worker → Cloudflare D1 → /admin.

## Configuración
1. En Cloudflare D1 crea/usa la base `costella-leads`.
2. El `wrangler.toml` ya contiene el database_id proporcionado para esta base.
3. Ejecuta una vez: `npx wrangler d1 execute costella-leads --remote --file=schema.sql`
4. Despliega: `npx wrangler deploy`.
5. El panel está en `/admin`.

La landing guarda únicamente los perfiles no calificados. Los perfiles compatibles van a Calendly y no se guardan en este dashboard.

## Acceso al dashboard
La versión incluye una clave de administrador de aplicación (`COSTELLA-ADMIN-2026`) para el MVP. Cámbiala en `wrangler.toml` antes de publicar. Para seguridad empresarial se recomienda proteger `/admin` posteriormente con Cloudflare Access.
