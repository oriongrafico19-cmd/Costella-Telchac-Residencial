(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const cfg = window.COSTELLA_CONFIG || {};

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
  const webinarBtn = $('#webinarBtn');
  const altForm = $('#altForm');
  const alternativeForm = $('#alternativeForm');
  const altStatus = $('#altStatus');

  let step = 1;
  const answers = {};
  const progressValues = [0,38,58,78,92,100];
  const compatible = {
    q1: new Set(['80k-plus']),
    q2: new Set(['build','invest']),
    q3: new Set(['2029','2030-plus']),
    q4: new Set(['30-days','1-3-months']),
    q5: new Set(['call','webinar'])
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
    webinarBtn.hidden = true;
    status.textContent = '';
    status.hidden = false;
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === 1));
    nextBtn.textContent = 'Continuar →';
    updateProgress();
  }
  function open() {
    reset();
    modal.classList.add('open');
    modal.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  $$('.js-qualify').forEach(b => b.addEventListener('click', open));
  closeEls.forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', e => { if(e.key==='Escape' && modal.classList.contains('open')) close(); });

  function go(to) {
    steps.forEach(s => s.classList.toggle('active', Number(s.dataset.step) === to));
    step = to; updateProgress();
    nextBtn.innerHTML = step === 5 ? 'Ver mi resultado <span>→</span>' : 'Continuar <span>→</span>';
  }
  function chosen(name){ return form.querySelector(`input[name="${name}"]:checked`)?.value || ''; }
  function submitLead(extra={}) {
    const payload = {source:'costella-v18',timestamp:new Date().toISOString(),answers,...extra};
    try{sessionStorage.setItem('costella_last_lead',JSON.stringify(payload));}catch{}
    if (!cfg.leadEndpoint) return Promise.resolve();
    return fetch(cfg.leadEndpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});
  }
  function showResult(){
    const compatibleCount = Object.keys(compatible).reduce((n,k)=>n+(compatible[k].has(answers[k])?1:0),0);
    const qualified = compatibleCount >= 2;
    const priority = qualified && compatible.q1.has(answers.q1) && compatible.q4.has(answers.q4);
    form.hidden = true;
    steps.forEach(s=>s.classList.remove('active'));
    resultPanel.hidden = false;
    progressBar.style.width='100%'; progressText.textContent='Evaluación completada'; stepText.textContent='Resultado';
    const title = $('#resultTitle'); const body = $('#resultBody'); const urgency = $('#resultUrgency');
    bookingBtn.hidden = true; webinarBtn.hidden = true; altForm.hidden = true;
    if (qualified) {
      title.textContent = priority ? 'Tu perfil encaja con Costella y estás en un buen momento para avanzar.' : 'Tu perfil es compatible con Costella Telchac.';
      body.innerHTML = '<strong>Por tus respuestas, vale la pena conocer el proyecto a profundidad.</strong><br>El siguiente paso es revisar disponibilidad, condiciones vigentes y resolver tus preguntas con un asesor.';
      if(cfg.bookingUrl){bookingBtn.href=cfg.bookingUrl; bookingBtn.hidden=false;}
      if(cfg.webinarUrl){webinarBtn.href=cfg.webinarUrl; webinarBtn.hidden=false;}
      if(cfg.showWebinarScarcity && cfg.webinarSlots){urgency.hidden=false; urgency.textContent=`Cupo confirmado: quedan ${cfg.webinarSlots} lugares para el próximo webinar.`;} else urgency.hidden=true;
    } else {
      title.textContent = 'Hoy quizá estés buscando algo diferente a Costella.';
      body.innerHTML = 'No pasa nada. Cuéntanos qué estás buscando y con qué presupuesto quieres invertir. Así podremos avisarte cuando exista un proyecto que encaje mejor contigo.';
      altForm.hidden=false; urgency.hidden=true;
    }
    submitLead({qualification:qualified?'compatible':'alternative',compatibleCount,priority});
  }
  nextBtn.addEventListener('click', () => {
    const val = chosen(`q${step}`);
    if(!val){status.textContent='Selecciona una opción para continuar.';return;}
    status.textContent=''; answers[`q${step}`]=val;
    if(step<5) go(step+1); else showResult();
  });
  backBtn.addEventListener('click', () => { if(step>1) go(step-1); });
  alternativeForm?.addEventListener('submit', e => {
    e.preventDefault();
    const fd=new FormData(alternativeForm);
    submitLead({qualification:'alternative',contact:{name:fd.get('name'),whatsapp:fd.get('whatsapp'),email:fd.get('email')},budget:fd.get('budget'),interest:fd.get('interest')});
    altStatus.textContent='Listo. Guardamos tus datos y te avisaremos cuando encontremos un proyecto que encaje mejor contigo.';
  });
  updateProgress();
})();
