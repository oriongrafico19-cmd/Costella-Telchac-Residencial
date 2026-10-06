# Costella → CRM / Google Sheets

La landing usa el formulario de calificación y envía un JSON al `leadEndpoint`.

## Hoja destino

El archivo de CRM que compartiste tiene una hoja `Leads` con estas columnas exactas:

`id | external_id | created_at | updated_at | name | phone | email | project_id | tags_json | advisor_id | source | stage_id | meta_form_id | meta_form_name | meta_campaign_id | meta_ad_id | answers_json | notes | revision`

La V21 conserva este orden.

## Cómo queda cada lead

### Compatible
- `qualification`: `compatible`
- `tags_json`: `["costella","landing","compatible"]` (+ `priority` si aplica)
- `stage_id`: `nuevo`
- `project_id`: `costella-telchac-residencial`
- `source`: `costella_landing`
- `answers_json`: contiene las 5 respuestas + puntuación + clasificación
- `notes`: indica que el siguiente paso es Calendly
- `name/phone/email`: quedan vacíos en este primer envío porque Calendly recoge los datos de contacto.

### Alternativa
- `qualification`: `alternative`
- `tags_json`: `["costella","landing","alternative"]`
- `stage_id`: `nuevo`
- `name`, `phone`, `email`: vienen del segundo formulario
- `budget` e `interest`: quedan dentro de `answers_json`
- `notes`: indica que es un lead para alternativa/seguimiento

## Importante

Para que los leads lleguen al Sheet, hay que desplegar el Apps Script como Web App y pegar su URL en:

`config.js`

```js
leadEndpoint: 'https://script.google.com/macros/s/TU_WEB_APP_ID/exec'
```

El Google Sheet no se pega en la landing; la landing necesita el endpoint del Apps Script.

## Siguiente mejora opcional

Si después quieres que el CRM conozca automáticamente que una persona compatible **sí llegó a reservar en Calendly**, habría que conectar un webhook/automatización de Calendly para actualizar `stage_id` a `cita` y completar los datos de contacto del lead.
