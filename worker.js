export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/leads' && request.method === 'POST') return createLead(request, env);
    if (url.pathname === '/api/leads' && request.method === 'GET') return listLeads(request, env);
    if (url.pathname === '/api/leads' && request.method === 'PATCH') return updateLead(request, env);
    if (url.pathname === '/api/health') return json({ ok: true, service: 'costella-leads' });
    return env.ASSETS.fetch(request);
  }
};

const corsHeaders = { 'Access-Control-Allow-Origin':'*', 'Access-Control-Allow-Headers':'Content-Type, X-Admin-Password', 'Access-Control-Allow-Methods':'GET,POST,PATCH,OPTIONS' };
function json(data, status=200){ return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8', ...corsHeaders}}); }
function clean(v){ return String(v ?? '').trim(); }
function authorized(request, env){
  const expected = env.ADMIN_PASSWORD;
  return !!expected && clean(request.headers.get('X-Admin-Password')) === expected;
}
async function createLead(request, env){
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const externalId = clean(body.external_id) || crypto.randomUUID();
    const qualification = clean(body.qualification);
    if (!qualification) return json({ok:false,error:'qualification is required'},400);
    const contact = body.contact || {};
    const answers = body.answers || {};
    const compatibleCount = Number(body.compatibleCount || 0);
    const priority = body.priority ? 1 : 0;
    const existing = await env.DB.prepare('SELECT id FROM leads WHERE external_id=?').bind(externalId).first();
    if (existing) return json({ok:true,id:existing.id,duplicate:true});
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO leads (id,external_id,created_at,updated_at,name,phone,email,project_id,source,qualification,compatible_count,priority,budget,interest,answers_json,notes,stage_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
      .bind(id,externalId,now,now,clean(contact.name),clean(contact.whatsapp),clean(contact.email),clean(body.project_id)||'costella-telchac-residencial',clean(body.source)||'costella_landing',qualification,compatibleCount,priority,clean(body.budget),clean(body.interest),JSON.stringify(answers),'','nuevo').run();
    return json({ok:true,id});
  } catch(e){ return json({ok:false,error:e.message||'Could not save lead'},500); }
}
async function listLeads(request, env){
  if (!authorized(request,env)) return json({ok:false,error:'No autorizado'},401);
  const url = new URL(request.url);
  const q = clean(url.searchParams.get('q')).toLowerCase();
  const stage = clean(url.searchParams.get('stage'));
  const interest = clean(url.searchParams.get('interest')).toLowerCase();
  let sql = `SELECT * FROM leads WHERE qualification='alternative'`;
  const params = [];
  if(q){ sql += ` AND (LOWER(COALESCE(name,'')) LIKE ? OR LOWER(COALESCE(phone,'')) LIKE ? OR LOWER(COALESCE(email,'')) LIKE ?)`; const x=`%${q}%`; params.push(x,x,x); }
  if(stage){ sql += ` AND stage_id=?`; params.push(stage); }
  if(interest){ sql += ` AND LOWER(COALESCE(interest,''))=?`; params.push(interest); }
  sql += ` ORDER BY datetime(created_at) DESC LIMIT 500`;
  const result = await env.DB.prepare(sql).bind(...params).all();
  return json({ok:true,leads:result.results||[]});
}
async function updateLead(request, env){
  if (!authorized(request,env)) return json({ok:false,error:'No autorizado'},401);
  try{
    const body=await request.json(); const id=clean(body.id); if(!id)return json({ok:false,error:'id is required'},400);
    const stage=clean(body.stage_id)||'nuevo'; const notes=clean(body.notes); const now=new Date().toISOString();
    await env.DB.prepare('UPDATE leads SET stage_id=?, notes=?, updated_at=? WHERE id=? AND qualification=\'alternative\'').bind(stage,notes,now,id).run();
    return json({ok:true});
  }catch(e){return json({ok:false,error:e.message||'Could not update lead'},500)}
}
