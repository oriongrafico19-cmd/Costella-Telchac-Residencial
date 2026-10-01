(function(){
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const modal=$('#qualifyModal'), backdrop=$('#qualifyBackdrop'), close=$('#qualifyClose');
  const form=$('#qualificationForm'), steps=$$('.qualify-step');
  const bar=$('#progressBar'), counter=$('#stepCounter'), progressText=$('#progressText');
  const result=$('#qualifyResult'), title=$('#resultTitle'), body=$('#resultBody');
  const bookingBtn=$('#bookingButton'), webinarBtn=$('#webinarButton'), altForm=$('#alternativeForm');
  const altSubmit=$('#altSubmit'), altStatus=$('#altStatus');
  let current=0; const answers={};
  const progress=[0,38,58,78,92,100];
  const comp={q1:new Set(['80k-plus']),q2:new Set(['build','invest']),q3:new Set(['2029','2030-plus']),q4:new Set(['30-days','1-3-months']),q5:new Set(['call','webinar'])};
  function setProgress(v){ bar.style.width=progress[Math.min(v,5)]+'%'; counter.textContent=v<5?`Pregunta ${v+1} de 5`:'Evaluación completada'; progressText.textContent=v===0?'Empieza la evaluación':`${progress[Math.min(v,5)]}% de avance`; }
  function open(){ modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; reset(); }
  function shut(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; }
  function reset(){ current=0; Object.keys(answers).forEach(k=>delete answers[k]); form.hidden=false; result.hidden=true; altForm.hidden=true; result.querySelector('.result-actions').style.display='flex'; steps.forEach((s,i)=>s.classList.toggle('active',i===0)); form.reset(); setProgress(0); }
  $$('.js-qualify').forEach(b=>b.addEventListener('click',open)); close.addEventListener('click',shut); backdrop.addEventListener('click',shut);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')shut()});
  steps.forEach((step,i)=>{$$('input',step).forEach(inp=>inp.addEventListener('change',()=>{if(i===0){bar.style.width='38%';progressText.textContent='38% de avance';}}))});
  form.addEventListener('submit',e=>{e.preventDefault(); const input=$(`.qualify-step.active input:checked`); if(!input) return; answers['q'+(current+1)]=input.value; if(current<4){current++; steps.forEach((s,i)=>s.classList.toggle('active',i===current)); setProgress(current);} else {showResult();}});
  $$('[data-back]').forEach(b=>b.addEventListener('click',()=>{if(current>0){current--;steps.forEach((s,i)=>s.classList.toggle('active',i===current));setProgress(current);}}));
  function showResult(){
    const score=Object.entries(comp).filter(([q,set])=>set.has(answers[q])).length;
    const qualified=score>=2;
    form.hidden=true; result.hidden=false; altForm.hidden=!(!qualified);
    setProgress(5);
    const booking=(window.COSTELLA_CONFIG&&window.COSTELLA_CONFIG.bookingUrl)||'';
    const webinar=(window.COSTELLA_CONFIG&&window.COSTELLA_CONFIG.webinarUrl)||'';
    if(qualified){
      title.textContent='Tu perfil es compatible con Costella.';
      body.innerHTML='Tus respuestas encajan con los criterios iniciales de este proyecto. El siguiente paso es conocer las condiciones vigentes y resolver tus preguntas con un asesor.';
      bookingBtn.hidden=!booking; bookingBtn.href=booking||'#';
      webinarBtn.hidden=!webinar; webinarBtn.href=webinar||'#';
      altForm.hidden=true;
    }else{
      title.textContent='Hoy quizá estés buscando algo diferente.';
      body.innerHTML='No pasa nada. Cuéntanos qué estás buscando y con cuánto quieres invertir para poder darte seguimiento con una alternativa que se ajuste mejor.';
      bookingBtn.hidden=true; webinarBtn.hidden=true; altForm.hidden=false;
    }
  }
  altSubmit.addEventListener('click',async()=>{
    const data={name:$('#altName').value.trim(),whatsapp:$('#altWhatsApp').value.trim(),email:$('#altEmail').value.trim(),search:$('#altSearch').value.trim(),budget:$('#altBudget').value,answers,qualification:'alternative'};
    if(!data.name||!data.whatsapp){altStatus.textContent='Completa al menos tu nombre y WhatsApp.';return;}
    const endpoint=(window.COSTELLA_CONFIG&&window.COSTELLA_CONFIG.leadEndpoint)||'';
    if(endpoint){try{await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,timestamp:new Date().toISOString()})})}catch(e){}}
    try{localStorage.setItem('costella_alt_lead',JSON.stringify({...data,timestamp:new Date().toISOString()}))}catch(e){}
    altStatus.textContent='Gracias. Registramos tu interés y te contactaremos con una alternativa.';
    altSubmit.disabled=true;
  });
})();
