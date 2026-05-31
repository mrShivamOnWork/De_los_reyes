
// ════════════════════════════════════════════
//  UTILS
// ════════════════════════════════════════════
function esc(s){if(!s)return'';return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#x27;')}

let _toastT;
function toast(msg,type='suc'){
  const t=document.getElementById('toast');
  t.textContent=msg;t.className='on '+type;
  clearTimeout(_toastT);_toastT=setTimeout(()=>t.className='',3200);
}

function showSh(html){
  document.getElementById('sh-body').innerHTML=html;
  document.getElementById('bsheet').classList.add('on');
  document.getElementById('sheet-bd').classList.add('on');
}
function hideSh(){
  document.getElementById('bsheet').classList.remove('on');
  document.getElementById('sheet-bd').classList.remove('on');
}

function fmtDate(ds){
  if(!ds)return'—';
  const d=new Date(ds+'T00:00:00');
  return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
}
function fmtTime(ts){
  if(!ts)return'—';
  const[h,m]=ts.split(':').map(Number);
  const ap=h>=12?'PM':'AM';const h12=h%12||12;
  return`${h12}:${String(m).padStart(2,'0')} ${ap}`;
}
function fmtLongDate(ds){
  if(!ds)return'—';
  const d=new Date(ds+'T00:00:00');
  return d.toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'});
}
function greetTime(){
  const h=new Date().getHours();
  if(h<12)return'Good morning,';if(h<17)return'Good afternoon,';return'Good evening,';
}

function setBtnLoading(id,loading,label=''){
  const b=document.getElementById(id);if(!b)return;
  b.disabled=loading;b.textContent=loading?'Please wait…':label;
}

// ════════════════════════════════════════════
//  STATE
// ════════════════════════════════════════════
let currentUser=null,patientRec=null,allAppts=[],bookingPick=null,selService='General Consultation',_pendingApptId=null;
let tabLoaded={home:false,book:false,appointments:false,records:false,profile:false};

// ════════════════════════════════════════════
//  PAGE LOAD
// ════════════════════════════════════════════
window.addEventListener('DOMContentLoaded',async()=>{
  try{
    const u=await sbGetUser();
    if(!u){showAuth();return;}
    const role=await sbCheckProfileRole(u.id);
    if(role!=='patient'){await sbLogout();showAuth('This portal is for patients only.');return;}
    currentUser=u;
    await initApp();
  }catch(e){showAuth();}
});

async function initApp(){
  try{patientRec=await sbGetMyPatientRecord(currentUser.id);}catch(e){}
  const fn=currentUser.profile?.first_name||currentUser.user_metadata?.first_name||'Patient';
  document.getElementById('greet-name').textContent='Hello, '+esc(fn)+'!';
  document.getElementById('greet-time').textContent=greetTime();
  document.getElementById('auth-screen').style.display='none';
  document.getElementById('app-shell').style.display='block';
  document.getElementById('pgload').style.display='none';
  switchTab('home');
}

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
function showAuth(errMsg=''){
  document.getElementById('pgload').style.display='none';
  document.getElementById('auth-screen').style.display='flex';
  document.getElementById('app-shell').style.display='none';
  if(errMsg){showLoginErr(errMsg);}
}
function showLogin(){document.getElementById('login-view').style.display='';document.getElementById('reg-view').style.display='none';}
function showReg(){document.getElementById('reg-view').style.display='';document.getElementById('login-view').style.display='none';}
function showLoginErr(m){const e=document.getElementById('login-err');e.textContent=m;e.classList.add('show');}
function showRegErr(m){const e=document.getElementById('reg-err');e.textContent=m;e.classList.add('show');}

function togglePw(id,btn){
  const i=document.getElementById(id);
  i.type=i.type==='password'?'text':'password';
}

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
    if(role!=='patient'){await sbLogout();showLoginErr('This portal is for patients only.');return;}
    currentUser=u;await initApp();
  }catch(ex){showLoginErr(ex.message||'Login failed. Check credentials.');}
  finally{setBtnLoading('login-btn',false,'Sign In');}
});

