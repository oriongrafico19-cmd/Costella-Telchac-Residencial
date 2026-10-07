const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

function corsHeaders() { return { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type,x-admin-key' }; }
function withCors(response) { const h = new Headers(response.headers); for (const [k,v] of Object.entries(corsHeaders())) h.set(k,v); return new Response(response.body,{status:response.status,headers:h}); }
function now(){ return new Date().toISOString(); }

async function api(request, env) {
  if (request.method === 'OPTIONS') return withCors(new Response(null,{status:204}));
  const url = new URL(request.url);
  if (url.pathname === '/api/leads' && request.method === 'POST') {
    let body;
    try { body = await request.json(); } catch { return withCors(json({ok:false,error:'JSON inválido'},400)); }
    if (!body || body.qualification !== 'alternative') return withCors(json({ok:true,stored:false}));
    const contact = body.contact || {};
    const ts = body.timestamp || now();
    try {
      await env.DB.prepare(`INSERT INTO leads (external_id,created_at,updated_at,project_id,source,qualification,compatible_count,priority,name,phone,email,budget,interest,answers_json,notes,stage_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'','nuevo') ON CONFLICT(external_id) DO UPDATE SET updated_at=excluded.updated_at,name=excluded.name,phone=excluded.phone,email=excluded.email,budget=excluded.budget,interest=excluded.interest,answers_json=excluded.answers_json`).bind(
        body.external_id || crypto.randomUUID(), ts, ts, body.project_id || 'costella-telchac-residencial', body.source || 'costella_landing', 'alternative', Number(body.compatibleCount||0), body.priority ? 1:0,
        contact.name || '', contact.whatsapp || '', contact.email || '', body.budget || '', body.interest || '', JSON.stringify(body.answers || {})
      ).run();
      return withCors(json({ok:true,stored:true}));
    } catch(e) { return withCors(json({ok:false,error:'No se pudo guardar el lead'},500)); }
  }
  if (url.pathname === '/api/admin/leads' && request.method === 'GET') {
    if ((request.headers.get('x-admin-key') || url.searchParams.get('key')) !== env.ADMIN_KEY) return withCors(json({ok:false,error:'No autorizado'},401));
    try {
      const {results=[]} = await env.DB.prepare(`SELECT * FROM leads WHERE qualification='alternative' ORDER BY datetime(created_at) DESC`).all();
      return withCors(json({ok:true,leads:results}));
    } catch(e) { return withCors(json({ok:false,error:'No se pudo consultar la base'},500)); }
  }
  if (url.pathname === '/api/admin/lead' && request.method === 'PATCH') {
    if ((request.headers.get('x-admin-key') || '') !== env.ADMIN_KEY) return withCors(json({ok:false,error:'No autorizado'},401));
    let body; try { body=await request.json(); } catch { return withCors(json({ok:false,error:'JSON inválido'},400)); }
    const id=Number(body.id); if(!id) return withCors(json({ok:false,error:'ID requerido'},400));
    await env.DB.prepare(`UPDATE leads SET updated_at=?, stage_id=?, notes=? WHERE id=? AND qualification='alternative'`).bind(now(),body.stage_id||'nuevo',body.notes||'',id).run();
    return withCors(json({ok:true}));
  }
  return withCors(json({ok:false,error:'Not found'},404));
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) return api(request, env);
    return env.ASSETS.fetch(request);
  }
};
