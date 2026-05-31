
// ════════ UTILITIES ════════
function esc(s){
  if(!s)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;');
}
let _toastT;
function toast(msg,type='suc'){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='on '+type;
  clearTimeout(_toastT);_toastT=setTimeout(()=>t.className='',3200);
}
function today(){return new Date().toISOString().slice(0,10);}
function fmtDate(d){
  if(!d)return'—';
  return new Date(d+'T12:00:00').toLocaleDateString('en-PH',{weekday:'short',month:'short',day:'numeric',year:'numeric'});
}
function fmtTime(t){
  if(!t)return'—';
  const[h,m]=t.split(':').map(Number);
  return`${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function fmtAge(dob){
  if(!dob)return'';
  const d=new Date(dob),now=new Date();
  let a=now.getFullYear()-d.getFullYear();
  if(now.getMonth()<d.getMonth()||(now.getMonth()===d.getMonth()&&now.getDate()<d.getDate()))a--;
  return a+'y';
}
function setBtnLoading(id,loading,label=''){
  const b=document.getElementById(id);if(!b)return;
  b.disabled=loading;
  if(loading){b.dataset.orig=b.textContent;b.textContent='...';}
  else{b.textContent=label||b.dataset.orig||'';}
}
function togglePw(id){
  const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';
}
function emptyHTML(title,sub){
  return`<div class="empty-state"><svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h4>${esc(title)}</h4>${sub?`<p>${esc(sub)}</p>`:''}</div>`;
}
function profRow(label,value){
  return`<div class="prof-row"><span class="prof-label">${label}</span><span class="prof-value">${value||'—'}</span></div>`;
}

// ════════ STATE ════════
let currentUser=null,doctorRec=null,allPatients=[],viewingPatientId=null;
let currentEntry=null,queueInterval=null,selDay=today();
let tabLoaded={schedule:false,patients:false};

// ════════ PAGE LOAD ════════
window.addEventListener('DOMContentLoaded',async()=>{
  try{
    const u=await sbGetUser();
    if(!u){showAuth();return;}
    const role=await sbCheckProfileRole(u.id);
    if(role!=='doctor'){await sbLogout();showAuth('This portal is for doctors only.');return;}
    currentUser=u;
    await initApp();
  }catch(e){showAuth();}
});

async function initApp(){
  try{
    const{data}=await db.from('doctors').select('*').eq('profile_id',currentUser.id).maybeSingle();
    doctorRec=data;
  }catch(e){}
  if(!doctorRec&&currentUser.profile){
    try{
      const{data}=await db.from('doctors').select('*').eq('first_name',currentUser.profile.first_name||'').eq('last_name',currentUser.profile.last_name||'').maybeSingle();
      doctorRec=data;
    }catch(e){}
  }
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-shell').style.display='block';
  document.getElementById('pgload').style.display='none';
  updateShiftUI();
  switchTab('queue');
}

function showAuth(err=''){
  document.getElementById('pgload').style.display='none';
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-shell').style.display='none';
  if(err){const e=document.getElementById('login-err');e.textContent=err;e.classList.add('show');}
}

// ════════ AUTH ════════
document.getElementById('login-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const email=document.getElementById('le').value.trim();
  const pw=document.getElementById('lp').value;
  const err=document.getElementById('login-err');err.classList.remove('show');
  setBtnLoading('login-btn',true);
  try{
    await sbLogin(email,pw);
    const u=await sbGetUser();
    const role=await sbCheckProfileRole(u.id);
    if(role!=='doctor'){await sbLogout();err.textContent='This portal is for doctors only.';err.classList.add('show');return;}
    currentUser=u;await initApp();
  }catch(ex){err.textContent=ex.message||'Login failed. Check credentials.';err.classList.add('show');}
  finally{setBtnLoading('login-btn',false,'Sign In');}
});

async function doLogout(){
  stopQueuePolling();
  await sbLogout();
  currentUser=null;doctorRec=null;currentEntry=null;viewingPatientId=null;allPatients=[];
  tabLoaded={schedule:false,patients:false};
  closePanel();closeMobilePanel();
  showAuth();
}

// ════════ NAVIGATION ════════
function switchTab(id){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item,.tab-btn').forEach(n=>{
    n.dataset.tab===id?n.classList.add('active'):n.classList.remove('active');
  });
  document.getElementById('tab-'+id).classList.add('active');
  id==='queue'?startQueuePolling():stopQueuePolling();
  if(id==='queue')loadQueue();
  else if(id==='schedule'){if(!tabLoaded.schedule){buildWeekStrip();fetchScheduleForDay(selDay);}tabLoaded.schedule=true;}
  else if(id==='patients'){if(!tabLoaded.patients)loadPatients();}
  else if(id==='profile')renderProfile();
}

// ════════ QUEUE ════════
function startQueuePolling(){if(!queueInterval)queueInterval=setInterval(loadQueue,30000);}
function stopQueuePolling(){if(queueInterval){clearInterval(queueInterval);queueInterval=null;}}

async function loadQueue(){
  if(!doctorRec){
    document.getElementById('queue-list').innerHTML=emptyHTML('No doctor record','Contact admin to link your account');
    document.getElementById('call-next-btn').disabled=true;return;
  }
  const wrap=document.getElementById('queue-list');
  if(!wrap.childElementCount||wrap.querySelector('.skel')){
    wrap.innerHTML='<div class="skel" style="height:72px;margin-bottom:8px"></div><div class="skel" style="height:72px;margin-bottom:8px"></div><div class="skel" style="height:72px"></div>';
  }
  try{
    const queue=await sbGetQueue(doctorRec.id);
    renderQueue(queue);
    const inSession=queue.find(e=>e.status==='in_session');
    if(inSession&&!currentEntry){currentEntry=inSession;openPatientPanel(inSession);}
  }catch(e){
    wrap.innerHTML=emptyHTML('Could not load queue','Check your connection');
    document.getElementById('call-next-btn').disabled=true;
  }
}

function renderQueue(queue){
  const wrap=document.getElementById('queue-list');
  const btn=document.getElementById('call-next-btn');
  if(!queue||!queue.length){
    wrap.innerHTML=emptyHTML('No patients in queue','New check-ins will appear here');
    const isOff=doctorRec&&doctorRec.status!=='active';
    btn.disabled=isOff;return;
  }
  const hasActive=queue.some(e=>e.status==='in_session');
  const isOff=doctorRec&&doctorRec.status!=='active';
  btn.disabled=hasActive||isOff;
  wrap.innerHTML=queue.map(e=>{
    const p=e.patients||{};
    const name=esc((p.first_name||'')+(p.last_name?' '+p.last_name:''));
    const purpose=esc(e.appointments?.purpose||'General Visit');
    const isActive=e.status==='in_session';
    const isWaiting=e.status==='waiting';
    const badge=isActive?'<span class="badge b-session">In Session</span>':isWaiting?'<span class="badge b-waiting">Waiting</span>':'<span class="badge b-done">Done</span>';
    const clickable=(isActive||isWaiting)?'clickable':'';
    const handler=isActive?`openPatientPanel(currentEntry)`:(isWaiting?`openQueueAction('${esc(e.id)}','${esc(e.appointments?.id||'')}')`:``);
    return`<div class="q-row ${isActive?'q-active':isWaiting?'q-waiting':'q-done'} ${clickable}" ${handler?`onclick="${handler}"`:''}>
      <div class="q-num-badge">${e.queue_number}</div>
      <div class="q-info"><div class="q-name">${name||'—'}</div><div class="q-appt-type">${purpose}</div></div>
      <div>${badge}</div>
    </div>`;
  }).join('');
}

async function callNext(){
  if(!doctorRec)return;
  setBtnLoading('call-next-btn',true);
  try{
    const entry=await sbCallNext(doctorRec.id);
    if(!entry){toast('No patients waiting','err');return;}
    currentEntry=entry;
    openPatientPanel(entry);
    try{await loadQueue();}catch(e){}
  }catch(e){toast(e.message||'Failed to call next','err');}
  finally{setBtnLoading('call-next-btn',false,'Call Next Patient');}
}

function openPatientPanel(entry){
  currentEntry=entry;
  const p=entry.patients||{};
  const name=(p.first_name||'')+(p.last_name?' '+p.last_name:'');
  const age=p.dob?fmtAge(p.dob):'';
  const purpose=entry.appointments?.purpose||'General Visit';
  const metaHtml=(age?esc(age)+' · ':'')+`<span style="color:var(--green)">${esc(purpose)}</span>`;
  const body=`<div class="ehr-err" id="ehr-err"></div>
    <div class="sec-label" style="margin-bottom:12px">Clinical Notes</div>
    <div class="form-g"><label>Diagnosis <span style="color:var(--crimson)">*</span></label><input type="text" id="ehr-diag" placeholder="Primary diagnosis" oninput="checkDoneBtn()"></div>
    <div class="form-g"><label>Notes <span style="color:var(--crimson)">*</span></label><textarea id="ehr-notes" rows="4" placeholder="Clinical observations, treatment…" style="min-height:120px" oninput="checkDoneBtn()"></textarea></div>
    <div class="form-g"><label>Follow-up Date</label><input type="date" id="ehr-followup" min="${today()}"></div>`;
  const footer=`<button class="btn btn-green" id="done-btn" onclick="saveDoneEHR()" disabled>Done — Mark Complete</button>
    <button class="btn btn-outline-crimson btn-sm" onclick="markNoShow()" style="width:auto;align-self:center;margin-top:2px">Mark No-Show</button>`;
  const isMobile=window.innerWidth<1024;
  if(isMobile){
    document.getElementById('bs-body').innerHTML=`<div style="margin-bottom:16px"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:17px;color:var(--white)">${esc(name)}</div><div class="rp-patient-meta">${metaHtml}</div></div>${body}`;
    document.getElementById('bs-footer').innerHTML=footer;
    document.getElementById('bsheet').classList.add('on');
    document.getElementById('sheet-bd').classList.add('on');
  }else{
    document.getElementById('rp-name').textContent=name||'Patient';
    document.getElementById('rp-meta').innerHTML=metaHtml;
    document.getElementById('rp-body').innerHTML=body;
    document.getElementById('rp-footer').innerHTML=footer;
    document.getElementById('right-panel').classList.add('open');
  }
}