document.getElementById('reg-form').addEventListener('submit',async e=>{
  e.preventDefault();
  const pw=document.getElementById('rf-pw').value;
  const pw2=document.getElementById('rf-pw2').value;
  if(pw!==pw2){showRegErr('Passwords do not match.');return;}
  if(pw.length<8){showRegErr('Password must be at least 8 characters.');return;}
  document.getElementById('reg-err').classList.remove('show');
  setBtnLoading('reg-btn',true);
  try{
    await sbRegisterPatient({
      email:document.getElementById('rf-em').value.trim(),
      password:pw,
      firstName:document.getElementById('rf-fn').value.trim(),
      lastName:document.getElementById('rf-ln').value.trim(),
      dob:document.getElementById('rf-dob').value,
      sex:document.getElementById('rf-sex').value,
      contact:document.getElementById('rf-ct').value.trim(),
      address:document.getElementById('rf-addr').value.trim(),
      bloodType:document.getElementById('rf-bt').value,
      allergies:document.getElementById('rf-al').value.trim()||'None',
      emergencyName:document.getElementById('rf-en').value.trim(),
      emergencyContact:document.getElementById('rf-ec').value.trim(),
    });
    const u=await sbGetUser();currentUser=u;
    await initApp();
  }catch(ex){showRegErr(ex.message||'Registration failed. Try again.');}
  finally{setBtnLoading('reg-btn',false,'Create Account');}
});

async function doLogout(){
  try{await sbLogout();}catch(e){}
  currentUser=null;patientRec=null;allAppts=[];
  tabLoaded={home:false,book:false,appointments:false,records:false,profile:false};
  showAuth();
}

// ════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════
function switchTab(id){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item,.tab-btn').forEach(n=>{
    if(n.dataset.tab===id)n.classList.add('active');
    else n.classList.remove('active');
  });
  const panel=document.getElementById('tab-'+id);
  if(panel)panel.classList.add('active');
  loadTab(id);
}

function loadTab(id){
  switch(id){
    case'home':loadHome();break;
    case'book':loadBook();break;
    case'appointments':loadAppts();break;
    case'records':loadRecords();break;
    case'profile':loadProfile();break;
  }
}

// ════════════════════════════════════════════
//  HOME TAB
// ════════════════════════════════════════════
async function loadHome(){
  let appts=[];
  try{appts=await sbGetMyAppointments(currentUser.id);}catch(e){}
  allAppts=appts;
  loadQueueCard(appts);
  loadNextAppt(appts);
}

async function loadQueueCard(appts){
  const wrap=document.getElementById('queue-wrap');
  wrap.innerHTML='<div class="skel card" style="height:80px"></div>';
  try{
    const upcoming=(appts||[]).filter(a=>a.date>=today()&&!['Cancelled','Completed','No-Show'].includes(a.status));
    if(!upcoming.length){
      wrap.innerHTML=queueEmptyHTML('No active appointments');return;
    }
    const doctorId=upcoming[0].doctor_id;
    const queue=await sbGetQueue(doctorId);
    const myEntry=queue.find(e=>e.patient_id===patientRec?.id&&['waiting','in_session'].includes(e.status));
    if(!myEntry){wrap.innerHTML=queueEmptyHTML('Not currently in queue');return;}
    const pos=myEntry.queue_number;
    const waitMin=pos*6;
    wrap.innerHTML=`
      <div class="queue-active">
        <div class="sec-label" style="margin-bottom:10px">Queue Position</div>
        <div class="q-row">
          <div class="q-circle"><span class="q-num">#${pos}</span></div>
          <div class="q-info">
            <h4>You are #${pos} in line</h4>
            <p>Est. wait: ~${waitMin} min</p>
          </div>
        </div>
      </div>`;
  }catch(e){wrap.innerHTML=queueEmptyHTML('Queue unavailable');}
}

function queueEmptyHTML(msg){
  return`<div class="queue-empty"><svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24" style="opacity:.4;flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span>${esc(msg)}</span></div>`;
}

async function loadNextAppt(appts){
  const wrap=document.getElementById('next-appt-wrap');
  try{
    const upcoming=appts.filter(a=>a.date>=today()&&!['Cancelled','Completed','No-Show'].includes(a.status))
      .sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
    if(!upcoming.length){
      wrap.innerHTML=`<div class="na-card"><div class="empty-state" style="padding:16px 0"><svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><h4>No upcoming appointments</h4><p>Tap "Book an Appointment" below</p></div></div>`;
      return;
    }
    const a=upcoming[0];
    const dn=a.doctors?esc(a.doctors.first_name)+' '+esc(a.doctors.last_name):'Unknown Doctor';
    const sp=a.doctors?.specialty||'';
    wrap.innerHTML=`
      <div class="na-card">
        <div class="sec-label" style="margin-bottom:8px">Next Visit</div>
        <div class="na-date">${esc(fmtDate(a.date))}</div>
        <div class="na-time">${esc(fmtTime(a.time))}</div>
        <div class="na-doc">Dr. ${dn}${sp?` · <span style="color:var(--muted)">${esc(sp)}</span>`:''}</div>
      </div>`;
  }catch(e){wrap.innerHTML=queueEmptyHTML('Could not load appointments');}
}

