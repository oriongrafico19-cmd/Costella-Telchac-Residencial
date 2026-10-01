# Costella Telchac V17 · Long-form conversion

Landing estática inspirada en el ritmo de una long-form de conversión y adaptada a la identidad Costella.

## Estructura

/assets/brand/  identidad
/assets/master/  Top Master + Master Plan
/assets/day/  renders diurnos
/assets/night/  renders nocturnos
/css/style.css
/js/config.js
/js/main.js
/index.html
/admin.html

## Funnel

Todos los CTAs principales abren una evaluación modal de 5 preguntas.
El resultado es comercial inicial:
- 2 o más respuestas compatibles → booking/webinar.
- 0 o 1 respuesta compatible → formulario de alternativa.

Con 4 respuestas por pregunta, la regla produce 75% de combinaciones compatibles y 25% alternativas dentro del universo matemático de combinaciones.

## Datos de Costella integrados

19 ha, 533 lotes, 200–350 m², 5 etapas; apartado $5,000; enganche mínimo 12%; financiamiento 12–180 meses; mensualidades desde $3,300.

Amenidades: Capella Core (Etapa 2), Tau Core (Etapa 3), Club Stella (Etapa 4), Ara Wellness Center (Etapa 5).

## Video
https://youtu.be/GN3wHvDtAbM

## Cloudflare

Root directory: /
Build command: vacío
Deploy command: npx wrangler deploy

El proyecto usa Workers Static Assets.

## Admin

/admin.html permite preparar booking, webinar, lead endpoint y Pixel. Descarga `config.js` y reemplaza `/js/config.js` para publicar cambios.