function checkDoneBtn(){
  const d=(document.getElementById('ehr-diag')?.value||'').trim();
  const n=(document.getElementById('ehr-notes')?.value||'').trim();
  const b=document.getElementById('done-btn');if(b)b.disabled=!d||!n;
}

async function saveDoneEHR(){
  if(!currentEntry||!doctorRec)return;
  const diag=(document.getElementById('ehr-diag')?.value||'').trim();
  const notes=(document.getElementById('ehr-notes')?.value||'').trim();
  const followup=document.getElementById('ehr-followup')?.value||null;
  if(!diag||!notes){showEhrErr('Diagnosis and Notes are required');return;}
  setBtnLoading('done-btn',true);
  try{
    await sbSaveEHR({
      patient_id:currentEntry.patient_id,
      doctor_id:doctorRec.id,
      appointment_id:currentEntry.appointment_id,
      visit_date:today(),
      diagnosis:diag,notes,
      follow_up:followup||null,
      clinic_id:'a1b2c3d4-0000-0000-0000-000000000001'
    });
  }catch(e){showEhrErr(e.message||'Save failed. Check connection.');setBtnLoading('done-btn',false,'Done — Mark Complete');return;}
  try{
    await sbAdvanceQueue(currentEntry.id);
    await db.from('appointments').update({status:'Completed'}).eq('id',currentEntry.appointment_id);
  }catch(e){}
  const saved=currentEntry;currentEntry=null;
  closePanel();closeMobilePanel();
  toast('Consultation saved','suc');
  try{await loadQueue();}catch(e){}
}