function today(){return new Date().toISOString().slice(0,10);}

// ════════════════════════════════════════════
//  BOOK TAB
// ════════════════════════════════════════════
const FALLBACK_DOCS=[
  {id:'doc-1',first_name:'Maria',last_name:'Santos',specialty:'General Practice',work_days:['Mon','Tue','Wed','Thu','Fri'],work_hours:'09:00-17:00',status:'active'},
  {id:'doc-2',first_name:'Jose',last_name:'Reyes',specialty:'Pediatrics',work_days:['Mon','Tue','Wed','Thu'],work_hours:'08:00-16:00',status:'active'},
  {id:'doc-3',first_name:'Ana',last_name:'Cruz',specialty:'Internal Medicine',work_days:['Tue','Wed','Thu','Fri'],work_hours:'10:00-18:00',status:'active'},
  {id:'doc-4',first_name:'Carlos',last_name:'Lim',specialty:'OB-GYN',work_days:['Mon','Wed','Fri'],work_hours:'09:00-15:00',status:'active'},
];

let loadedDocs=[];

function selSvc(el){
  document.querySelectorAll('#service-chips .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');selService=el.dataset.svc;
}

async function loadBook(){
  if(tabLoaded.book)return;
  const wrap=document.getElementById('docs-list');
  try{
    let docs=await sbGetDoctors();
    if(!docs||!docs.length)docs=FALLBACK_DOCS;
    loadedDocs=docs;
    await renderDocs(docs,wrap);
    tabLoaded.book=true;
  }catch(e){
    loadedDocs=FALLBACK_DOCS;
    await renderDocs(FALLBACK_DOCS,wrap);
    tabLoaded.book=true;
  }
}

async function renderDocs(docs,wrap){
  wrap.innerHTML='';
  for(const doc of docs){
    const slots=generateSlots(doc);
    try{
      const btPromises=slots.map(s=>sbGetBookedTimes(doc.id,s.date));
      const results=await Promise.all(btPromises);
      results.forEach((bt,i)=>{slots[i].booked=bt.includes(slots[i].time);});
    }catch(e){}
    const slotsHtml=slots.map((s,i)=>`
      <button class="slot-btn${s.booked?' booked':''}" ${s.booked?'disabled':''} data-doc-id="${esc(doc.id)}" data-doc-name="Dr. ${esc(doc.first_name)} ${esc(doc.last_name)}" data-specialty="${esc(doc.specialty||'')}" data-date="${esc(s.date)}" data-time="${esc(s.time)}" onclick="pickSlot(this)">
        ${esc(fmtDate(s.date).replace(/^[A-Za-z]+,\s/,''))} ${esc(fmtTime(s.time))}
      </button>`).join('');
    wrap.innerHTML+=`
      <div class="doc-card">
        <div class="doc-name">Dr. ${esc(doc.first_name)} ${esc(doc.last_name)}</div>
        <div class="doc-spec"><span class="doc-dot"></span>${esc(doc.specialty||'General Practice')}</div>
        <div class="slots-lbl">Next available slots</div>
        <div class="slots-row">${slotsHtml}</div>
      </div>`;
  }
}

function generateSlots(doc){
  const wdays=Array.isArray(doc.work_days)?doc.work_days:['Mon','Tue','Wed','Thu','Fri'];
  const wh=doc.work_hours||'09:00-17:00';
  const startH=parseInt((wh.split('-')[0]||'09').split(':')[0],10)||9;
  const times=[
    `${String(startH).padStart(2,'0')}:00`,
    `${String(startH+2).padStart(2,'0')}:00`,
    `${String(startH+4).padStart(2,'0')}:00`,
  ];
  const DN=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const slots=[];
  const d=new Date();d.setDate(d.getDate()+1);
  let iter=0;
  while(slots.length<3&&iter<30){
    iter++;
    if(wdays.includes(DN[d.getDay()])){
      slots.push({date:d.toISOString().slice(0,10),time:times[slots.length],booked:false});
    }
    d.setDate(d.getDate()+1);
  }
  return slots;
}

