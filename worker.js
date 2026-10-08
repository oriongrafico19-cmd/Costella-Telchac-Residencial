const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
function corsHeaders(){return {'access-control-allow-origin':'*','access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,x-admin-key'};}
function withCors(response){const h=new Headers(response.headers);for(const [k,v] of Object.entries(corsHeaders()))h.set(k,v);return new Response(response.body,{status:response.status,headers:h});}
function now(){return new Date().toISOString();}

async function ensureAnalyticsTable(env){
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS analytics_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    cta_id TEXT,
    cta_label TEXT,
    section_id TEXT,
    section_label TEXT,
    step INTEGER,
    qualification TEXT,
    compatible_count INTEGER,
    data_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL
  )`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics_events(created_at)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type)`).run();
  await env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_analytics_session_id ON analytics_events(session_id)`).run();
}

async function saveAnalytics(env, body){
  const allowed=new Set(['cta_click','form_start','question_answer','result_view','booking_click','alternative_submit','modal_close','form_abandon','result_exit']);
  if(!body || !allowed.has(body.event_type)) return {ok:false,ignored:true};
  const sessionId=String(body.session_id||'').slice(0,120);
  if(!sessionId) return {ok:false,error:'session_id requerido'};
  await ensureAnalyticsTable(env);
  const safeJson=JSON.stringify(body.data||{}).slice(0,12000);
  await env.DB.prepare(`INSERT INTO analytics_events (session_id,event_type,cta_id,cta_label,section_id,section_label,step,qualification,compatible_count,data_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(
    sessionId,String(body.event_type).slice(0,40),String(body.cta_id||'').slice(0,100),String(body.cta_label||'').slice(0,160),String(body.section_id||'').slice(0,100),String(body.section_label||'').slice(0,160),body.step==null?null:Number(body.step),String(body.qualification||'').slice(0,40),body.compatible_count==null?null:Number(body.compatible_count),safeJson,now()
  ).run();
  return {ok:true};
}

async function analyticsReport(env){
  await ensureAnalyticsTable(env);
  const since=new Date(Date.now()-90*86400000).toISOString();
  const {results=[]}=await env.DB.prepare(`SELECT * FROM analytics_events WHERE created_at>=? ORDER BY datetime(created_at) ASC LIMIT 50000`).bind(since).all();
  const uniq=a=>new Set(a.map(x=>x.session_id).filter(Boolean)).size;
  const count=t=>results.filter(x=>x.event_type===t).length;
  const sessions=uniq(results);
  const ctaMap=new Map();
  for(const e of results.filter(x=>x.event_type==='cta_click')){
    const k=e.cta_id||'unknown';
    if(!ctaMap.has(k)) ctaMap.set(k,{cta_id:k,label:e.cta_label||k,section:e.section_label||e.section_id||'—',clicks:0,sessions:new Set(),formStarts:new Set(),qualified:new Set(),bookings:new Set()});
    const x=ctaMap.get(k);x.clicks++;x.sessions.add(e.session_id);
  }
  const startsBySession=new Map();
  for(const e of results.filter(x=>x.event_type==='form_start')){
    const key=e.session_id+'|'+(e.cta_id||'');
    startsBySession.set(key,e);
    const x=ctaMap.get(e.cta_id||''); if(x)x.formStarts.add(e.session_id);
  }
  const resultEvents=results.filter(x=>x.event_type==='result_view');
  const bookingEvents=results.filter(x=>x.event_type==='booking_click');
  for(const e of resultEvents.filter(x=>x.qualification==='compatible')){const x=ctaMap.get(e.cta_id||'');if(x)x.qualified.add(e.session_id);}
  for(const e of bookingEvents){const x=ctaMap.get(e.cta_id||'');if(x)x.bookings.add(e.session_id);}
  const parse=e=>{try{return JSON.parse(e.data_json||'{}')}catch{return {}}};
  const q={q1:{},q2:{},q3:{},q4:{},q5:{}};
  for(const e of bookingEvents){const d=parse(e),a=d.answers||{};for(const k of Object.keys(q)){if(a[k])q[k][a[k]]=(q[k][a[k]]||0)+1;}}
  const abandonEvents=results.filter(x=>x.event_type==='form_abandon'||x.event_type==='modal_close');
  const resultExits=results.filter(x=>x.event_type==='result_exit');
  const abandonByStep={q1:0,q2:0,q3:0,q4:0,q5:0};
  const abandonByCta=new Map();
  for(const e of abandonEvents){
    const step=Number(e.step||0); if(step>=1&&step<=5) abandonByStep['q'+step]++;
    const k=e.cta_id||'unknown';
    if(!abandonByCta.has(k)) abandonByCta.set(k,{cta_id:k,label:e.cta_label||k,section:e.section_label||e.section_id||'—',abandons:0});
    abandonByCta.get(k).abandons++;
  }
  const cta=[...ctaMap.values()].map(x=>({cta_id:x.cta_id,label:x.label,section:x.section,clicks:x.clicks,sessions:x.sessions.size,form_starts:x.formStarts.size,qualified:x.qualified.size,bookings:x.bookings.size,booking_rate:x.sessions.size?Math.round(x.bookings.size/x.sessions.size*1000)/10:0})).sort((a,b)=>b.bookings-a.bookings||b.clicks-a.clicks);
  const abandonment=[...abandonByCta.values()].sort((a,b)=>b.abandons-a.abandons);
  return {ok:true,period_days:90,summary:{sessions,cta_clicks:count('cta_click'),form_starts:count('form_start'),results:resultEvents.length,qualified:resultEvents.filter(x=>x.qualification==='compatible').length,alternative:resultEvents.filter(x=>x.qualification==='alternative').length,booking_clicks:bookingEvents.length,alternative_submits:count('alternative_submit'),abandonments:abandonEvents.length,result_exits:resultExits.length},cta,booking_answers:q,abandonment_by_step:abandonByStep,abandonment_by_cta:abandonment};
}

