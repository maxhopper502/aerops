import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import{getFirestore,collection,getDocs,doc,updateDoc,getDoc,onSnapshot}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const db=getFirestore(initializeApp({
  apiKey:"AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI",
  authDomain:"aerotech-ops.firebaseapp.com",projectId:"aerotech-ops",
  storageBucket:"aerotech-ops.firebasestorage.app",messagingSenderId:"645848371961",
  appId:"1:645848371961:web:4415c4d7623219fd31c828"
}));

/* ── Config ──────────────────────────────── */
// Defaults — overwritten by Firestore settings on login
const PINS={
  'Adam Sullivan':'1234','Henry Trealor':'2345',
  'Michael Crettenden':'3456','Hayden Noles':'4567',
  'Danny Allen':'5678','Andrew Paltridge':'6789'
};
let PILOTS=Object.keys(PINS);

// Mixers loaded from Firestore settings (fallback to defaults)
let MIXERS=['Ben Simcock','Robert Proud','Amber Meyers','Shaun Dempsey','Adam Sullivan','Will Piip','Craig Dawson'];

// Load settings from Firestore to get live pilot PINs + mixer list
// Called early (before login) so pilot list is up to date
async function loadSettingsOnce(){
  try{
    const snap=await getDoc(doc(db,'config','settings'));
    if(snap.exists()){
      const d=snap.data();
      if(d.pilotObjs&&d.pilotObjs.length){
        d.pilotObjs.forEach(p=>{if(p.name&&p.pin) PINS[p.name]=String(p.pin);});
        PILOTS=d.pilotObjs.map(p=>p.name).filter(Boolean);
        window._pilotList=PILOTS;
        window._pilotPins=Object.fromEntries(d.pilotObjs.map(p=>[p.name,String(p.pin)]));
      }
      if(d.mixers&&d.mixers.length) MIXERS=d.mixers;
      else if(d.mixerObjs&&d.mixerObjs.length) MIXERS=d.mixerObjs.map(m=>m.name).filter(Boolean);
      // Re-render pilot grid with live names
      if(typeof window.renderPilotBtns==='function') window.renderPilotBtns();
    }
  }catch(e){console.warn('loadSettingsOnce:',e);}
}

// Load settings immediately at module startup (not just after login)
loadSettingsOnce();
const COORDS={
  'Cummins':{lat:-34.27,lon:135.72},"Trelour's":{lat:-34.10,lon:135.55},
  "Smithy's":{lat:-34.15,lon:135.60},'Karkoo':{lat:-33.95,lon:135.45},
  'Heymans':{lat:-34.30,lon:135.80},"Rob Mac's":{lat:-34.20,lon:135.65},
  "Fitzy's":{lat:-34.05,lon:135.70},'Modras':{lat:-34.35,lon:135.50},
  _default:{lat:-34.27,lon:135.72}
};

/* ── State ───────────────────────────────── */
let pilot=localStorage.getItem('at_pilot')||null;
let jobId=null;
let jobs=[];
let wx=null;
let pin='';
let pinName='';

/* ── Utils ───────────────────────────────── */
const $=id=>document.getElementById(id);
function toast(m,d=2200){const t=$('toast');t.textContent=m;t.style.display='block';setTimeout(()=>t.style.display='none',d);}
function today(){return new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Adelaide'});}
function nowT(){return new Date().toLocaleTimeString('en-AU',{timeZone:'Australia/Adelaide',hour:'2-digit',minute:'2-digit',hour12:false});}
function fmtD(d){if(!d)return'—';const dt=new Date(d+'T00:00:00');return dt.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});}
function dT(t,r){return Math.round(((100-r)/5)*10)/10;}
function d2c(d){return['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'][Math.round(d/22.5)%16];}
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));$(id).classList.add('active');window.scrollTo(0,0);}

/* ── Login ───────────────────────────────── */
function buildGrid(){
  const el = $('pgrid');
  if(!el){ setTimeout(buildGrid, 100); return; }
  // Use live PILOTS from Firestore (set by loadSettingsOnce), fallback to all defaults
  const list = PILOTS.length ? PILOTS : Object.keys(PINS);
  el.innerHTML = list.map(p=>{
    const parts = p.split(' ');
    const first = parts[0];
    const rest  = parts.slice(1).join(' ');
    return '<button class="pbtn" onclick="window.selPilot(\''+p+'\')">'+first+'<br><span style="font-size:.75rem;font-weight:400;opacity:.7">'+rest+'</span></button>';
  }).join('');
}
// Called by loadSettingsOnce after Firestore load to refresh the grid with live names
window.renderPilotBtns = buildGrid;

function selPilot(name){
  pinName=name; pin='';
  document.querySelectorAll('.pbtn').forEach(b=>b.classList.remove('sel'));
  [...document.querySelectorAll('.pbtn')].find(b=>b.textContent.trim().startsWith(name.split(' ')[0]))?.classList.add('sel');
  $('pinsec').style.display='block';
  $('pinfor').textContent='PIN for '+name.split(' ')[0];
  $('perr').textContent='';
  dots();
}

function pt(d){if(pin.length>=4)return;pin+=d;dots();if(pin.length===4)chkPin();}
function pc(a=false){pin=a?'':pin.slice(0,-1);dots();}
function dots(){for(let i=0;i<4;i++)$('p'+i).classList.toggle('on',i<pin.length);}

function chkPin(){
  if(PINS[pinName]===pin){
    pilot=pinName; localStorage.setItem('at_pilot',pilot);
    $('perr').textContent=''; onLogin();
  } else {
    $('perr').textContent='Incorrect PIN — try again';
    pin=''; dots();
  }
}

function onLogin(){
  $('hsub').textContent=pilot;
  $('chip').textContent=pilot.split(' ')[0]+' ✕';
  $('chip').style.display='block';
  loadJobs();
}

function signOut(){
  if(!confirm('Sign out of '+pilot+'?'))return;
  pilot=null; localStorage.removeItem('at_pilot');
  $('chip').style.display='none'; $('hsub').textContent='Sign in to continue';
  pin=''; pinName=''; $('pinsec').style.display='none';
  document.querySelectorAll('.pbtn').forEach(b=>b.classList.remove('sel'));
  dots(); go('s-login');
}

function selAllJobs(){
  pilot='__all__'; localStorage.removeItem('at_pilot');
  onLogin();
}

/* ── Load Jobs ───────────────────────────── */
async function loadJobs(){
  go('s-jobs'); const td=today();
  $('dtlbl').textContent=fmtD(td);
  const isAll = pilot==='__all__';
  $('aclbl').textContent=isAll?'All Pilots — Today':'Loading…';
  $('jlist').innerHTML='<div style="text-align:center;padding:48px;color:var(--muted)"><div class="spin"></div><div style="margin-top:14px">Loading jobs…</div></div>';
  try{
    const snap=await getDocs(collection(db,'jobs'));
    const all=snap.docs.map(d=>({id:d.id,...d.data()}));
    jobs=all.filter(j=>{
      const jDate=(j.schedule?.scheduledDate||j.preferredDate);
      if(jDate!==td) return false;
      if(['complete','invoiced'].includes(j.status)) return false;
      if(isAll) return true;
      return j.schedule?.pilot===pilot;
    }).sort((a,b)=>(a.schedule?.estStart||a.schedule?.startTime||'23:59').localeCompare(b.schedule?.estStart||b.schedule?.startTime||'23:59'));
    if(!isAll){
      const ac=[...new Set(jobs.map(j=>j.schedule?.aircraft).filter(Boolean))].join(', ');
      $('aclbl').textContent=ac?'Flying: '+ac:pilot;
    } else {
      $('aclbl').textContent='All Pilots — '+jobs.length+' job'+(jobs.length!==1?'s':'');
    }
    $('jcnt').textContent=jobs.length;
    renderJobs();
  }catch(e){
    $('jlist').innerHTML='<div class="nojobs"><div style="font-size:2.5rem">⚠️</div><div style="margin-top:12px">Could not load jobs.<br>Check your connection.</div></div>';
  }
}