function pickSlot(el){
  const d=el.dataset;
  bookingPick={docId:d.docId,docName:d.docName,specialty:d.specialty,date:d.date,time:d.time};
  document.querySelectorAll('.slot-btn').forEach(b=>b.classList.remove('sel'));
  el.classList.add('sel');
  showBookConfirm();
}

function showBookConfirm(){
  if(!bookingPick)return;
  const p=bookingPick;
  showSh(`
    <div class="sh-title">Confirm Appointment</div>
    <div class="sh-row"><span class="sh-lbl">Doctor</span><span class="sh-val">${esc(p.docName)}</span></div>
    <div class="sh-row"><span class="sh-lbl">Specialty</span><span class="sh-val">${esc(p.specialty)}</span></div>
    <div class="sh-row"><span class="sh-lbl">Date</span><span class="sh-val">${esc(fmtDate(p.date))}</span></div>
    <div class="sh-row"><span class="sh-lbl">Time</span><span class="sh-val">${esc(fmtTime(p.time))}</span></div>
    <div class="sh-row"><span class="sh-lbl">Service</span><span class="sh-val">${esc(selService)}</span></div>
    <div class="sh-actions">
      <button class="btn btn-green" id="confirm-book-btn" onclick="confirmBook()">Confirm Booking</button>
      <button class="btn btn-outline" onclick="hideSh()">Cancel</button>
    </div>
  `);
}

async function confirmBook(){
  if(!bookingPick)return;
  const btn=document.getElementById('confirm-book-btn');
  if(btn){btn.disabled=true;btn.textContent='Booking…';}
  try{
    await sbBookAppointment({
      patientProfileId:currentUser.id,
      doctorId:bookingPick.docId,
      date:bookingPick.date,
      time:bookingPick.time,
      purpose:selService,
      paymentMethod:'cash',
    });
    hideSh();
    bookingPick=null;
    allAppts=[];tabLoaded.appointments=false;tabLoaded.book=false;
    toast('Appointment booked!','suc');
    setTimeout(()=>switchTab('appointments'),600);
  }catch(ex){
    toast(ex.message||'Booking failed. Try again.','err');
    if(btn){btn.disabled=false;btn.textContent='Confirm Booking';}
  }
}

// ════════════════════════════════════════════
//  APPOINTMENTS TAB
// ════════════════════════════════════════════
let currentSub='upcoming';

function showSub(sub){
  currentSub=sub;
  document.getElementById('stab-up').classList.toggle('active',sub==='upcoming');
  document.getElementById('stab-past').classList.toggle('active',sub==='past');
  document.getElementById('list-upcoming').style.display=sub==='upcoming'?'':'none';
  document.getElementById('list-past').style.display=sub==='past'?'':'none';
}

async function loadAppts(){
  if(allAppts.length){renderAppts(allAppts);return;}
  document.getElementById('list-upcoming').innerHTML='<div class="skel card" style="height:80px;margin-bottom:8px"></div><div class="skel card" style="height:80px"></div>';
  try{
    const appts=await sbGetMyAppointments(currentUser.id);
    allAppts=appts;renderAppts(appts);
  }catch(e){
    document.getElementById('list-upcoming').innerHTML=emptyStateHTML('Could not load appointments','Try again later');
  }
}

function renderAppts(appts){
  const now=new Date();
  const up=appts.filter(a=>!['Completed','Cancelled','No-Show'].includes(a.status)&&(a.date>today()||(a.date===today())));
  const past=appts.filter(a=>['Completed','Cancelled','No-Show'].includes(a.status)||a.date<today());
  document.getElementById('list-upcoming').innerHTML=up.length?up.map(a=>apptCardHTML(a,now)).join(''): emptyStateHTML('No upcoming appointments','Book one using the Book tab');
  document.getElementById('list-past').innerHTML=past.length?past.map(a=>apptCardHTML(a,now)).join(''):emptyStateHTML('No past appointments','Your visit history will appear here');
}