async function api(request,env){
  if(request.method==='OPTIONS')return withCors(new Response(null,{status:204}));
  const url=new URL(request.url);
  if(url.pathname==='/api/analytics'&&request.method==='POST'){
    let body;try{body=await request.json()}catch{return withCors(json({ok:false,error:'JSON inválido'},400));}
    try{return withCors(json(await saveAnalytics(env,body)));}catch(e){return withCors(json({ok:false,error:'No se pudo guardar analítica'},500));}
  }
  if(url.pathname==='/api/leads'&&request.method==='POST'){
    let body;try{body=await request.json()}catch{return withCors(json({ok:false,error:'JSON inválido'},400));}
    if(!body||body.qualification!=='alternative')return withCors(json({ok:true,stored:false}));
    const contact=body.contact||{};const ts=body.timestamp||now();
    try{
      const externalId=body.external_id||crypto.randomUUID();
      await env.DB.prepare(`INSERT INTO leads (external_id,created_at,updated_at,project_id,source,qualification,compatible_count,priority,name,phone,email,budget,interest,answers_json,notes,stage_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'','nuevo') ON CONFLICT(external_id) DO UPDATE SET updated_at=excluded.updated_at,name=excluded.name,phone=excluded.phone,email=excluded.email,budget=excluded.budget,interest=excluded.interest,answers_json=excluded.answers_json`).bind(
        externalId,ts,ts,body.project_id||'costella-telchac-residencial',body.source||'costella_landing','alternative',Number(body.compatibleCount||0),body.priority?1:0,contact.name||'',contact.whatsapp||'',contact.email||'',body.budget||'',body.interest||'',JSON.stringify(body.answers||{})
      ).run();
      return withCors(json({ok:true,stored:true}));
    }catch(e){return withCors(json({ok:false,error:'No se pudo guardar el lead'},500));}
  }
  if(url.pathname==='/api/admin/leads'&&request.method==='GET'){
    if((request.headers.get('x-admin-key')||url.searchParams.get('key'))!==env.ADMIN_KEY)return withCors(json({ok:false,error:'No autorizado'},401));
    try{const {results=[]}=await env.DB.prepare(`SELECT * FROM leads WHERE qualification='alternative' ORDER BY datetime(created_at) DESC`).all();return withCors(json({ok:true,leads:results}));}catch{return withCors(json({ok:false,error:'No se pudo consultar la base'},500));}
  }
  if(url.pathname==='/api/admin/analytics'&&request.method==='GET'){
    if((request.headers.get('x-admin-key')||'')!==env.ADMIN_KEY)return withCors(json({ok:false,error:'No autorizado'},401));
    try{return withCors(json(await analyticsReport(env)));}catch(e){return withCors(json({ok:false,error:'No se pudo consultar la analítica'},500));}
  }
  if(url.pathname==='/api/admin/lead'&&request.method==='PATCH'){
    if((request.headers.get('x-admin-key')||'')!==env.ADMIN_KEY)return withCors(json({ok:false,error:'No autorizado'},401));
    let body;try{body=await request.json()}catch{return withCors(json({ok:false,error:'JSON inválido'},400));}
    const id=Number(body.id);if(!id)return withCors(json({ok:false,error:'ID requerido'},400));
    await env.DB.prepare(`UPDATE leads SET updated_at=?,stage_id=?,notes=? WHERE id=? AND qualification='alternative'`).bind(now(),body.stage_id||'nuevo',body.notes||'',id).run();
    return withCors(json({ok:true}));
  }
  return withCors(json({ok:false,error:'Not found'},404));
}

export default {async fetch(request,env,ctx){const url=new URL(request.url);if(url.pathname.startsWith('/api/'))return api(request,env);return env.ASSETS.fetch(request);}};