async function markNoShow(){
  if(!currentEntry)return;
  try{
    await sbMarkNoShow(currentEntry.id,currentEntry.appointment_id);
    currentEntry=null;
    closePanel();closeMobilePanel();
    toast('Marked as no-show','suc');
    try{await loadQueue();}catch(e){}
  }catch(e){toast(e.message||'Failed','err');}
}

function showEhrErr(msg){const el=document.getElementById('ehr-err');if(el){el.textContent=msg;el.classList.add('show');}}

function openQueueAction(qId,apptId){
  const isMobile=window.innerWidth<1024;
  const body=`<div style="font-family:'Montserrat',sans-serif;font-weight:700;font-size:16px;margin-bottom:12px">Queue Action</div><p style="font-size:13px;color:var(--muted);margin-bottom:16px">This patient is waiting to be called.</p>`;
  const footer=`<button class="btn btn-outline-crimson" onclick="quickNoShow('${esc(qId)}','${esc(apptId)}')">Mark No-Show</button><button class="btn btn-outline" onclick="${isMobile?'closeMobilePanel()':'closePanel()'}">Close</button>`;
  if(isMobile){document.getElementById('bs-body').innerHTML=body;document.getElementById('bs-footer').innerHTML=footer;document.getElementById('bsheet').classList.add('on');document.getElementById('sheet-bd').classList.add('on');}
  else{document.getElementById('rp-name').textContent='Queue Action';document.getElementById('rp-meta').innerHTML='';document.getElementById('rp-body').innerHTML=body;document.getElementById('rp-footer').innerHTML=footer;document.getElementById('right-panel').classList.add('open');}
}