function apptCardHTML(a,now){
  const dn=a.doctors?'Dr. '+esc(a.doctors.first_name)+' '+esc(a.doctors.last_name):'Unknown Doctor';
  const sp=a.doctors?.specialty||'';
  const badge=statusBadge(a.status);
  const apptDT=new Date(a.date+'T'+(a.time||'00:00')+':00');
  const diffH=(apptDT-now)/3600000;
  const canAct=(['Confirmed','Pending'].includes(a.status))&&diffH>2;
  return`
    <div class="appt-card">
      <div class="appt-top">
        <div>
          <div class="appt-date">${esc(fmtDate(a.date))}</div>
          <div class="appt-time">${esc(fmtTime(a.time))}</div>
        </div>
        <span class="${badge[1]}">${badge[0]}</span>
      </div>
      <div class="appt-doc">${dn}</div>
      ${sp?`<div class="appt-spec">${esc(sp)}</div>`:''}
      ${a.purpose?`<div class="appt-purpose">${esc(a.purpose)}</div>`:''}
      ${canAct?`<div class="appt-actions">
        <button class="btn btn-outline-crimson btn-sm" onclick="openCancel('${esc(a.id)}')">Cancel</button>
        <button class="btn btn-outline-green btn-sm" onclick="openReschedule('${esc(a.id)}','${esc(a.date)}','${esc(a.time||'')}')">Reschedule</button>
      </div>`:''}
    </div>`;
}

function statusBadge(s){
  const m={
    'Confirmed':['Confirmed','badge b-confirmed'],
    'Upcoming':['Upcoming','badge b-upcoming'],
    'Checked In':['Checked In','badge b-checked'],
    'In Session':['In Session','badge b-session'],
    'Completed':['Completed','badge b-completed'],
    'Cancelled':['Cancelled','badge b-cancelled'],
    'No-Show':['No-Show','badge b-noshow'],
    'Pending':['Pending','badge b-pending'],
  };
  return m[s]||[s,'badge b-completed'];
}

function openCancel(apptId){
  _pendingApptId=apptId;
  showSh(`
    <div class="sh-title">Cancel Appointment</div>
    <p style="font-size:13px;color:var(--muted);margin-bottom:16px">Please provide a reason (optional)</p>
    <div class="form-g"><label>Reason</label><textarea id="cancel-reason" rows="3" placeholder="e.g. Schedule conflict"></textarea></div>
    <div class="sh-actions">
      <button class="btn btn-crimson" onclick="doCancel()">Yes, Cancel Appointment</button>
      <button class="btn btn-outline" onclick="hideSh()">Keep Appointment</button>
    </div>
  `);
}

async function doCancel(){
  const apptId=_pendingApptId;if(!apptId)return;
  const reason=document.getElementById('cancel-reason')?.value||'';
  try{await sbCancelAppointment(apptId,reason);}
  catch(e){toast(e.message||'Cancel failed','err');return;}
  hideSh();allAppts=[];_pendingApptId=null;
  toast('Appointment cancelled','suc');
  try{await loadAppts();}catch(e){}
}

function openReschedule(apptId,curDate,curTime){
  _pendingApptId=apptId;
  showSh(`
    <div class="sh-title">Reschedule Appointment</div>
    <div class="form-g"><label>New Date</label><input type="date" id="rs-date" min="${today()}" value="${esc(curDate)}"></div>
    <div class="form-g"><label>New Time</label><input type="time" id="rs-time" value="${esc(curTime)}"></div>
    <div class="sh-actions">
      <button class="btn btn-green" onclick="doReschedule()">Confirm Reschedule</button>
      <button class="btn btn-outline" onclick="hideSh()">Cancel</button>
    </div>
  `);
}

async function doReschedule(){
  const apptId=_pendingApptId;if(!apptId)return;
  const date=document.getElementById('rs-date')?.value;
  const time=document.getElementById('rs-time')?.value;
  if(!date||!time){toast('Please select date and time','err');return;}
  try{await sbRescheduleAppointment(apptId,date,time);}
  catch(e){toast(e.message||'Reschedule failed','err');return;}
  hideSh();allAppts=[];_pendingApptId=null;
  toast('Appointment rescheduled','suc');
  try{await loadAppts();}catch(e){}
}