function renderJobs(){
  if(!jobs.length){
    $('jlist').innerHTML='<div class="nojobs"><div style="font-size:2.5rem;margin-bottom:12px">🌤️</div><div style="font-size:1rem;font-weight:600;color:var(--navy);margin-bottom:6px">No jobs scheduled today</div><div>Contact the office if you were expecting work.</div></div>';
    return;
  }
  $('jlist').innerHTML=jobs.map((j,i)=>{
    const ha=(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
    const pr=(j.products||[]).map(p=>p.name||p.type).filter(Boolean).join(', ');
    const hz=j.hazards?.powerlines==='yes'||j.hazards?.susceptibleCrops==='yes';
    const hasSessForBadge=j.completion?.tachoSessions?.length>0;
    const isActiveFlight=hasSessForBadge&&j.completion.tachoSessions.some(s=>s.startTacho&&!s.stopTacho);
    const isPausedFlight=hasSessForBadge&&!isActiveFlight;
    const badge=j.status==='in_progress'&&isActiveFlight?'<span class="sbadge sb-prog">▶ Flying</span>'
      :j.status==='in_progress'&&isPausedFlight?'<span class="sbadge" style="background:#7c3aed;color:#fff">⏸ Paused</span>'
      :j.status==='in_progress'?'<span class="sbadge sb-prog">▶ In Progress</span>'
      :j.status==='pilot_complete'?'<span class="sbadge sb-done">✅ Done</span>'
      :'<span class="sbadge sb-sched">Scheduled</span>';
    const hasSessions=j.completion?.tachoSessions?.length>0;
    const hasOpenSess=hasSessions&&j.completion.tachoSessions.some(s=>s.startTacho&&!s.stopTacho);
    const cardAction=j.status==='pilot_complete'?`goDetail('${j.id}')`
      :(j.status==='in_progress'&&hasOpenSess?`goRunning_for('${j.id}')`
      :(j.status==='in_progress'&&hasSessions?`goResume('${j.id}')`
      :`goDetail('${j.id}')`));
    const isHerb_c = j.appSubType==='Herbicide' || (!j.appSubType && (j.products||[])[0]?.type==='Herbicide') || j.herbOverride==='on';
    return `<div class="jcard s-${j.status}" onclick="${cardAction}" style="${isHerb_c?'background:#fee2e2;border-left:4px solid #dc2626;':''}">
      <div class="jnum">Job ${i+1} of ${jobs.length}${j.schedule?.estStart?` · 🕐 Est. ${j.schedule.estStart}`:j.schedule?.startTime?' · '+j.schedule.startTime:''}</div>
      <div class="jname">${j.clientName||'Unnamed Job'}</div>
      <div style="margin-top:3px;font-size:.8rem;color:var(--muted)">${[j.airstrip,j.farmAddress].filter(Boolean).join(' · ')}</div>
      ${j.schedule?.mixer?`<div style="margin-top:4px;font-size:.78rem;font-weight:600;color:#2563eb">🧪 Mixer: ${j.schedule.mixer.split(' ')[0]} ${j.schedule.mixer.split(' ')[1]||''}</div>`:'<div style="margin-top:4px;font-size:.78rem;color:#9ca3af">🧪 No mixer assigned</div>'}
      <div class="jtags" style="margin-top:8px">
        ${badge}
        ${ha>0?`<span class="tag b">🌾 ${ha.toFixed(0)} ha</span>`:''}
        ${pr?`<span class="tag">🧪 ${pr}</span>`:''}
        ${hz?`<span class="tag w">⚠️ Hazards</span>`:''}
        ${j.additionalHazards?`<span class="tag w">⚠️ Extra Hazards</span>`:''}
        ${j.jobNotes?`<span class="tag b">📋 Notes</span>`:''}
      </div></div>`;
  }).join('');
}

/* ── Job Detail ──────────────────────────── */
/* ── Load Calculator (mirrors AeroOps estimateJob logic) ── */
const AIRCRAFT_502=['VH-ODG','VH-A54'];

function calcLoads(j){
  const SPREAD_TYPES=['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
  const spread=(j.products||[]).some(p=>SPREAD_TYPES.includes(p.type));
  const totalHa=(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
  const is502=AIRCRAFT_502.includes(j.schedule?.aircraft||'');

  // Hopper capacity by product type
  const caps={'Urea':2000,'Fertiliser':2400,'Snail Bait':2000,'Mouse Bait':1200,'Seed':2000,'Spray':3020};
  let hopper;
  if(spread){
    const pp=(j.products||[]).find(p=>SPREAD_TYPES.includes(p.type));
    hopper=parseFloat(j.hopperOverride)||(pp?caps[pp.type]||2000:2000);
  } else {
    hopper=parseFloat(j.hopperOverride)||caps['Spray'];
  }
  const waterRate=parseFloat(j.waterRate)||30;
  const appRate=spread?(j.products||[]).reduce((s,p)=>s+(parseFloat(p.rate)||0),0)||1:waterRate;
  const totalUnits=totalHa*appRate;
  const loads=Math.max(1,Math.ceil(totalUnits/hopper));
  const perLoad=totalUnits/loads;
  const unit=spread?'kg':'L';

  // Calculate default swath — split by aircraft type
  let swathM=0;
  if(j.swathOverride){
    swathM=parseFloat(j.swathOverride);
  } else if(spread){
    const pp=(j.products||[]).find(p=>SPREAD_TYPES.includes(p.type));
    const pt=pp?.type||'';
    if(pt==='Snail Bait')       swathM=35;          // same both aircraft
    else if(pt==='Mouse Bait')  swathM=50;          // same both aircraft
    else if(pt==='Seed')        swathM=is502?20:20; // TBD for 502, same for now
    else if(pt==='Fertiliser')  swathM=is502?22:28;
    else if(pt==='Urea'){
      if(is502){
        // AT-502 Urea swath table (confirmed)
        const r=parseFloat(pp?.rate)||0;
        swathM=r<=50?26:r<=75?24:r<=100?22:r<=125?20:r<=150?18:16;
      } else {
        // AT-802 Urea swath table
        const r=parseFloat(pp?.rate)||0;
        swathM=r<=50?30:r<=75?28:r<=100?26:r<=125?24:r<=150?22:20;
      }
    } else swathM=is502?22:28;
  } else {
    // Spray swaths — AT-502 vs AT-802
    const pp=(j.products||[]).find(p=>!SPREAD_TYPES.includes(p.type));
    const pt=pp?.type||'';
    if(is502){
      swathM=pt==='Misting'?35:pt==='Herbicide'?20:24;
    } else {
      swathM=pt==='Misting'?40:pt==='Herbicide'?24:28;
    }
  }

  return{spread,loads,hopper,totalUnits,perLoad,unit,totalHa,appRate,swathM,is502};
}

function goDetail(id){
  if(id) jobId=id;
  window._jobAcked=false; // reset acknowledgement for each new job view
  const j=jobs.find(j=>j.id===jobId); if(!j)return;
  // Completed job → show detail with Edit Record button
  // In-progress job: only fast-path to running screen if actively flying (has open session)
  if(j.status==="in_progress"&&j.completion?.vdoStart){
    const sessions=j.completion?.tachoSessions||[];
    const hasOpenSess=sessions.some(s=>s.startTacho&&!s.stopTacho);
    if(hasOpenSess){ goRunning(); return; }
    // If paused (all sessions closed), fall through to show detail page with Resume button
  }
  go('s-detail');
  const h=j.hazards||{};
  const hz=h.powerlines==='yes'||h.susceptibleCrops==='yes'||h.neighboursConcern==='yes'||h.dwelling==='yes';
  const pRows=(j.paddocks||[]).filter(p=>p.name||p.ha).map(p=>
    `<tr><td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-weight:600">${p.name||'—'}</td>
     <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;text-align:right">${p.ha||0} ha</td>
     <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;color:var(--muted);text-align:right">${p.cropType||'—'}</td></tr>`).join('');
  const ld=calcLoads(j);
  const isHerbJob=j.appSubType==='Herbicide'||(!j.appSubType&&(j.products||[])[0]?.type==='Herbicide')||j.herbOverride==='on';
  const prRows=(j.products||[]).filter(p=>p.name).map(p=>{
    const rate=parseFloat(p.rate)||0;
    const totalQty=rate*ld.totalHa;
    const loadQty=ld.loads>0?totalQty/ld.loads:0;
    const pu=p.unit||'';
    return `<tr>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-weight:700">${p.name}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;color:var(--muted);font-size:.78rem">${p.type||'—'}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-weight:600;text-align:right">${rate} ${pu}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-weight:800;text-align:right;color:var(--blue)">${loadQty.toFixed(1)} ${pu}</td>
      <td style="padding:8px 6px;border-bottom:1px solid #f0f0f0;font-weight:800;text-align:right;color:var(--navy)">${totalQty.toFixed(1)} ${pu}</td>
    </tr>`;
  }).join('');

  $('dbody').innerHTML=`
    ${hz?`<div style="background:#fee2e2;border:2px solid #f87171;border-radius:var(--r);padding:16px 18px;margin-bottom:12px">
      <div style="font-size:1rem;font-weight:700;color:#991b1b;margin-bottom:8px">⚠️ HAZARD ALERT — READ BEFORE FLYING</div>
      ${h.powerlines==='yes'?`<div style="font-size:.85rem;color:#7f1d1d;margin-bottom:4px">⚡ Power lines${h.powerlinesDesc?' — '+h.powerlinesDesc:''}</div>`:''}
      ${h.susceptibleCrops==='yes'?`<div style="font-size:.85rem;color:#7f1d1d;margin-bottom:4px">🌿 Susceptible crops${h.susceptibleDesc?' — '+h.susceptibleDesc:''}</div>`:''}
      ${h.neighboursConcern==='yes'?`<div style="font-size:.85rem;color:#7f1d1d;margin-bottom:4px">🏠 Neighbours of concern${h.neighboursDesc?' — '+h.neighboursDesc:''}</div>`:''}
      ${h.dwelling==='yes'?`<div style="font-size:.85rem;color:#7f1d1d">🏡 Within 150m of dwelling</div>`:''}
    </div>`:''}
    ${j.additionalHazards?`<div style="background:#fff7ed;border:2px solid #f59e0b;border-radius:var(--r);padding:16px 18px;margin-bottom:12px">
      <div style="font-size:1rem;font-weight:700;color:#92400e;margin-bottom:8px">⚠️ ADDITIONAL HAZARDS / OBSTACLES</div>
      <div style="font-size:.9rem;color:#78350f;white-space:pre-wrap;line-height:1.5">${j.additionalHazards}</div>
    </div>`:''}
    ${j.jobNotes?`<div style="background:#eff6ff;border:2px solid #93c5fd;border-radius:var(--r);padding:14px 16px;margin-bottom:12px">
      <div style="font-size:.85rem;font-weight:700;color:#1e40af;margin-bottom:6px">📋 JOB NOTES</div>
      <div style="font-size:.88rem;color:#1e3a8a;white-space:pre-wrap;line-height:1.5">${j.jobNotes}</div>
    </div>`:''}
    ${(hz||j.additionalHazards||j.jobNotes)?`<div id="ack-box" style="background:#f0fdf4;border:2px solid #4ade80;border-radius:var(--r);padding:14px 16px;margin-bottom:12px">
      <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer">
        <input type="checkbox" id="ack-chk" onchange="ackChanged('${j.id}')" style="width:24px;height:24px;min-width:24px;margin-top:2px;cursor:pointer;accent-color:#16a34a"/>
        <span style="font-size:.9rem;font-weight:700;color:#166534;line-height:1.4">I have read and acknowledge all job notes, hazards and obstacles listed above, and confirm I am ready to begin this job safely.</span>
      </label>
    </div>`:''}
    <div class="dcard">
      <h3>Job Details</h3>
      <div class="irow"><div class="ilbl">Client</div><div class="ival">${j.clientName||'—'}</div></div>
      <div class="irow"><div class="ilbl">Farm</div><div class="ival">${j.farmAddress||'—'}</div></div>
      ${j.schedule?.estStart?`<div class="irow"><div class="ilbl" style="color:#1d4ed8;font-weight:700">🕐 Est. Start</div><div class="ival" style="font-weight:800;font-size:1.1rem;color:#1d4ed8">${j.schedule.estStart}</div></div>`:''}
      <div class="irow"><div class="ilbl">Airstrip</div><div class="ival">${j.airstrip||'—'}</div></div>
      <div class="irow"><div class="ilbl">Aircraft</div><div class="ival">${j.schedule?.aircraft||'—'}</div></div>
      <div class="irow"><div class="ilbl">Mixer</div><div class="ival" style="display:flex;align-items:center;gap:8px">
        <select id="mixer-sel" onchange="changeMixer('${j.id}',this.value)" style="padding:5px 8px;border:1.5px solid #d1d5db;border-radius:8px;font-size:.85rem;font-weight:600;color:#1e3a5f;flex:1">
          <option value="">— None —</option>
          ${MIXERS.map(m=>`<option value="${m}" ${(j.schedule?.mixer||'')==m?'selected':''}>${m}</option>`).join('')}
        </select>
      </div></div>
      <div class="irow"><div class="ilbl">Total Area</div><div class="ival">${(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0).toFixed(1)} ha</div></div>
      <div class="irow"><div class="ilbl">Wind Required</div><div class="ival">${j.windDirectionRequired||'Any'}</div></div>
      ${j.waterRate?`<div class="irow"><div class="ilbl">Water Rate</div><div class="ival">${j.waterRate} L/ha</div></div>`:''}
      ${j.additionalComments?`<div style="margin-top:12px;padding:10px;background:#f8f9fa;border-radius:8px;font-size:.83rem"><strong>Notes:</strong> ${j.additionalComments}</div>`:''}
    </div>
    ${(()=>{
      if(!ld.totalHa) return '';
      return `<div style="background:linear-gradient(135deg,#1a3a5c,#2563eb);color:#fff;border-radius:var(--r);padding:18px;margin-bottom:12px">
        <div style="font-size:.7rem;text-transform:uppercase;letter-spacing:.5px;opacity:.7;margin-bottom:12px">🪣 Load Plan</div>

        <!-- Top row: totals -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center;padding-bottom:12px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.2)">
          <div>
            <div style="font-size:1.8rem;font-weight:900;line-height:1">${ld.totalHa.toFixed(0)}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">ha total</div>
          </div>
          <div>
            <div style="font-size:1.8rem;font-weight:900;line-height:1">${ld.appRate}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">${ld.unit}/ha</div>
          </div>
          <div>
            <div style="font-size:1.8rem;font-weight:900;line-height:1">${ld.totalUnits.toFixed(0)}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">${ld.unit} total</div>
          </div>
        </div>

        <!-- Bottom row: per load -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
          <div>
            <div style="font-size:2.8rem;font-weight:900;line-height:1;color:#fbbf24">${ld.loads}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">loads</div>
          </div>
          <div>
            <div style="font-size:1.8rem;font-weight:900;line-height:1">${(ld.totalHa/ld.loads).toFixed(0)}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">ha/load</div>
          </div>
          <div>
            <div style="font-size:1.8rem;font-weight:900;line-height:1">${ld.perLoad.toFixed(0)}</div>
            <div style="font-size:.72rem;font-weight:700;opacity:.8;margin-top:4px;text-transform:uppercase;letter-spacing:.5px">${ld.unit}/load</div>
          </div>
        </div>

        <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.2);font-size:.72rem;opacity:.65">
          Hopper: ${ld.hopper.toFixed(0)} ${ld.unit} · ${ld.spread?'Spread':'Spray'}${j.hopperOverride?' (override)':' (default)'}
        </div>
      </div>`;
    })()}
    ${pRows?`<div class="dcard"><h3>Paddocks</h3><table style="width:100%;border-collapse:collapse;font-size:.85rem">
      <thead><tr>
        <th style="text-align:left;padding:5px 6px;font-size:.7rem;color:var(--muted);border-bottom:2px solid var(--border)">Name</th>
        <th style="text-align:right;padding:5px 6px;font-size:.7rem;color:var(--muted);border-bottom:2px solid var(--border)">Ha</th>
        <th style="text-align:right;padding:5px 6px;font-size:.7rem;color:var(--muted);border-bottom:2px solid var(--border)">Crop</th>
      </tr></thead><tbody>${pRows}</tbody></table></div>`:''}
    ${prRows?`<div class="dcard" style="${isHerbJob?'background:#fff0f0':''}"><h3 style="${isHerbJob?'color:#dc2626':''}">🌿 Products (Herbicide)</h3><table style="width:100%;border-collapse:collapse;font-size:.82rem">
      <thead><tr>
        <th style="text-align:left;padding:5px 6px;font-size:.68rem;color:var(--muted);border-bottom:2px solid var(--border)">Product</th>
        <th style="text-align:left;padding:5px 6px;font-size:.68rem;color:var(--muted);border-bottom:2px solid var(--border)">Type</th>
        <th style="text-align:right;padding:5px 6px;font-size:.68rem;color:var(--muted);border-bottom:2px solid var(--border)">Rate</th>
        <th style="text-align:right;padding:5px 6px;font-size:.68rem;color:var(--blue);border-bottom:2px solid var(--border)">Per Load</th>
        <th style="text-align:right;padding:5px 6px;font-size:.68rem;color:var(--navy);border-bottom:2px solid var(--border)">Total</th>
      </tr></thead><tbody>${prRows}</tbody></table></div>`:''}
    <div class="dcard">
      <h3>Hazards Checklist</h3>
      <div class="hrow"><div class="hico">⚡</div><div class="htxt"><div class="hlbl">Power Lines</div>${h.powerlinesDesc?`<div class="hdsc">${h.powerlinesDesc}</div>`:""}</div><div class="hbadge ${h.powerlines==="yes"?"hyes":"hno"}">${h.powerlines==="yes"?"YES":"No"}</div></div>
      <div class="hrow"><div class="hico">🌿</div><div class="htxt"><div class="hlbl">Susceptible Crops</div>${h.susceptibleDesc?`<div class="hdsc">${h.susceptibleDesc}</div>`:""}</div><div class="hbadge ${h.susceptibleCrops==="yes"?"hyes":"hno"}">${h.susceptibleCrops==="yes"?"YES":"No"}</div></div>
      <div class="hrow"><div class="hico">🏡</div><div class="htxt"><div class="hlbl">Within 150m Dwelling</div></div><div class="hbadge ${h.dwelling==="yes"?"hyes":"hno"}">${h.dwelling==="yes"?"YES":"No"}</div></div>
      <div class="hrow"><div class="hico">🏠</div><div class="htxt"><div class="hlbl">Neighbours Notified</div>${h.neighboursDesc?`<div class="hdsc">${h.neighboursDesc}</div>`:""}</div><div class="hbadge ${h.neighboursNotified==="yes"?"hno":"hyes"}">${h.neighboursNotified==="yes"?"Yes":"NO"}</div></div>
      <div class="hrow"><div class="hico">🗺️</div><div class="htxt"><div class="hlbl">Map Provided</div></div><div class="hbadge ${j.mapUploaded==="yes"?"hno":"hyes"}">${j.mapUploaded==="yes"?"Yes":"NO"}</div></div>
    </div>
    <div style="height:80px"></div>`;

  const done=j.status==="pilot_complete";
  const going=j.status==="in_progress";
  const sessions=j.completion?.tachoSessions||[];
  const hasOpenSession=sessions.some(s=>s.startTacho&&!s.stopTacho);
  const isPaused=going&&sessions.length>0&&!hasOpenSession;
  const neverStarted=going&&sessions.length===0;
  $("dbar2").innerHTML=done
    ?`<button class="btn btn-gh" style="flex:none;padding:14px 20px" onclick="goJobs()">← Jobs</button><button class="btn btn-n" onclick="goComplete()">✏️ Edit Record</button>`
    :isPaused
    ?`<button class="btn btn-gh" style="flex:none;padding:14px 20px" onclick="goJobs()">← Jobs</button><button class="btn btn-o" onclick="startJob()" style="flex:1">▶️ Resume</button><button class="btn btn-g" onclick="goComplete()" style="flex:1">✅ Complete</button>`
    :(going&&!neverStarted)
    ?`<button class="btn btn-gh" style="flex:none;padding:14px 20px" onclick="goJobs()">← Jobs</button><button class="btn btn-g" onclick="goRunning()">✅ Complete Job</button>`
    :`<button class="btn btn-gh" style="flex:none;padding:14px 20px" onclick="goJobs()">← Jobs</button><button class="btn btn-o" id="start-btn" onclick="startJob()">▶️ Start Job</button>`;
}

// Called when pilot ticks the acknowledgement checkbox
function ackChanged(jobId){
  const chk=document.getElementById('ack-chk');
  window._jobAcked=chk&&chk.checked;
}
window.ackChanged=ackChanged;
var _startTacho = '';
function snt(k){ if(k==='.'&&_startTacho.includes('.'))return; _startTacho+=k; document.getElementById('start-tacho-disp').textContent=_startTacho||'—'; }
function snb(){ _startTacho=_startTacho.slice(0,-1); document.getElementById('start-tacho-disp').textContent=_startTacho||'—'; }
window.snt=snt; window.snb=snb; window._closeStartOverlay=function(){var o=document.getElementById("start-overlay");if(o)o.remove();}; window._stampStartTime=function(){var e=document.getElementById("start-time-inp");if(e)e.value=nowT();};

function startJob(){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  // Check acknowledgement required
  const h=j.hazards||{};
  const needsAck=j.additionalHazards||j.jobNotes||h.powerlines==='yes'||h.susceptibleCrops==='yes'||h.neighboursConcern==='yes'||h.dwelling==='yes';
  if(needsAck&&!window._jobAcked){
    toast('⚠️ Please tick the acknowledgement checkbox before starting.',4000);
    const chk=document.getElementById('ack-chk');
    if(chk){ chk.style.outline='3px solid #ef4444'; setTimeout(()=>{chk.style.outline='';},2000); }
    return;
  }
  // Pre-fill from last stop tacho
  _startTacho = localStorage.getItem('at_lastStopTacho')||'';
  const startTime = localStorage.getItem('at_lastStopTime')||'';
  const overlay=document.createElement('div');
  overlay.id='start-overlay';
  overlay.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;display:flex;align-items:flex-end;justify-content:center;';
  overlay.innerHTML=
    '<div style="background:#fff;border-radius:18px 18px 0 0;padding:20px 20px 34px;width:100%;max-width:420px;box-sizing:border-box">'+
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'+
    '<div><div style="font-size:1.1rem;font-weight:900;color:#1a3a5c">▶️ Start Job</div>'+
    '<div style="font-size:.75rem;color:#6b7280">'+j.clientName+' · '+(j.airstrip||'')+'</div></div>'+
    '<button onclick="window._closeStartOverlay()" style="background:#f3f4f6;border:none;border-radius:50%;width:34px;height:34px;font-size:1.1rem;cursor:pointer">✕</button></div>'+
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;background:#f8fafc;border-radius:10px;padding:10px 14px">'+
    '<div style="font-size:.72rem;font-weight:700;color:#374151;flex-shrink:0">Start Time</div>'+
    '<input id="start-time-inp" type="time" value="'+(startTime||'')+'" style="flex:1;border:none;background:transparent;font-size:1rem;font-weight:800;color:#1a3a5c;text-align:right"/>'+
    '<button onclick="window._stampStartTime()" style="background:#1a3a5c;color:#fff;border:none;border-radius:8px;padding:5px 10px;font-size:.72rem;font-weight:700;cursor:pointer">Now</button></div>'+
    '<div style="text-align:center;margin-bottom:10px">'+
    '<div style="font-size:.6rem;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Start Tacho</div>'+
    '<div id="start-tacho-disp" style="font-size:2rem;font-weight:900;font-family:monospace;color:#1a3a5c;letter-spacing:2px;min-height:44px">'+(_startTacho||'—')+'</div></div>'+
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">'+
    '<button class="pnbtn" data-v="1" onclick="snt(this.dataset.v)">1</button><button class="pnbtn" data-v="2" onclick="snt(this.dataset.v)">2</button><button class="pnbtn" data-v="3" onclick="snt(this.dataset.v)">3</button>'+
    '<button class="pnbtn" data-v="4" onclick="snt(this.dataset.v)">4</button><button class="pnbtn" data-v="5" onclick="snt(this.dataset.v)">5</button><button class="pnbtn" data-v="6" onclick="snt(this.dataset.v)">6</button>'+
    '<button class="pnbtn" data-v="7" onclick="snt(this.dataset.v)">7</button><button class="pnbtn" data-v="8" onclick="snt(this.dataset.v)">8</button><button class="pnbtn" data-v="9" onclick="snt(this.dataset.v)">9</button>'+
    '<button class="pnbtn" data-v="." onclick="snt(this.dataset.v)">.</button><button class="pnbtn" data-v="0" onclick="snt(this.dataset.v)">0</button><button class="pnbtn" onclick="snb()">⌫</button></div>'+
    '<div style="display:flex;gap:10px">'+
    '<button onclick="window._closeStartOverlay()" style="flex:1;padding:14px;border:2px solid #e5e7eb;border-radius:12px;font-weight:700;background:#f9fafb;cursor:pointer">Cancel</button>'+
    '<button onclick="confirmStart()" style="flex:2;padding:14px;border:none;border-radius:12px;font-weight:800;background:#e67e22;color:#fff;cursor:pointer">▶️ Start Flying</button>'+
    '</div></div>';
  document.body.appendChild(overlay);
}

async function confirmStart(){
  const vdoVal = _startTacho.trim();
  const startT = document.getElementById('start-time-inp')?.value || nowT();
  document.getElementById('start-overlay')?.remove();
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const alreadyStarted=j.status==="in_progress";
  j.completion=j.completion||{};
  j.completion.date=j.completion.date||today();
  j.completion.pilot=j.completion.pilot||pilot;
  j.completion.aircraft=j.completion.aircraft||j.schedule?.aircraft||'';
  j.completion.mixer=j.completion.mixer||j.schedule?.mixer||'';
  // Record this session start
  if(!j.completion.tachoSessions) j.completion.tachoSessions=[];
  j.completion.tachoSessions.push({startTacho:vdoVal, startTime:startT, stopTacho:'', stopTime:''});
  // vdoStart = first session start tacho; takeoffTime = first session start time
  j.completion.vdoStart = j.completion.tachoSessions[0].startTacho;
  j.completion.takeoffTime = j.completion.tachoSessions[0].startTime;
  // Clear landing time — will be set on job completion
  j.completion.landingTime='';
  if(!alreadyStarted){
    j.status="in_progress";
    wx=await getCoordAndFetchWx(j);
    if(wx){j.completion.weather=wx;toast("🌤️ Weather loaded");}
    else toast("Weather unavailable — enter manually");
  }
  try{await updateDoc(doc(db,"jobs",jobId),{status:"in_progress",completion:j.completion});}catch(e){console.warn(e);}
  renderJobs();
  goRunning(); // go to live load plan screen
}

/* ── Weather ─────────────────────────────── */
/* ── GPS + Weather ───────────────────────── */
function getGPS(timeoutMs=8000){
  return new Promise((resolve)=>{
    if(!navigator.geolocation){resolve(null);return;}
    const t=setTimeout(()=>resolve(null),timeoutMs);
    navigator.geolocation.getCurrentPosition(
      pos=>{clearTimeout(t);resolve({lat:pos.coords.latitude,lon:pos.coords.longitude});},
      ()=>{clearTimeout(t);resolve(null);},
      {enableHighAccuracy:false,timeout:timeoutMs,maximumAge:120000}
    );
  });
}

async function fetchWx(lat,lon){
  try{
    const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto`);
    const d=await r.json(); const c=d.current;
    const t=Math.round(c.temperature_2m*10)/10;
    const rh=Math.round(c.relative_humidity_2m);
    return{tempC:t,rh,windSpeed:Math.round(c.wind_speed_10m),windDir:d2c(c.wind_direction_10m),deltaT:dT(t,rh),at:new Date().toTimeString().slice(0,5)};
  }catch(e){console.warn(e);return null;}
}

async function getCoordAndFetchWx(j){
  // 1. Try GPS first
  toast("📍 Getting location…",4000);
  const gps=await getGPS();
  if(gps){
    toast("📡 Fetching weather from GPS…",3000);
    return await fetchWx(gps.lat,gps.lon);
  }
  // 2. Fall back to airstrip lookup
  toast("📡 Fetching weather (airstrip coords)…",3000);
  const c=COORDS[j.airstrip]||COORDS._default;
  return await fetchWx(c.lat,c.lon);
}

/* ── Tacho Session Helpers ──────────────── */
function buildSessionsTable(sessions){
  // Always show at least one blank row if empty
  const rows = sessions.length ? sessions : [{startTacho:'',startTime:'',stopTacho:'',stopTime:''}];
  return rows.map((s,i)=>{
    const dur = s.startTacho && s.stopTacho ? (parseFloat(s.stopTacho)-parseFloat(s.startTacho)).toFixed(1)+' hrs' : '—';
    return '<div class="sess-row" data-idx="'+i+'" style="background:#f8fafc;border-radius:10px;padding:10px;margin-bottom:8px;border:1px solid #e2e8f0">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">'+
      '<span style="font-size:.7rem;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:.5px">Session '+(i+1)+'</span>'+
      '<span style="font-size:.75rem;font-weight:700;color:#1a3a5c">⏱ '+dur+'</span></div>'+
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'+
      '<div><div style="font-size:.65rem;font-weight:700;color:#64748b;margin-bottom:3px">START TACHO</div>'+
      '<input type="text" inputmode="decimal" class="sess-inp" data-field="startTacho" data-idx="'+i+'" value="'+(s.startTacho||'')+'" placeholder="e.g. 1234.5" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.95rem;font-weight:800;font-family:monospace;text-align:center" oninput="refreshSession('+i+')"/></div>'+
      '<div><div style="font-size:.65rem;font-weight:700;color:#64748b;margin-bottom:3px">START TIME</div>'+
      '<input type="time" class="sess-inp" data-field="startTime" data-idx="'+i+'" value="'+(s.startTime||'')+'" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.85rem;font-weight:700" oninput="refreshSession('+i+')"/></div>'+
      '<div><div style="font-size:.65rem;font-weight:700;color:#64748b;margin-bottom:3px">STOP TACHO</div>'+
      '<input type="text" inputmode="decimal" class="sess-inp" data-field="stopTacho" data-idx="'+i+'" value="'+(s.stopTacho||'')+'" placeholder="e.g. 1237.2" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.95rem;font-weight:800;font-family:monospace;text-align:center" oninput="refreshSession('+i+')"/></div>'+
      '<div><div style="font-size:.65rem;font-weight:700;color:#64748b;margin-bottom:3px">STOP TIME</div>'+
      '<input type="time" class="sess-inp" data-field="stopTime" data-idx="'+i+'" value="'+(s.stopTime||'')+'" style="width:100%;box-sizing:border-box;padding:8px;border:1.5px solid #cbd5e1;border-radius:8px;font-size:.85rem;font-weight:700" oninput="refreshSession('+i+')"/></div>'+
      '</div></div>';
  }).join('');
}

function calcVdoTotal(sessions){
  const total = (sessions||[]).reduce((sum,s)=>{
    const start = parseFloat(s.startTacho||0);
    const stop  = parseFloat(s.stopTacho||0);
    if(start>0 && stop>start) sum += stop-start;
    return sum;
  },0);
  return total.toFixed(1);
}

function collectSessions(){
  const rows = document.querySelectorAll('.sess-row');
  const out = [];
  rows.forEach(row=>{
    const get = field => (row.querySelector('[data-field="'+field+'"]')||{}).value||'';
    out.push({startTacho:get('startTacho'),startTime:get('startTime'),stopTacho:get('stopTacho'),stopTime:get('stopTime')});
  });
  return out.filter(s=>s.startTacho||s.stopTacho); // drop fully empty rows
}

function refreshSession(idx){
  const sessions = collectSessions();
  // Recalc this session duration
  const row = document.querySelector('.sess-row[data-idx="'+idx+'"]');
  if(row){
    const s = sessions.find((_,i)=>i===idx)||sessions[sessions.length-1]||{};
    const dur = s.startTacho && s.stopTacho ? (parseFloat(s.stopTacho)-parseFloat(s.startTacho)).toFixed(1)+' hrs' : '—';
    const span = row.querySelector('span:last-child');
    if(span) span.textContent = '⏱ '+dur;
  }
  // Update total
  const totEl = document.getElementById('vdo-total-disp');
  if(totEl) totEl.textContent = calcVdoTotal(sessions)+' hrs';
}

function addSession(){
  const job = jobs.find(j=>j.id===jobId)||{};
  const existing = collectSessions();
  const sess = [...existing, {startTacho:'',startTime:'',stopTacho:'',stopTime:''}];
  const tbl = document.getElementById('sessions-table');
  if(tbl) tbl.innerHTML = buildSessionsTable(sess);
}
window.addSession=addSession; window.refreshSession=refreshSession;

/* ── Completion Form ─────────────────────── */
function goComplete(){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const c=j.completion||{}; const w=c.weather||wx||{};
  go("s-complete");
  const ld=calcLoads(j);
  // Landing: use temp stamp from finishJob (not persisted), or previously submitted value
  const landingDefault=j._landingStamp||c.landingTime||'';
  delete j._landingStamp; // clear so pause→resume doesn't reuse it
  // Auto-populate swath: saved completion > manual override > calculated from product/type
  const swathDefault=c.swath||j.swathOverride||ld.swathM||'';
  // Landings = number of loads by default
  const landingsDefault=c.numLandings||ld.loads||1;
  const startsDefault=c.numStarts||1;
  const ha=(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
  $("cbody").innerHTML=`
    <div class="fsec" style="background:var(--navy);color:#fff">
      <div style="font-size:1rem;font-weight:700;margin-bottom:4px">${j.clientName||"Job"}</div>
      <div style="font-size:.8rem;opacity:.75">${j.airstrip||""} · ${j.schedule?.aircraft||""} · ${j.schedule?.mixer||""}</div>
      <div style="font-size:.75rem;opacity:.6;margin-top:4px">${ha.toFixed(1)} ha · ${(j.products||[]).map(p=>p.name).filter(Boolean).join(", ")}</div>
    </div>

    <div class="fsec">
      <h3>✈️ Flight Sessions</h3>
      <div class="fg"><label>Date</label><input type="date" id="fd" value="${c.date||today()}"/></div>
      <div id="sessions-table" style="margin:0 0 10px">
        ${buildSessionsTable(c.tachoSessions||[])}
      </div>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <button onclick="addSession()" style="flex:1;padding:10px;border:2px dashed #cbd5e1;border-radius:10px;background:#f8fafc;color:#374151;font-size:.85rem;font-weight:700;cursor:pointer">+ Add Session</button>
      </div>
      <div style="background:#f0f9ff;border-radius:10px;padding:10px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:.8rem;font-weight:700;color:#374151">Total VDO Time</span>
        <span id="vdo-total-disp" style="font-size:1.1rem;font-weight:900;color:#1a3a5c;font-family:monospace">${calcVdoTotal(c.tachoSessions||[])} hrs</span>
      </div>
      <div class="two">
        <div class="fg"><label>Landings <span class="abadge">= LOADS</span></label><input type="number" id="fln" min="1" max="20" value="${landingsDefault}"/></div>
        <div class="fg"><label>Starts</label><input type="number" id="fst" min="1" max="20" value="${startsDefault}"/></div>
      </div>
    </div>

    <div class="fsec">
      <h3>📐 Application</h3>
      <div class="two">
        <div class="fg"><label>Swath Width (m) <span class="abadge">AUTO</span></label><input type="number" id="fsw" min="10" max="60" step="1" value="${swathDefault}" placeholder="metres"/></div>
        <div class="fg"><label>${ld.spread?'App Rate Actual (kg/ha)':'Vol Rate Actual (L/ha)'}</label><input type="number" id="fvr" step="0.1" value="${c.volRateActual||(ld.spread?ld.appRate:j.waterRate)||""}"/></div>
      </div>
      <div class="two">
        <div class="fg"><label>Dispersal Equipment</label>
          <select id="fde">
            <option value="">— Select —</option>
            ${["CPS","Spreader","Micronair"].map(v=>`<option${(c.dispersal===v||(c.dispersal===undefined||c.dispersal===null||c.dispersal==='')&&((ld.spread&&v==='Spreader')||(!ld.spread&&v==='CPS')))?" selected":""}>${v}</option>`).join("")}
          </select></div>
        ${ld.spread?'<div></div>':`<div class="fg"><label>Droplet Spectrum</label>
          <select id="fdr">
            <option value="">— Select —</option>
            ${["Very Fine","Fine","Medium","Coarse","Very Coarse"].map(v=>`<option${c.droplet===v?" selected":""}>${v}</option>`).join("")}
          </select></div>`}
      </div>
    </div>

    <div class="fsec">
      <h3>🌤️ Weather <span class="abadge">AUTO-FILLED</span></h3>
      ${w.at?`<div class="wxbar">📡 Auto-fetched at ${w.at} · edit if needed</div>`:`<div class="wxbar">Not yet fetched — <button onclick="refetch()" style="background:none;border:none;color:var(--blue);font-weight:600;cursor:pointer;font-size:.85rem;padding:0">Fetch now</button></div>`}
      <div class="wxgrid">
        <div class="fg"><label>Temp (°C)</label><input type="number" id="wt" step="0.1" value="${w.tempC||""}" oninput="calcDT()"/></div>
        <div class="fg"><label>Humidity (%)</label><input type="number" id="wr" min="0" max="100" value="${w.rh||""}" oninput="calcDT()"/></div>
        <div class="fg"><label>Wind Speed (km/h)</label><input type="number" id="wws" min="0" step="1" value="${w.windSpeed||""}"/></div>
        <div class="fg"><label>Wind Direction</label><input type="text" id="wwd" placeholder="e.g. NW" maxlength="4" value="${w.windDir||""}"/></div>
        <div class="fg" style="grid-column:1/-1"><label>Delta T <span class="abadge">CALCULATED</span></label>
          <input type="number" id="wdt" step="0.1" value="${w.deltaT||""}" placeholder="Auto from temp/humidity"/></div>
      </div>
    </div>
    <div style="height:80px"></div>`;
}

function stamp(id){$(id).value=nowT();}
function calcDT(){
  const t=parseFloat($("wt")?.value), r=parseFloat($("wr")?.value);
  if(!isNaN(t)&&!isNaN(r)) $("wdt").value=dT(t,r);
}
async function refetch(){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const w=await getCoordAndFetchWx(j);
  if(w){$("wt").value=w.tempC;$("wr").value=w.rh;$("wws").value=w.windSpeed;$("wwd").value=w.windDir;$("wdt").value=w.deltaT;toast("✅ Updated");}
  else toast("⚠️ Could not fetch weather");
}

/* ── Submit ──────────────────────────────── */
async function submitJob(){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;

  // Validation — all required fields must be filled
  const isSpread=(j.products||[]).some(p=>['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'].includes(p.type));
  const required=[
    [$("fd").value,          "Date"],
    [$("fsw").value,         "Swath width"],
    [$("fvr").value,         "Application rate"],
    [$("fde").value,         "Dispersal equipment"],
    [isSpread?'skip':($("fdr")?.value||''), "Droplet spectrum"],
    [$("wt").value,          "Temperature"],
    [$("wr").value,          "Humidity"],
    [$("wws").value,         "Wind speed"],
    [$("wwd").value,         "Wind direction"],
    [$("wdt").value,         "Delta T"],
  ];
  const missing=required.filter(([v])=>v!=='skip'&&(!v||v.trim()==='')).map(([,l])=>l);
  if(missing.length){
    alert("Please fill in all required fields:\n\n• "+missing.join("\n• "));
    return;
  }
  const sessions=collectSessions();
  const vdoTotal=calcVdoTotal(sessions);
  const firstSess=sessions[0]||{};
  const lastSess=sessions[sessions.length-1]||{};
  const c={
    date:$("fd").value,
    vdoStart:firstSess.startTacho||'', vdoStop:lastSess.stopTacho||'',
    takeoffTime:firstSess.startTime||'', landingTime:lastSess.stopTime||'',
    tachoSessions:sessions, vdoTotalHours:vdoTotal,
    numStarts:parseInt($("fst").value)||sessions.length||1, numLandings:parseInt($("fln").value)||1,
    swath:parseFloat($("fsw").value)||null, volRateActual:parseFloat($("fvr").value)||null,
    dispersal:$("fde").value, droplet:$("fdr")?.value||null,
    pilot, aircraft:j.schedule?.aircraft||"", mixer:j.schedule?.mixer||"",
    weather:{tempC:parseFloat($("wt").value)||null,rh:parseFloat($("wr").value)||null,
      windSpeed:parseFloat($("wws").value)||null,windDir:$("wwd").value,deltaT:parseFloat($("wdt").value)||null},
    submittedAt:new Date().toISOString()
  };
  j.completion=c; j.status="pilot_complete";
  try{
    await updateDoc(doc(db,"jobs",jobId),{status:"pilot_complete",completion:c});
    toast("✅ Job submitted!"); renderJobs(); goJobs();
  }catch(e){
    console.warn(e); toast("⚠️ Saved locally — will sync when online");
    renderJobs(); goJobs();
  }
}

/* ── Nav ─────────────────────────────────── */
function goJobs(){go("s-jobs");}
function goRunning_for(id){jobId=id;goRunning();}
function goResume(id){
  // Go to detail page — pilot deliberately taps Resume button from there
  goDetail(id);
}
window.goResume=goResume;

let timerInterval=null;

function goRunning(){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  go("s-running");
  renderRunning(j);
}

function renderRunning(j){
  const ld=calcLoads(j);
  const c=j.completion||{};
  const startTime=c.takeoffTime||'--:--';
  // Products per-load rows
  const prodRows=(j.products||[]).filter(p=>p.name&&parseFloat(p.rate)>0).map(p=>{
    const rate=parseFloat(p.rate)||0;
    const totalQty=rate*ld.totalHa;
    const loadQty=ld.loads>0?totalQty/ld.loads:0;
    const pu=p.unit||'L';
    return `<div class="prod-run-row">
      <div class="prn">${p.name}</div>
      <div class="prv blue">${loadQty.toFixed(1)} ${pu}</div>
      <div class="prv navy">${totalQty.toFixed(1)} ${pu}</div>
    </div>`;
  }).join('');

  $("rbody").innerHTML=`
    <div class="run-hdr">
      <div class="run-timer" id="run-elapsed">${startTime}</div>
      <div style="flex:1">
        <div style="font-size:1rem;font-weight:800;margin-bottom:2px">${j.clientName||'Job'}</div>
        <div style="font-size:.75rem;opacity:.8">${j.airstrip||''} · ${j.schedule?.aircraft||''}</div>
        <div style="font-size:.72rem;opacity:.7;margin-top:2px">${j.schedule?.mixer?'Mixer: '+j.schedule.mixer:''}</div>
      </div>
    </div>

    <div class="lplan-big">
      <div style="font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.5px;opacity:.7;margin-bottom:14px">🪣 Load Plan</div>
      <div class="lp-row">
        <div><div class="lp-num">${ld.totalHa.toFixed(0)}</div><div class="lp-lbl">ha total</div></div>
        <div><div class="lp-num">${ld.appRate}</div><div class="lp-lbl">${ld.unit}/ha</div></div>
        <div><div class="lp-num">${ld.totalUnits.toFixed(0)}</div><div class="lp-lbl">${ld.unit} total</div></div>
      </div>
      <div class="lp-row">
        <div><div class="lp-num gold">${ld.loads}</div><div class="lp-lbl">loads</div></div>
        <div><div class="lp-num">${(ld.totalHa/ld.loads).toFixed(0)}</div><div class="lp-lbl">ha/load</div></div>
        <div><div class="lp-num">${ld.perLoad.toFixed(0)}</div><div class="lp-lbl">${ld.unit}/load</div></div>
      </div>
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,.2);font-size:.7rem;opacity:.6">
        Hopper: ${ld.hopper.toFixed(0)} ${ld.unit} · ${ld.spread?'Spread':'Spray'}
        ${c.tachoSessions?.length>0?'· '+c.tachoSessions.filter(s=>s.startTacho).length+' session'+(c.tachoSessions.filter(s=>s.startTacho).length!==1?'s':''):''} · VDO start: ${c.vdoStart||'—'}
      </div>
    </div>

    ${prodRows?`<div class="prod-run">
      <div class="prod-run-hdr">
        <div>Product</div><div style="text-align:right;color:#93c5fd">Per Load</div><div style="text-align:right">Total</div>
      </div>
      ${prodRows}
    </div>`:''}

    <div style="height:80px"></div>`;

  // Live elapsed timer
  if(timerInterval) clearInterval(timerInterval);
  if(c.takeoffTime){
    timerInterval=setInterval(()=>{
      const el=$("run-elapsed"); if(!el)return clearInterval(timerInterval);
      const [sh,sm]=c.takeoffTime.split(':').map(Number);
      const now=new Date(); const diff=(now.getHours()*60+now.getMinutes())-(sh*60+sm);
      const h=Math.floor(Math.abs(diff)/60), m=Math.abs(diff)%60;
      el.textContent=(diff<0?'-':'')+(h>0?h+'h ':'')+m+'m';
    },30000);
  }
}

var _pauseTacho = '';
function pnt(k){
  // Don't allow two dots
  if(k==='.' && _pauseTacho.includes('.')) return;
  _pauseTacho += k;
  document.getElementById('pause-tacho-display').textContent = _pauseTacho || '—';
  document.getElementById('pause-tacho-err').textContent = '';
}
function pnb(){
  _pauseTacho = _pauseTacho.slice(0,-1);
  document.getElementById('pause-tacho-display').textContent = _pauseTacho || '—';
}
function showPauseModal(){
  _pauseTacho = '';
  document.getElementById('pause-tacho-display').textContent = '—';
  document.getElementById('pause-tacho-err').textContent = '';
  document.getElementById('pause-time').value = nowT();
  document.getElementById('pause-overlay').style.display = 'flex';
}
function closePauseModal(){
  document.getElementById('pause-overlay').style.display = 'none';
}
function stampPause(){
  document.getElementById('pause-time').value = nowT();
}
async function confirmPause(){
  const stopTacho = _pauseTacho.trim();
  const stopTime  = document.getElementById('pause-time').value;
  if(!stopTacho){
    document.getElementById('pause-tacho-err').textContent = '⚠️ Enter stop tacho';
    return;
  }
  closePauseModal();
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
  const j = jobs.find(j=>j.id===jobId); if(!j) return;
  j.completion = j.completion||{};
  // Save stop tacho & time onto this job's completion record
  // Close the current open tacho session
  if(!j.completion.tachoSessions) j.completion.tachoSessions=[];
  const openSess = j.completion.tachoSessions.findIndex(s=>!s.stopTacho);
  if(openSess>=0){
    j.completion.tachoSessions[openSess].stopTacho = stopTacho;
    j.completion.tachoSessions[openSess].stopTime  = stopTime || nowT();
  } else {
    // No open session — add a stop-only entry
    j.completion.tachoSessions.push({startTacho:'', startTime:'', stopTacho:stopTacho, stopTime:stopTime||nowT()});
  }
  // vdoStop = last session stop tacho
  j.completion.vdoStop = stopTacho;
  j.completion.pauseStopTacho = stopTacho;
  j.completion.pauseStopTime  = stopTime || nowT();
  // Persist to localStorage so next job start tacho auto-fills
  localStorage.setItem('at_lastStopTacho', stopTacho);
  localStorage.setItem('at_lastStopTime',  j.completion.pauseStopTime);
  try{
    await updateDoc(doc(db,"jobs",jobId),{completion:j.completion});
  }catch(e){console.warn('pause save:',e);}
  toast("Paused — stop tacho "+stopTacho+" saved");
  // Force re-fetch from Firestore so both cards reflect the updated session state
  await loadJobs();
  goJobs();
}
function pauseJob(){ showPauseModal(); }

function finishJob(){
  // Stop timer, go to completion form with auto-stamped landing time
  if(timerInterval){clearInterval(timerInterval);timerInterval=null;}
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  // Pass landing time via a temp flag — don't persist to Firestore until submit
  j._landingStamp=nowT();
  goComplete();
}

/* ── Init ────────────────────────────────── */
buildGrid();
if(pilot&&PINS[pilot]){onLogin();}else{go("s-login");}

/* ── Expose ──────────────────────────────── */
window.selPilot=selPilot;window.pt=pt;window.pc=pc;window.signOut=signOut;window.selAllJobs=selAllJobs;
window.goJobs=goJobs;window.goDetail=goDetail;window.goComplete=goComplete;window.goRunning=goRunning;window.goRunning_for=goRunning_for;window.pauseJob=pauseJob;window.showPauseModal=showPauseModal;window.closePauseModal=closePauseModal;window.stampPause=stampPause;window.confirmPause=confirmPause;window.pnt=pnt;window.pnb=pnb;window.finishJob=finishJob;
window.startJob=startJob;window.confirmStart=confirmStart;window.stamp=stamp;window.calcDT=calcDT;
window.refetch=refetch;window.submitJob=submitJob;

async function changeMixer(jid, mixerName){
  const j=jobs.find(x=>x.id===jid); if(!j) return;
  if(!j.schedule) j.schedule={};
  j.schedule.mixer=mixerName;
  try{
    await updateDoc(doc(db,'jobs',jid),{'schedule.mixer':mixerName});
    toast(mixerName?'✅ Mixer updated to '+mixerName.split(' ')[0]:'Mixer cleared');
    // Refresh detail to reflect change
    goDetail(jid);
  }catch(e){ toast('⚠️ Save failed'); console.warn(e); }
}
window.changeMixer=changeMixer;