async function quickNoShow(qId,apptId){
  try{await sbMarkNoShow(qId,apptId);closePanel();closeMobilePanel();toast('Marked as no-show','suc');try{await loadQueue();}catch(e){}}
  catch(e){toast(e.message||'Failed','err');}
}

function closePanel(){document.getElementById('right-panel').classList.remove('open');}
function closeMobilePanel(){document.getElementById('bsheet').classList.remove('on');document.getElementById('sheet-bd').classList.remove('on');}

// ════════ SHIFT ════════
async function toggleShift(){
  if(!doctorRec)return;
  const isOn=doctorRec.status==='active';
  try{
    await db.from('doctors').update({status:isOn?'off_duty':'active'}).eq('id',doctorRec.id);
    doctorRec.status=isOn?'off_duty':'active';
    updateShiftUI();
    toast(isOn?'Shift ended — Off duty':'Now on shift','suc');
  }catch(e){toast('Failed to update shift','err');}
}

function updateShiftUI(){
  const isOn=!doctorRec||doctorRec.status==='active';
  const tog=document.getElementById('shift-toggle');
  const lbl=document.getElementById('shift-label');
  if(tog){tog.classList.toggle('on',isOn);tog.setAttribute('aria-checked',String(isOn));}
  if(lbl)lbl.textContent=isOn?'On Shift':'Off Shift';
  const btn=document.getElementById('call-next-btn');
  if(btn&&!isOn)btn.disabled=true;
}

// ════════ SCHEDULE ════════
function buildWeekStrip(){
  const strip=document.getElementById('week-strip');
  const days=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const base=new Date(today()+'T12:00:00');
  strip.innerHTML='';
  for(let i=0;i<14;i++){
    const d=new Date(base);d.setDate(base.getDate()+i);
    const dStr=d.toISOString().slice(0,10);
    const pill=document.createElement('div');
    pill.className='day-pill'+(dStr===selDay?' active':'');
    pill.dataset.date=dStr;
    pill.innerHTML=`<span class="dp-name">${days[d.getDay()]}</span><span class="dp-num">${d.getDate()}</span>`;
    pill.onclick=()=>selectDay(dStr);
    strip.appendChild(pill);
  }
}

async function selectDay(dStr){
  selDay=dStr;
  document.querySelectorAll('.day-pill').forEach(p=>p.classList.toggle('active',p.dataset.date===dStr));
  await fetchScheduleForDay(dStr);
}

async function fetchScheduleForDay(dStr){
  const list=document.getElementById('sched-list');
  list.innerHTML='<div class="skel" style="height:60px;margin-bottom:6px"></div><div class="skel" style="height:60px"></div>';
  try{
    const appts=await sbGetAllAppointments();
    const dayAppts=(appts||[]).filter(a=>a.date===dStr&&a.doctor_id===doctorRec?.id).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
    if(!dayAppts.length){list.innerHTML=emptyHTML('No appointments','No appointments scheduled for this day');return;}
    list.innerHTML=dayAppts.map(a=>{
      const name=a.patients?esc(a.patients.first_name||'')+' '+esc(a.patients.last_name||''):'Unknown';
      const badge=schedBadge(a.status);
      return`<div class="sched-row"><div class="sched-time">${esc(fmtTime(a.time))}</div><div style="flex:1"><div class="sched-name">${name}</div><div class="sched-service">${esc(a.purpose||'General Consultation')}</div></div><span class="${badge[1]}">${badge[0]}</span></div>`;
    }).join('');
  }catch(e){list.innerHTML=emptyHTML('Could not load schedule','');}
}

