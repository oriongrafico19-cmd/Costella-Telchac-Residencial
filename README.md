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


## Cambio V22
Todos los CTA principales de la landing muestran **AGENDA TU CITA**. El botón de reserva del resultado compatible también usa **AGENDA TU CITA** y conserva el enlace de Calendly configurado.
