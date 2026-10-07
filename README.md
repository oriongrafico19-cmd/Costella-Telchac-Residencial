# Costella Telchac Residencial · V20 Booking + Leads

- Compatible: 5 preguntas → único botón de Calendly.
- Alternativo: 5 preguntas → solo formulario de datos; NO booking ni webinar.

`config.js` incluye `leadEndpoint`, pensado para una URL de Web App de Google Apps Script.

Payload enviado cuando hay endpoint: timestamp, source, qualification, compatibleCount, priority, answers y, para perfiles alternativos, contact/budget/interest.

```js
window.COSTELLA_CONFIG = {
  bookingUrl: 'https://calendly.com/somosamco/30min',
  leadEndpoint: '',
  metaPixelId: ''
};
```


## CRM / Google Sheets

See `google-apps-script/LEAD_MAPPING.md` and `google-apps-script/Costella_Leads_AppsScript.gs`.


## V24 — Agendar videollamada + leads no compatibles

- Todos los CTA principales de la landing usan **Agendar videollamada**.
- Los perfiles compatibles muestran únicamente el botón **Agendar videollamada** y llevan a Calendly.
- Los perfiles no compatibles no muestran ni conservan el botón de Calendly; únicamente muestran el formulario alternativo.
- Los leads no compatibles se envían al `leadEndpoint` configurado en `config.js`.
- Se incluye `google-apps-script/Costella_Leads_AppsScript.gs` y `google-apps-script/LEAD_MAPPING.md` para conectarlo a una base de Google Sheets/CRM.

### Para activar la base
1. Publica el Apps Script como Web App.
2. Copia la URL `/exec` en `config.js` → `leadEndpoint`.
3. No cambies la estructura del payload sin revisar el mapeo incluido.