function schedBadge(s){
  const m={'Confirmed':['Confirmed','badge b-confirmed'],'Completed':['Done','badge b-done'],'Cancelled':['Cancelled','badge b-noshow'],'In Session':['In Session','badge b-session'],'Pending':['Pending','badge b-pending'],'Checked In':['Checked In','badge b-pending']};
  return m[s]||[s,'badge b-pending'];
}

// ════════ PATIENTS ════════
async function loadPatients(){
  const list=document.getElementById('patient-list');
  list.innerHTML='<div class="skel" style="height:60px;margin-bottom:6px"></div><div class="skel" style="height:60px;margin-bottom:6px"></div><div class="skel" style="height:60px"></div>';
  try{
    allPatients=await sbGetPatients();
    tabLoaded.patients=true;
    renderPatientList(allPatients);
  }catch(e){list.innerHTML=emptyHTML('Could not load patients','');}
}

function renderPatientList(pts){
  const list=document.getElementById('patient-list');
  if(!pts||!pts.length){list.innerHTML=emptyHTML('No patients found','');return;}
  list.innerHTML=pts.map(p=>{
    const fn=p.first_name||'';const ln=p.last_name||'';
    const name=esc(fn+(ln?' '+ln:''));
    const initials=(fn[0]||'')+(ln[0]||'');
    const age=p.dob?fmtAge(p.dob):'';
    return`<div class="pt-row" onclick="openPatientDetail('${esc(p.id)}')">
      <div class="pt-avatar">${esc(initials.toUpperCase()||'?')}</div>
      <div style="flex:1"><div class="pt-name">${name||'Unknown'}</div><div class="pt-meta">${age?age+' · ':''}${esc(p.sex||'')}</div></div>
      <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" style="color:var(--muted);flex-shrink:0"><polyline points="9 18 15 12 9 6"/></svg>
    </div>`;
  }).join('');
}

function filterPatients(q){
  const term=q.toLowerCase();
  renderPatientList(allPatients.filter(p=>(((p.first_name||'')+' '+(p.last_name||'')).toLowerCase()).includes(term)));
}

async function openPatientDetail(patientId){
  viewingPatientId=patientId;
  const p=allPatients.find(x=>x.id===patientId)||{};
  const name=(p.first_name||'')+(p.last_name?' '+p.last_name:'');
  const age=p.dob?fmtAge(p.dob):'';
  const hdr=`<div style="margin-bottom:14px"><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:17px;color:var(--white)">${esc(name)}</div><div class="rp-patient-meta">${esc(age)?esc(age)+' · ':''}${esc(p.sex||'')}</div></div>`;
  const subTabs=`<div class="sub-tabs"><button class="sub-tab active" id="st-history" onclick="switchSubTab('history')">History</button><button class="sub-tab" id="st-info" onclick="switchSubTab('info')">Info</button></div>`;
  const loading='<div class="skel" style="height:80px;margin-bottom:8px"></div><div class="skel" style="height:80px"></div>';
  const isMobile=window.innerWidth<1024;
  if(isMobile){
    document.getElementById('bs-body').innerHTML=hdr+subTabs+`<div id="pt-detail-content">${loading}</div>`;
    document.getElementById('bs-footer').innerHTML='';
    document.getElementById('bsheet').classList.add('on');
    document.getElementById('sheet-bd').classList.add('on');
  }else{
    document.getElementById('rp-name').textContent=name;
    document.getElementById('rp-meta').innerHTML=esc(age)+(age?' · ':'')+esc(p.sex||'');
    document.getElementById('rp-body').innerHTML=hdr+subTabs+`<div id="pt-detail-content">${loading}</div>`;
    document.getElementById('rp-footer').innerHTML='';
    document.getElementById('right-panel').classList.add('open');
  }
  await loadPatientHistory(patientId);
}