// ════════════════════════════════════════════
//  RECORDS TAB
// ════════════════════════════════════════════
async function loadRecords(){
  const wrap=document.getElementById('records-list');
  wrap.innerHTML='<div class="skel card" style="height:70px;margin-bottom:8px"></div><div class="skel card" style="height:70px"></div>';
  try{
    if(!patientRec){patientRec=await sbGetMyPatientRecord(currentUser.id);}
    if(!patientRec){wrap.innerHTML=emptyStateHTML('No records','Your health records will appear here after your first visit');return;}
    const recs=await sbGetEHR(patientRec.id);
    if(!recs||!recs.length){wrap.innerHTML=emptyStateHTML('No health records yet','Your medical records will appear here after your first visit');return;}
    wrap.innerHTML=recs.map((r,i)=>recCardHTML(r,i)).join('');
  }catch(e){wrap.innerHTML=emptyStateHTML('Could not load records','Please try again later');}
}

function recCardHTML(r,idx){
  const dn=r.doctors?'Dr. '+esc(r.doctors.first_name)+' '+esc(r.doctors.last_name):'Unknown Doctor';
  return`
    <div class="rec-card">
      <div class="rec-head" onclick="toggleRec(${idx})">
        <div>
          <div class="rec-date">${esc(fmtLongDate(r.visit_date))}</div>
          <div class="rec-doc">${dn}</div>
          <div class="rec-diag">${esc(r.diagnosis||'Visit Record')}</div>
        </div>
        <svg id="rec-chev-${idx}" class="rec-chev" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="rec-body" id="rec-body-${idx}">
        ${r.diagnosis?`<div class="rec-f"><div class="rec-fl">Diagnosis</div><div class="rec-fv">${esc(r.diagnosis)}</div></div>`:''}
        ${r.notes?`<div class="rec-f"><div class="rec-fl">Notes</div><div class="rec-fv">${esc(r.notes)}</div></div>`:''}
        ${r.follow_up?`<div class="rec-f"><div class="rec-fl">Follow-up</div><div class="rec-fv">${esc(fmtLongDate(r.follow_up))}</div></div>`:''}
      </div>
    </div>`;
}

function toggleRec(idx){
  const body=document.getElementById('rec-body-'+idx);
  const chev=document.getElementById('rec-chev-'+idx);
  const open=body.classList.toggle('open');
  if(chev)chev.style.transform=open?'rotate(180deg)':'';
}

// ════════════════════════════════════════════
//  PROFILE TAB
// ════════════════════════════════════════════
async function loadProfile(){
  const wrap=document.getElementById('profile-body');
  wrap.innerHTML='<div class="skel card" style="height:200px"></div>';
  try{
    if(!patientRec){patientRec=await sbGetMyPatientRecord(currentUser.id);}
    renderProfile(false);
  }catch(e){wrap.innerHTML=emptyStateHTML('Could not load profile','Please try again later');}
}

