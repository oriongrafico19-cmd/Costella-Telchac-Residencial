/**
 * COSTELLA → GOOGLE SHEETS / CRM
 *
 * PASTE THIS INTO THE GOOGLE APPS SCRIPT PROJECT THAT IS CONNECTED
 * TO THE COSTELLA CRM SPREADSHEET.
 *
 * Expected sheet:
 *   Leads
 *
 * Expected columns, in this exact order:
 * id
 * external_id
 * created_at
 * updated_at
 * name
 * phone
 * email
 * project_id
 * tags_json
 * advisor_id
 * source
 * stage_id
 * meta_form_id
 * meta_form_name
 * meta_campaign_id
 * meta_ad_id
 * answers_json
 * notes
 * revision
 *
 * The landing POSTs plain-text JSON so Apps Script can accept it
 * without requiring a CORS preflight.
 */

const COSTELLA_SHEET_NAME = 'Leads';
const COSTELLA_PROJECT_ID = 'costella-telchac-residencial';
const COSTELLA_DEFAULT_STAGE = 'nuevo';
const COSTELLA_SOURCE = 'costella_landing';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const body = (e && e.postData && e.postData.contents) || '';
    const payload = JSON.parse(body);

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(COSTELLA_SHEET_NAME);

    if (!sheet) {
      throw new Error(`No existe la hoja "${COSTELLA_SHEET_NAME}".`);
    }

    const headers = sheet.getRange(1, 1, 1, 19).getValues()[0];
    const col = {};
    headers.forEach((h, i) => col[String(h).trim()] = i + 1);

    const required = [
      'id', 'external_id', 'created_at', 'updated_at', 'name', 'phone',
      'email', 'project_id', 'tags_json', 'advisor_id', 'source', 'stage_id',
      'meta_form_id', 'meta_form_name', 'meta_campaign_id', 'meta_ad_id',
      'answers_json', 'notes', 'revision'
    ];

    const missing = required.filter(h => !col[h]);
    if (missing.length) {
      throw new Error(`Faltan columnas en Leads: ${missing.join(', ')}`);
    }

    const externalId = String(payload.external_id || '').trim();
    if (!externalId) throw new Error('Falta external_id.');

    // Avoid duplicate writes.
    const lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      const existing = sheet.getRange(2, col.external_id, lastRow - 1, 1)
        .getValues()
        .flat()
        .map(String);
      if (existing.includes(externalId)) {
        return json_({ ok: true, duplicate: true, external_id: externalId });
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const qualification = String(payload.qualification || 'unknown');
    const compatibleCount = Number(payload.compatibleCount || 0);

    const contact = payload.contact || {};
    const name = String(contact.name || payload.name || '').trim();
    const phone = String(contact.whatsapp || payload.phone || '').trim();
    const email = String(contact.email || payload.email || '').trim();

    const tags = [
      'costella',
      'landing',
      qualification === 'compatible' ? 'compatible' : 'alternative'
    ];

    if (payload.priority) tags.push('priority');

    const answersJson = JSON.stringify({
      qualification,
      compatibleCount,
      priority: !!payload.priority,
      answers: payload.answers || {},
      budget: String(payload.budget || ''),
      interest: String(payload.interest || ''),
      contact_source: qualification === 'compatible'
        ? 'Calendly will collect booking contact data'
        : 'Alternative lead form'
    });

    const notes = qualification === 'compatible'
      ? 'Perfil compatible por evaluación de landing. Siguiente paso: Calendly.'
      : 'Perfil no compatible por evaluación de landing. Guardar para alternativa/seguimiento.';

    const row = Array(19).fill('');

    row[col.id - 1] = Utilities.getUuid();
    row[col.external_id - 1] = externalId;
    row[col.created_at - 1] = nowIso;
    row[col.updated_at - 1] = nowIso;
    row[col.name - 1] = name;
    row[col.phone - 1] = phone;
    row[col.email - 1] = email;
    row[col.project_id - 1] = COSTELLA_PROJECT_ID;
    row[col.tags_json - 1] = JSON.stringify(tags);
    row[col.advisor_id - 1] = '';
    row[col.source - 1] = String(payload.source || COSTELLA_SOURCE);
    row[col.stage_id - 1] = COSTELLA_DEFAULT_STAGE;
    row[col.meta_form_id - 1] = '';
    row[col.meta_form_name - 1] = '';
    row[col.meta_campaign_id - 1] = '';
    row[col.meta_ad_id - 1] = '';
    row[col.answers_json - 1] = answersJson;
    row[col.notes - 1] = notes;
    row[col.revision - 1] = 1;

    sheet.getRange(sheet.getLastRow() + 1, 1, 1, 19).setValues([row]);

    return json_({
      ok: true,
      external_id: externalId,
      qualification
    });

  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};

  // Health check: /exec
  if (params.action !== 'leads') {
    return json_({
      ok: true,
      service: 'costella-leads',
      sheet: COSTELLA_SHEET_NAME
    });
  }

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(COSTELLA_SHEET_NAME);
    if (!sheet) throw new Error(`No existe la hoja "${COSTELLA_SHEET_NAME}".`);

    const values = sheet.getDataRange().getValues();
    if (!values.length) return json_({ ok: true, leads: [] });

    const headers = values[0].map(h => String(h).trim());
    const requestedQualification = String(params.qualification || 'alternative').toLowerCase();
    const leads = [];

    for (let r = 1; r < values.length; r++) {
      const row = values[r];
      if (!row.some(v => String(v).trim() !== '')) continue;

      const obj = {};
      headers.forEach((h, i) => {
        let value = row[i];
        if (value instanceof Date) value = value.toISOString();
        obj[h] = value;
      });

      let answers = {};
      try { answers = JSON.parse(obj.answers_json || '{}'); } catch (_) {}
      const qualification = String(answers.qualification || '').toLowerCase();

      // The admin dashboard intentionally exposes ONLY non-qualified leads.
      if (requestedQualification === 'alternative' && qualification !== 'alternative') continue;

      obj.answers_json = obj.answers_json || '{}';
      leads.push(obj);
    }

    leads.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    return json_({ ok: true, qualification: 'alternative', count: leads.length, leads: leads });
  } catch (err) {
    return json_({
      ok: false,
      error: String(err && err.message ? err.message : err)
    });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