async function loadPatientHistory(patientId){
  const ct=document.getElementById('pt-detail-content');if(!ct)return;
  ct.innerHTML='<div class="skel" style="height:80px;margin-bottom:8px"></div><div class="skel" style="height:80px"></div>';
  try{
    const recs=await sbGetEHR(patientId);
    if(!recs||!recs.length){ct.innerHTML=emptyHTML('No records','No EHR records on file');return;}
    ct.innerHTML=recs.map(r=>{
      const doc=r.doctors?'Dr. '+esc(r.doctors.first_name||'')+' '+esc(r.doctors.last_name||''):'';
      return`<div class="ehr-card" onclick="this.classList.toggle('open')">
        <div class="ehr-card-hdr"><div><div class="ehr-card-date">${esc(fmtDate(r.visit_date))}</div><div class="ehr-card-doc">${doc}</div></div><svg class="ehr-chev" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg></div>
        <div class="ehr-card-body">
          ${r.diagnosis?`<div class="ehr-field"><div class="ehr-fl">Diagnosis</div><div class="ehr-fv">${esc(r.diagnosis)}</div></div>`:''}
          ${r.notes?`<div class="ehr-field"><div class="ehr-fl">Notes</div><div class="ehr-fv">${esc(r.notes)}</div></div>`:''}
          ${r.follow_up?`<div class="ehr-field"><div class="ehr-fl">Follow-up</div><div class="ehr-fv">${esc(fmtDate(r.follow_up))}</div></div>`:''}
        </div>
      </div>`;
    }).join('');
  }catch(e){ct.innerHTML=emptyHTML('Could not load records','');}
}

function switchSubTab(tab){
  document.querySelectorAll('.sub-tab').forEach(t=>t.classList.remove('active'));
  document.getElementById('st-'+tab)?.classList.add('active');
  const ct=document.getElementById('pt-detail-content');if(!ct)return;
  if(tab==='history'){loadPatientHistory(viewingPatientId);}
  else{
    const p=allPatients.find(x=>x.id===viewingPatientId)||{};
    ct.innerHTML=`<div class="prof-section">${profRow('Date of Birth',esc(p.dob||'—'))}${profRow('Sex',esc(p.sex||'—'))}${profRow('Contact',esc(p.contact||'—'))}${profRow('Blood Type',esc(p.blood_type||'—'))}${profRow('Allergies',esc(p.allergies||'—'))}${profRow('Address',esc(p.address||'—'))}</div>`;
  }
}

// ════════ PROFILE ════════
function renderProfile(){
  const wrap=document.getElementById('profile-content');
  const d=doctorRec||{};const u=currentUser?.profile||{};
  const fn=d.first_name||u.first_name||'Doctor';
  const ln=d.last_name||u.last_name||'';
  const isAvail=!d.id||(d.status==='active');
  wrap.innerHTML=`
    <div class="prof-section">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px">
        <div style="width:56px;height:56px;border-radius:50%;background:rgba(0,168,89,0.12);border:2px solid rgba(0,168,89,0.3);display:flex;align-items:center;justify-content:center;font-family:'Montserrat',sans-serif;font-weight:800;font-size:18px;color:var(--green)">${esc(fn[0]||'D')}${esc(ln[0]||'')}</div>
        <div><div style="font-family:'Montserrat',sans-serif;font-weight:800;font-size:16px;color:var(--white)">Dr. ${esc(fn)} ${esc(ln)}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${esc(d.specialty||'General Practice')}</div></div>
      </div>
      ${profRow('Email',esc(currentUser?.email||'—'))}
      ${profRow('PRC License',esc(d.prc_license||'—'))}
      ${profRow('Specialty',esc(d.specialty||'—'))}
    </div>
    <div class="prof-section">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div><div style="font-weight:600;font-size:13px;color:var(--white)">Accepting Patients</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${isAvail?'Currently on shift':'Currently off duty'}</div></div>
        <button class="shift-toggle ${isAvail?'on':''}" role="switch" aria-checked="${isAvail}" onclick="toggleAvailability()"></button>
      </div>
    </div>
    <div class="prof-section" style="background:transparent;border:none;padding:4px 0">
      <button class="btn btn-outline-crimson" onclick="doLogout()"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>Sign Out</button>
    </div>`;
}

async function toggleAvailability(){
  if(!doctorRec){toast('No doctor record linked','err');return;}
  const isOn=doctorRec.status==='active';
  try{
    await db.from('doctors').update({status:isOn?'off_duty':'active'}).eq('id',doctorRec.id);
    doctorRec.status=isOn?'off_duty':'active';
    updateShiftUI();renderProfile();
    toast(isOn?'Shift ended — Off duty':'Now on shift','suc');
  }catch(e){toast('Failed to update availability','err');}
}