function renderProfile(editMode){
  const p=patientRec||{};
  const wrap=document.getElementById('profile-body');
  if(!editMode){
    wrap.innerHTML=`
      <div class="prof-section">
        <div class="prof-section-title">
          Personal Info
          <button class="btn btn-outline-green btn-sm" onclick="renderProfile(true)">Edit</button>
        </div>
        ${profRow('Name',(esc(p.first_name)||'')+(p.last_name?' '+esc(p.last_name):''))}
        ${profRow('Email',esc(currentUser.email||''))}
        ${profRow('Phone',esc(p.contact||'—'))}
        ${profRow('Date of Birth',esc(p.dob?fmtLongDate(p.dob):'—'))}
        ${profRow('Sex',esc(p.sex||'—'))}
        ${profRow('Blood Type',esc(p.blood_type||'—'))}
        ${profRow('Allergies',esc(p.allergies||'—'))}
        ${profRow('Address',esc(p.address||'—'))}
      </div>
      <div class="prof-section">
        <div class="pw-section-toggle" onclick="togglePwForm()">
          <span class="prof-section-title" style="margin-bottom:0">Change Password</span>
          <svg id="pw-chev" class="rec-chev" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="pw-form" id="pw-form">
          <div style="height:12px"></div>
          <div class="form-g"><label>Current Password</label><input type="password" id="pw-cur" placeholder="Enter current password" autocomplete="current-password"></div>
          <div class="form-g"><label>New Password</label><div class="pw-wrap"><input type="password" id="pw-new" placeholder="Min. 8 characters" autocomplete="new-password"><button type="button" class="pw-eye" onclick="togglePw('pw-new',this)"><svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div>
          <div class="form-g"><label>Confirm New Password</label><input type="password" id="pw-conf" placeholder="Re-enter new password" autocomplete="new-password"></div>
          <button class="btn btn-green btn-sm" onclick="doChangePw()" style="width:auto;margin-top:4px">Update Password</button>
        </div>
      </div>
      <div class="prof-section" style="padding:4px 0 0">
        <button class="btn btn-outline-crimson" onclick="doLogout()">
          <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          Sign Out
        </button>
      </div>`;
  }else{
    wrap.innerHTML=`
      <div class="prof-section">
        <div class="prof-section-title">Edit Profile</div>
        <div class="form-row">
          <div class="form-g"><label>First Name</label><input type="text" id="ep-fn" value="${esc(p.first_name||'')}"></div>
          <div class="form-g"><label>Last Name</label><input type="text" id="ep-ln" value="${esc(p.last_name||'')}"></div>
        </div>
        <div class="form-g"><label>Phone</label><input type="tel" id="ep-ct" value="${esc(p.contact||'')}"></div>
        <div class="form-g"><label>Date of Birth</label><input type="date" id="ep-dob" value="${esc(p.dob||'')}"></div>
        <div class="form-g"><label>Sex</label>
          <select id="ep-sex">
            <option value="">Select</option>
            ${['Male','Female','Other'].map(s=>`<option${p.sex===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-g"><label>Blood Type</label>
          <select id="ep-bt">
            <option value="">Select</option>
            ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(s=>`<option${p.blood_type===s?' selected':''}>${s}</option>`).join('')}
          </select>
        </div>
        <div class="form-g"><label>Allergies</label><input type="text" id="ep-al" value="${esc(p.allergies||'')}"></div>
        <div class="form-g"><label>Address</label><textarea id="ep-addr" rows="2">${esc(p.address||'')}</textarea></div>
        <div style="display:flex;gap:9px;margin-top:6px">
          <button class="btn btn-green" onclick="saveProfile()">Save Changes</button>
          <button class="btn btn-outline" onclick="renderProfile(false)">Cancel</button>
        </div>
      </div>`;
  }
}

function profRow(label,value){
  return`<div class="prof-field"><span class="pfl">${esc(label)}</span><span class="pfv">${value||'—'}</span></div>`;
}

function togglePwForm(){
  const f=document.getElementById('pw-form');
  const c=document.getElementById('pw-chev');
  const open=f.classList.toggle('open');
  if(c)c.style.transform=open?'rotate(180deg)':'';
}

async function saveProfile(){
  if(!patientRec){toast('Profile not loaded','err');return;}
  const updates={
    first_name:document.getElementById('ep-fn')?.value.trim(),
    last_name:document.getElementById('ep-ln')?.value.trim(),
    contact:document.getElementById('ep-ct')?.value.trim(),
    dob:document.getElementById('ep-dob')?.value||null,
    sex:document.getElementById('ep-sex')?.value||null,
    blood_type:document.getElementById('ep-bt')?.value||null,
    allergies:document.getElementById('ep-al')?.value.trim()||null,
    address:document.getElementById('ep-addr')?.value.trim()||null,
  };
  try{
    await sbUpdatePatient(patientRec.id,updates);
    patientRec={...patientRec,...updates};
    // Update greeting
    if(updates.first_name){document.getElementById('greet-name').textContent='Hello, '+esc(updates.first_name)+'!';}
    toast('Profile updated','suc');
    renderProfile(false);
  }catch(e){toast(e.message||'Update failed','err');}
}

async function doChangePw(){
  const cur=document.getElementById('pw-cur')?.value;
  const pw=document.getElementById('pw-new')?.value;
  const pw2=document.getElementById('pw-conf')?.value;
  if(!cur){toast('Enter your current password','err');return;}
  if(!pw||pw.length<8){toast('New password must be at least 8 characters','err');return;}
  if(pw!==pw2){toast('Passwords do not match','err');return;}
  try{
    await sbLogin(currentUser.email,cur);
    await sbUpdatePassword(pw);
    toast('Password updated','suc');
    document.getElementById('pw-cur').value='';
    document.getElementById('pw-new').value='';
    document.getElementById('pw-conf').value='';
    togglePwForm();
  }catch(e){toast(e.message||'Update failed','err');}
}

// ════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════
function emptyStateHTML(title,sub){
  return`<div class="empty-state">
    <svg width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    <h4>${esc(title)}</h4>
    <p>${esc(sub)}</p>
  </div>`;
}
