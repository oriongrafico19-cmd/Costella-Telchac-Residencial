(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.COSTELLA_CONFIG || {};

  // Anonymous conversion analytics (no personal data is sent here).
  function getSessionId(){
    try { let id=localStorage.getItem('costella_analytics_session'); if(!id){id=(crypto.randomUUID?crypto.randomUUID():Date.now()+'-'+Math.random().toString(36).slice(2));localStorage.setItem('costella_analytics_session',id);} return id; } catch { return 'session-'+Date.now()+'-'+Math.random().toString(36).slice(2); }
  }
  const analyticsSessionId = getSessionId();
  let currentCta = {id:'unknown',label:'Desconocido',section:'—'};
  function track(eventType, data={}){
    const payload={event_type:eventType,session_id:analyticsSessionId,cta_id:currentCta.id,cta_label:currentCta.label,section_label:currentCta.section,step:data.step??null,qualification:data.qualification||'',compatible_count:data.compatibleCount??null,data};
    try { fetch('/api/analytics',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{}); } catch {}
  }
  function setCtaContext(button,index){
    const labels=['Header','Hero','Manifiesto','Territorio','Proyecto','Master Plan','Video','Inversión','Club Stella','Club de playa','Evolución histórica','Preguntas frecuentes','CTA final'];
    const label=labels[index]||'CTA';
    const id=label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
    button.dataset.analyticsCta=id;button.dataset.analyticsLabel=label;button.dataset.analyticsSection=label;
  }
  $$('.js-qualify').forEach((button,index)=>{
    setCtaContext(button,index);
    button.addEventListener('click',()=>{
      currentCta={id:button.dataset.analyticsCta,label:button.dataset.analyticsLabel,section:button.dataset.analyticsSection};
      track('cta_click');
      track('form_start');
    });
  });

  // Scroll reveal
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('is-visible'); });
  }, {threshold:.12});
  $$('.reveal').forEach(el => observer.observe(el));

  // Mobile menu
  const toggle = $('.menu-toggle');
  const nav = $('.nav-links');
  toggle?.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav?.classList.toggle('mobile-open', !open);
  });
  nav?.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('mobile-open'); toggle?.setAttribute('aria-expanded','false'); } });

  // Modal + qualification
  const modal = $('#qualifyModal');
  const closeEls = $$('[data-close]');
  const steps = $$('.q-step');
  const nextBtn = $('#nextBtn');
  const backBtn = $('#backBtn');
  const progressBar = $('#progressBar');
  const progressText = $('#progressText');
  const stepText = $('#stepText');
  const form = $('#qualificationForm');
  const status = $('#formStatus');
  const resultPanel = $('#resultPanel');
  const bookingBtn = $('#bookingBtn');
  const altForm = $('#altForm');
  const alternativeForm = $('#alternativeForm');
  const altStatus = $('#altStatus');
  bookingBtn?.addEventListener('click', e => {
    formCompleted = true;
    track('booking_click',{qualification:'compatible',compatibleCount:Object.keys(compatible).reduce((n,k)=>n+(compatible[k].has(answers[k])?1:0),0),answers:{...answers}});
  });

  let step = 1;
  let formCompleted = false;
  let abandonmentSent = false;
  const answers = {};
  const progressValues = [0,38,58,78,92,100];
  const compatible = {
    q1: new Set(['80k-plus']),
    q2: new Set(['build','invest']),
    q3: new Set(['2029','2030-plus']),
    q4: new Set(['30-days','1-3-months']),
    q5: new Set(['call','conditions'])
  };

  function updateProgress() {
    progressBar.style.width = `${progressValues[step] || 0}%`;
    progressText.textContent = step === 5 ? 'Última pregunta' : `${progressValues[step] || 0}% de avance`;
    stepText.textContent = `Pregunta ${step} de 5`;
    backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
  }
  function reset() {
    step = 1;
    Object.keys(answers).forEach(k => delete answers[k]);
    form.reset();
    form.hidden = false;
    resultPanel.hidden = true;
    altForm.hidden = true;
    bookingBtn.hidden = true;
    status.textContent = '';
    status.hidden = false;
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === 1));
    nextBtn.textContent = 'Continuar →';
    updateProgress();
  }
  function open() {
    formCompleted = false;
    abandonmentSent = false;
    reset();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    if(modal.classList.contains('open')) {
      if(form.hidden) track('result_exit',{step:6,reason:'user_close_result',answers:{...answers}});
      else track('modal_close',{step,reason:'user_close',answers:{...answers}});
      abandonmentSent = true;
    }
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  $$('.js-qualify').forEach(b => b.addEventListener('click', open));
  closeEls.forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key==='Escape' && modal.classList.contains('open')) close(); });
  window.addEventListener('pagehide', () => {
    if(modal.classList.contains('open') && !formCompleted && !abandonmentSent && !form.hidden) {
      track('form_abandon',{step,reason:'page_exit',answers:{...answers}});
      abandonmentSent = true;
    }
  });

  function go(to) {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === to));
    step = to; updateProgress();
    nextBtn.innerHTML = step === 5 ? 'Ver mi resultado <span>→</span>' : 'Continuar <span>→</span>';
  }
  function chosen(name){ return form.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
  function makeExternalId() {
    try {
      if (crypto && crypto.randomUUID) return `costella-${crypto.randomUUID()}`;
    } catch {}
    return `costella-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  const leadExternalId = makeExternalId();

  function buildLeadPayload(extra = {}) {
    return {
      external_id: leadExternalId,
      project_id: cfg.projectId || 'costella-telchac-residencial',
      source: cfg.source || 'costella_landing',
      timestamp: new Date().toISOString(),
      answers: { ...answers },
      ...extra
    };
  }

  function submitLead(extra = {}) {
    const payload = buildLeadPayload(extra);
    try { sessionStorage.setItem('costella_last_lead', JSON.stringify(payload)); } catch {}
    // Only non-qualified leads are persisted in the Costella D1 database.
    if (payload.qualification !== 'alternative') return Promise.resolve();
    return fetch('/api/leads', {
      method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload), keepalive: true
    }).catch(() => {});
  }

  async function showResult(){
    const compatibleCount = Object.keys(compatible).reduce((n,k)=>n+(compatible[k].has(answers[k])?1:0),0);
    const qualified = compatibleCount >= 2;
    track('result_view',{qualification:qualified?'compatible':'alternative',compatibleCount,answers:{...answers}});
    const priority = qualified && compatible.q1.has(answers.q1) && compatible.q4.has(answers.q4);
    form.hidden = true;
    steps.forEach(s=>s.classList.remove('active'));
    resultPanel.hidden = false;
    progressBar.style.width='100%'; progressText.textContent='Evaluación completada'; stepText.textContent='Resultado';
    const title = $('#resultTitle'); const body = $('#resultBody');
    bookingBtn.hidden = true; altForm.hidden = true;
    if (qualified) {
      title.textContent = priority ? 'Tu perfil encaja con Costella y estás en un buen momento para avanzar.' : 'Tu perfil es compatible con Costella Telchac.';
      body.innerHTML = '<strong>Por tus respuestas, vale la pena conocer el proyecto a profundidad.</strong><br>El siguiente paso es revisar disponibilidad, condiciones vigentes y resolver tus preguntas directamente con un asesor.';
      bookingBtn.href = cfg.bookingUrl || 'https://calendly.com/somosamco/30min';
      bookingBtn.textContent = 'Agendar videollamada ';
      bookingBtn.insertAdjacentHTML('beforeend','<span>↗</span>');
      bookingBtn.hidden = false;
      await submitLead({
        qualification: 'compatible',
        compatibleCount,
        priority,
        contact: null,
        budget: '',
        interest: ''
      });
    } else {
      bookingBtn.hidden = true;
      bookingBtn.removeAttribute('href');
      title.textContent = 'Hoy quizá estés buscando algo diferente a Costella.';
      body.innerHTML = 'No pasa nada. Cuéntanos qué estás buscando y con qué presupuesto quieres invertir. Así podremos avisarte cuando exista un proyecto que encaje mejor contigo.';
      altForm.hidden = false;
    }
  }
  nextBtn.addEventListener('click', () => {
    const val = chosen(`q${step}`);
    if(!val){status.textContent='Selecciona una opción para continuar.';return;}
    status.textContent=''; answers[`q${step}`]=val; track('question_answer',{step,value:val});
    if(step<5) go(step+1); else showResult();
  });
  backBtn.addEventListener('click', () => { if(step>1) go(step-1); });
  alternativeForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd=new FormData(alternativeForm);
    const btn = alternativeForm.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    const compatibleCount = Object.keys(compatible).reduce((n,k)=>n+(compatible[k].has(answers[k])?1:0),0);
    await submitLead({
      qualification: 'alternative',
      compatibleCount,
      priority: false,
      contact: {
        name: String(fd.get('name') || '').trim(),
        whatsapp: String(fd.get('whatsapp') || '').trim(),
        email: String(fd.get('email') || '').trim()
      },
      budget: String(fd.get('budget') || '').trim(),
      interest: String(fd.get('interest') || '').trim()
    });
    formCompleted = true;
    altStatus.textContent='Listo. Guardamos tus datos y te avisaremos cuando encontremos un proyecto que encaje mejor contigo.';
  });
  updateProgress();
})();
