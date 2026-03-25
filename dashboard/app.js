
// ═══ FIREBASE ═══ v28aa033
import{initializeApp}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js';
import{getFirestore,collection,doc,setDoc,deleteDoc,getDocs,onSnapshot,updateDoc}from'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
const FB={apiKey:"AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI",authDomain:"aerotech-ops.firebaseapp.com",projectId:"aerotech-ops",storageBucket:"aerotech-ops.firebasestorage.app",messagingSenderId:"645848371961",appId:"1:645848371961:web:4415c4d7623219fd31c828"};
let db=null,firestoreOK=false,unsub=null;
try{db=getFirestore(initializeApp(FB));firestoreOK=true;}catch(e){console.warn('Firestore init failed',e);}
function syncBadge(s){const el=document.getElementById('sync-dot');if(!el)return;const m={live:['🟢 Synced','#4ade80'],saving:['⏳ Saving','#fde68a'],offline:['🔴 Offline','#fca5a5'],error:['⚠️ Error','#fca5a5']};if(m[s]){el.textContent=m[s][0];el.style.color=m[s][1];}}
// ═══ CONFIG & STATE
// ═══════════════════════════════════════════════════
const AIRSTRIP_RATES = {
  'Cummins':     0.25,
  "Trelour's":   0.25,
  "Smithy's":    0.25,
  'Karkoo':      0.25,
  'Heymans':     0.25,
  "Rob Mac's":   0.25,
  "Fitzy's":     0.25,
  'Modras':      0.25,
};
const AIRSTRIPS = Object.keys(AIRSTRIP_RATES);
const AIRCRAFT  = ['VH-ODV','VH-ODP','VH-ODG','VH-ODN','VH-ODZ','VH-A54','VH-OUJ','VH-OUB'];
const AIRCRAFT_502 = ['VH-ODG','VH-A54']; // AT-502s
const CROP_TYPES = ['Wheat','Barley','Canola','Beans','Lentils','Lupins','Oats','Pasture','Cereals','Legumes/Pulses','Oilseeds'];
const PROD_TYPES = ['Herbicide','Fungicide','Insecticide','Misting','Trace Element','Adjuvant/Wetter','Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
const SPREAD_TYPES = ['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
const AC_COLORS  = {ODV:'sb-odv',ODP:'sb-odp',ODG:'sb-odg',ODN:'sb-odn',ODZ:'sb-odz',A54:'sb-a54',OUJ:'sb-ouj',OUB:'sb-oub'};

let jobs = []; window._allJobs = jobs;
let weekOffset = 0;
let currentTab = 'jobs';
let currentBase = localStorage.getItem('at_base')||'';

function getStaff(){
  const defaults = {
    pilotObjs:[
      {name:'Adam Sullivan',   pay:16, pin:'1234'},
      {name:'Henry Trealor',  pay:16, pin:'2345'},
      {name:'Michael Crettenden', pay:16, pin:'3456'},
      {name:'Hayden Noles',   pay:16, pin:'4567'},
    ],
    mixerObjs:[
      {name:'Ben Simcock',   pin:'1111'},
      {name:'Robert Proud',  pin:'2222'},
      {name:'Amber Meyers',  pin:'3333'},
      {name:'Shaun Dempsey', pin:'4444'},
    ],
    aircraftObjs:[
      {rego:'VH-ODV', type:'AT-802', rate:3300},
      {rego:'VH-ODP', type:'AT-802', rate:3300},
      {rego:'VH-ODN', type:'AT-802', rate:3300},
      {rego:'VH-ODZ', type:'AT-802', rate:3300},
      {rego:'VH-OUJ', type:'AT-802', rate:3300},
      {rego:'VH-OUB', type:'AT-802', rate:3300},
      {rego:'VH-ODG', type:'AT-502', rate:2200},
      {rego:'VH-A54', type:'AT-502', rate:2200},
    ],
    stripObjs:[
      {name:'Cummins',    rate:0.25},
      {name:"Trelour's",  rate:0.25},
      {name:"Smithy's",   rate:0.25},
      {name:'Karkoo',     rate:0.25},
      {name:'Heymans',    rate:0.25},
      {name:"Rob Mac's",  rate:0.25},
      {name:"Fitzy's",    rate:0.25},
      {name:'Modras',     rate:0.25},
    ],
    hopperCaps802:{'Spray':3020,'Urea':2000,'Fertiliser':2400,'Snail Bait':2000,'Mouse Bait':1200,'Seed':2000},
    hopperCaps502:{'Spray':1500,'Urea':1200,'Fertiliser':1400,'Snail Bait':1200,'Mouse Bait':800,'Seed':1200},
    swaths802:{herb:24,ins:28,fung:28,mist:40,other:28,fert:28,snail:35,mouse:50,seed:20,ur50:30,ur75:28,ur100:26,ur125:24,ur150:22,ur151:20},
    swaths502:{herb:20,ins:24,fung:24,mist:35,other:24,fert:22,snail:35,mouse:50,seed:20,ur50:26,ur75:24,ur100:22,ur125:20,ur150:18,ur151:16},
    // legacy flat lists (derived)
    pilots:['Adam Sullivan','Henry Trealor','Michael Crettenden','Hayden Noles'],
    mixers:['Ben Simcock','Robert Proud','Amber Meyers','Shaun Dempsey'],
    rate802:3300, rate502:2800, herbLoading:10,
    hopperCaps:{
      'Urea':2000,'Fertiliser':2400,'Snail Bait':2000,
      'Mouse Bait':1200,'Seed':2000,'Spray':3020
    }
  };
  const saved = JSON.parse(localStorage.getItem('at_staff')||'null');
  if(!saved) return defaults;
  saved.hopperCaps = Object.assign({}, defaults.hopperCaps, saved.hopperCaps||{});
  // Derive flat lists from objects if present
  if(saved.pilotObjs) saved.pilots = saved.pilotObjs.map(p=>p.name);
  if(saved.mixerObjs) saved.mixers = saved.mixerObjs.map(m=>m.name);
  // Merge new obj arrays from defaults if missing
  if(!saved.pilotObjs)   saved.pilotObjs   = defaults.pilotObjs;
  if(!saved.mixerObjs)   saved.mixerObjs   = defaults.mixerObjs;
  if(!saved.aircraftObjs)saved.aircraftObjs = defaults.aircraftObjs;
  if(!saved.stripObjs)   saved.stripObjs   = defaults.stripObjs;
  if(!saved.hopperCaps802) saved.hopperCaps802 = defaults.hopperCaps802;
  if(!saved.hopperCaps502) saved.hopperCaps502 = defaults.hopperCaps502;
  if(!saved.swaths802)     saved.swaths802     = defaults.swaths802;
  if(!saved.swaths502)     saved.swaths502     = defaults.swaths502;
  return saved;
}
function lsLoad(){return JSON.parse(localStorage.getItem('at_jobs')||'[]');}
function lsSave(){localStorage.setItem('at_jobs',JSON.stringify(jobs));}
async function saveJob(j){lsSave();syncBadge('saving');try{await fsSaveJob(j);syncBadge('live');}catch(e){console.warn('saveJob:',e);syncBadge('error');}}
async function deleteJobFromDB(id){jobs=jobs.filter(j=>j.id!==id);lsSave();try{await fsDeleteJob(id);}catch(e){console.warn('deleteJob:',e);}}
async function saveJobs(){lsSave();syncBadge('saving');for(const j of jobs){try{await fsSaveJob(j);}catch(e){console.warn(e);syncBadge('error');return;}}syncBadge('live');}
// ─── Firestore REST helper (bypasses SDK for reliability) ───
const FS_BASE='https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';
function fsVal(v){
  if(v===undefined||v===null) return null;
  if(typeof v==='string') return {stringValue:v};
  if(typeof v==='boolean') return {booleanValue:v};
  if(typeof v==='number') return Number.isInteger(v)?{integerValue:String(v)}:{doubleValue:v};
  if(Array.isArray(v)) return {arrayValue:{values:v.map(fsVal).filter(x=>x!==null)}};
  if(typeof v==='object') return {mapValue:{fields:Object.fromEntries(Object.entries(v).filter(([,val])=>val!==undefined&&val!==null).map(([k,val])=>[k,fsVal(val)]))}};
  return {stringValue:String(v)};
}
function fsFromVal(v){
  if(!v) return null;
  if('stringValue' in v) return v.stringValue;
  if('integerValue' in v) return parseInt(v.integerValue);
  if('doubleValue' in v) return v.doubleValue;
  if('booleanValue' in v) return v.booleanValue;
  if('nullValue' in v) return null;
  if('arrayValue' in v) return (v.arrayValue.values||[]).map(fsFromVal);
  if('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,val])=>[k,fsFromVal(val)]));
  return null;
}
function fsDocToJob(doc){
  const id=doc.name.split('/').pop();
  const fields=Object.fromEntries(Object.entries(doc.fields||{}).map(([k,v])=>[k,fsFromVal(v)]));
  return {id,...fields};
}
async function fsGetAllJobs(){
  let all=[],pageToken=null;
  do {
    const url=FS_BASE+'/jobs?pageSize=300'+(pageToken?'&pageToken='+pageToken:'');
    const r=await fetch(url);
    if(!r.ok) throw new Error('Firestore REST '+r.status);
    const d=await r.json();
    (d.documents||[]).forEach(doc=>all.push(fsDocToJob(doc)));
    pageToken=d.nextPageToken||null;
  } while(pageToken);
  return all;
}
async function fsSaveJob(j){
  const {id,...fields}=j;
  const body={fields:Object.fromEntries(Object.entries(fields).filter(([,v])=>v!==undefined&&v!==null).map(([k,v])=>[k,fsVal(v)]))};
  const r=await fetch(FS_BASE+'/jobs/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(!r.ok) console.warn('fsSaveJob error',r.status);
}
async function fsDeleteJob(id){
  const r=await fetch(FS_BASE+'/jobs/'+id,{method:'DELETE'});
  if(!r.ok) console.warn('fsDeleteJob error',r.status);
}

function loadJobs(){
  jobs=lsLoad();window._allJobs=jobs;
  // Load via plain REST fetch — works on all browsers/networks without WebSocket
  function applyJobs(j){
    jobs=j;window._allJobs=j;lsSave();renderJobs();
    if(currentTab==='scheduler')renderScheduler();
    if(currentTab==='records')renderRecords();
    if(currentTab==='pilotdone')renderPilotDone();
    if(currentTab==='priced')renderPriced();
    if(currentTab==='invoiced')renderInvoiced();
    syncBadge('live');
    const _ov=document.getElementById('modal-overlay');
    if(_ov&&_ov.classList.contains('open')&&window._openJobId){openJob(window._openJobId);}
    setTimeout(()=>{
      const todayDs=new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Adelaide'});
      silentCalcTimes(todayDs);
    },800);
  }
  fsGetAllJobs().then(applyJobs).catch(e=>{
    console.warn('REST load failed, trying SDK:',e);
    syncBadge('error');
    const el=document.getElementById('sync-dot');
    if(el){el.textContent='⚠️ Load error: '+e.message.slice(0,50);el.style.color='#ef4444';}
    // Fallback to SDK getDocs
    if(firestoreOK){
      getDocs(collection(db,'jobs')).then(snap=>{
        applyJobs(snap.docs.map(d=>({id:d.id,...d.data()})));
      }).catch(e2=>console.warn('SDK fallback also failed:',e2));
    }
  });
  // Poll every 30s for live updates
  setInterval(()=>{
    fsGetAllJobs().then(applyJobs).catch(e=>console.warn('Poll failed:',e));
  },30000);
}

// ─── Job type detection ───────────────────────────
function jobType(job){
  const prods = job.products||[];
  const isSpread = prods.some(p=>SPREAD_TYPES.includes(p.type));
  return isSpread ? 'spread' : 'spray';
}

// ─── Pricing estimate ─────────────────────────────
function estimateJob(job){
  const totalHa = (job.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
  const numPad  = Math.max(1,(job.paddocks||[]).filter(p=>parseFloat(p.ha)>0).length);
  const spread  = jobType(job)==='spread';
  const is502   = AIRCRAFT_502.includes(job.schedule?.aircraft);
  // Swath width lookup — aircraft-aware, reads from Settings, can be overridden per job
  function calcSwath(job, spread) {
    if(job.swathOverride) return parseFloat(job.swathOverride);
    const st = getStaff();
    const sw = is502 ? (st.swaths502||{}) : (st.swaths802||{});
    const def802={herb:24,ins:28,fung:28,mist:40,other:28,fert:28,snail:35,mouse:50,seed:20,ur50:30,ur75:28,ur100:26,ur125:24,ur150:22,ur151:20};
    const def502={herb:20,ins:24,fung:24,mist:35,other:24,fert:22,snail:35,mouse:50,seed:20,ur50:26,ur75:24,ur100:22,ur125:20,ur150:18,ur151:16};
    const defs = is502 ? def502 : def802;
    const g = k => parseFloat(sw[k]||defs[k]);
    if(spread) {
      const primaryProd = (job.products||[]).find(p=>SPREAD_TYPES.includes(p.type));
      if(!primaryProd) return g('fert');
      const ptype = primaryProd.type;
      const rate  = parseFloat(primaryProd.rate)||0;
      if(ptype==='Snail Bait') return g('snail');
      if(ptype==='Mouse Bait') return g('mouse');
      if(ptype==='Seed')       return g('seed');
      if(ptype==='Fertiliser') return g('fert');
      // Urea: rate-based swath table
      if(rate<=50)  return g('ur50');
      if(rate<=75)  return g('ur75');
      if(rate<=100) return g('ur100');
      if(rate<=125) return g('ur125');
      if(rate<=150) return g('ur150');
      return g('ur151');
    } else {
      // Spray: type-based swath
      const primaryProd = (job.products||[])[0];
      const ptype = primaryProd?.type||'';
      if(ptype==='Herbicide') return g('herb');
      if(ptype==='Misting')   return g('mist');
      if(ptype==='Insecticide') return g('ins');
      if(ptype==='Fungicide')   return g('fung');
      return g('other');
    }
  }
  const swathM  = calcSwath(job, spread);
  const staff   = getStaff();
  const appKmh  = spread ? (is502 ? 185 : 198) : (is502 ? 210 : 233); // AT-502 speeds approx — update when confirmed
  const hourlyBase = is502 ? staff.rate502 : staff.rate802;
  // Herbicide price loading: job.herbOverride can force on/off; else auto-detect from product type
  const isHerb = job.herbOverride==='on' ? true
               : job.herbOverride==='off' ? false
               : (job.appSubType==='Herbicide') || (!job.appSubType && (job.products||[])[0]?.type==='Herbicide');
  const herbPct = parseFloat(job.herbLoadingPct)>=0 ? parseFloat(job.herbLoadingPct) : (parseFloat(staff.herbLoading)||10);
  const hourly  = isHerb ? hourlyBase*(1+herbPct/100) : hourlyBase;
  const FERRY_KM = parseFloat(job.ferryBase) || 15;   // per load (airstrip ↔ paddock)
  const FERRY_EXTRA = parseFloat(job.ferryExtra) || 0; // one-off (e.g. positioning ferry)
  const ASPECT  = 3.0;
  const TURN_S  = 35;
  const RELOAD  = spread ? 2/60 : 10/60;
  const fhEmpty=(h)=>"0 min";
  if(totalHa<=0||swathM<=0) return {hours:0,cost:0,totalHa,spread,loads:0,blockTime:0,swathM,ferryKm:FERRY_KM,ferryExtra:FERRY_EXTRA,hopper:0,totalUnits:0,appRate:0,unitLabel:spread?'kg':'L',costPerHa:0,breakdown:{appTime:0,turnTime:0,ferryTime:0,inspect:0,loadTime:0,total:0,blockTime:0},fh:fhEmpty};
  const avgHa  = totalHa/numPad;
  const am2    = avgHa*10000;
  const lm     = Math.sqrt(am2*ASPECT);
  const wm     = am2/lm;
  const pL     = Math.ceil(lm/swathM);
  const pW     = Math.ceil(wm/swathM);
  const pp     = Math.min(pL,pW)+2;
  const turns  = Math.max(0,pp-1)*numPad;
  const distAppKm = (totalHa*10000)/(swathM*1000);
  // Hopper capacity: job-level override takes priority, then product-type config, then defaults
  const hopperCaps = is502
    ? (staff.hopperCaps502||{'Spray':1500,'Urea':1200,'Fertiliser':1400,'Snail Bait':1200,'Mouse Bait':800,'Seed':1200})
    : (staff.hopperCaps802||{'Spray':3020,'Urea':2000,'Fertiliser':2400,'Snail Bait':2000,'Mouse Bait':1200,'Seed':2000});
  let hopperDefault;
  if(spread){
    const primaryProd = (job.products||[]).find(p=>['Urea','Fertiliser','Snail Bait','Mouse Bait','Seed'].includes(p.type));
    hopperDefault = primaryProd ? (hopperCaps[primaryProd.type]||2000) : 2000;
  } else {
    hopperDefault = hopperCaps['Spray'] || 3020;
  }
  const hopper = parseFloat(job.hopperOverride) || hopperDefault;
  // SPRAY: hopper fills with water+chemical mix — volume = waterRate L/ha
  // SPREAD: hopper fills with dry product — weight = product rate kg/ha
  const waterRate = parseFloat(job.waterRate) || 30;
  const appRate   = spread
    ? (job.products||[]).reduce((s,p)=>s+(parseFloat(p.rate)||0),0) || 1
    : waterRate;
  const totalUnits = totalHa * appRate;
  const loads      = Math.max(1, Math.ceil(totalUnits / hopper));
  const appTime   = distAppKm/appKmh;
  const turnTime  = turns*TURN_S/3600;
  const ferryTime = loads*(2*FERRY_KM/appKmh) + (FERRY_EXTRA/appKmh); // base × 2 per load, extra is total once-off
  const inspect   = numPad*2/60;
  const loadTime  = loads*RELOAD;           // total reload time (all loads)
  // Total Flight Time = air time only (what gets charged)
  const total     = appTime+turnTime+ferryTime+inspect;
  // Block Time = all flight time + total reload time + 15 min setup
  const blockTime = total + loadTime + 15/60;
  const fh = (h)=>{ if(h<=0) return '0 min'; if(h<1) return Math.round(h*60)+' min'; return h.toFixed(1)+' h ('+Math.round(h*60)+' min)'; };
  const unitLabel = spread ? 'kg' : 'L';
  return {
    hours:total, cost:total*hourly, totalHa, spread, loads, blockTime, isHerb,
    hopper, totalUnits, appRate, unitLabel, ferryKm:FERRY_KM, ferryExtra:FERRY_EXTRA, swathM, costPerHa:totalHa>0?total*hourly/totalHa:0,
    breakdown:{
      appTime, turnTime, ferryTime, inspect, loadTime, total, blockTime
    }, fh
  };
}

// ─── Urgency ─────────────────────────────────────
function dateUrgency(dateStr){
  if(!dateStr) return '';
  const d = new Date(dateStr), now = new Date();
  now.setHours(0,0,0,0);
  const diff = Math.round((d-now)/(1000*60*60*24));
  if(diff<0) return 'overdue';
  if(diff<=3) return 'soon';
  return '';
}

// ─── Format helpers ───────────────────────────────
function fmtDate(s){if(!s)return'—';const d=new Date(s+'T00:00:00');return d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});}
function fmtMoney(n){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(n);}
function fmtHrs(h){if(h<=0)return'—';return h.toFixed(2)+' h';}
function statusLabel(s){return s.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase());}

// ─── Tab switching ────────────────────────────────
function switchTab(tab){
  currentTab = tab;
  ['jobs','pilotdone','priced','invoiced','scheduler','newjob','records'].forEach(t=>{
    const v=document.getElementById('view-'+t); if(v) v.style.display = t===tab?'':'none';
    const b=document.getElementById('tab-'+t);  if(b) b.classList.toggle('active',t===tab);
  });
  if(tab==='scheduler')  renderScheduler();
  if(tab==='records')    renderRecords();
  if(tab==='newjob')     initForm();
  if(tab==='pilotdone')  renderPilotDone();
  if(tab==='priced')     renderPriced();
  if(tab==='invoiced')   renderInvoiced();
}

// ═══════════════════════════════════════════════════
// JOBS TAB
// ═══════════════════════════════════════════════════
function renderJobs(){
  const status  = document.getElementById('f-status').value;
  const type    = document.getElementById('f-type').value;
  const airstrip= document.getElementById('f-airstrip').value;
  const search  = (document.getElementById('f-search').value||'').toLowerCase();

  // Populate airstrip filter
  const strips = [...new Set(jobs.map(j=>j.airstrip).filter(Boolean))].sort();
  const asEl = document.getElementById('f-airstrip');
  const asVal = asEl.value;
  asEl.innerHTML = '<option value="all">All Airstrips</option>'+strips.map(s=>`<option${s===asVal?' selected':''}>${s}</option>`).join('');

  let filtered = jobs.filter(j=>{
    if(!baseFilter(j)) return false;
    // Jobs tab only shows active jobs — completed ones move to their own tabs
    if(status==='all' && ['pilot_complete','priced','invoiced'].includes(j.status)) return false;
    if(status!=='all' && j.status!==status) return false;
    if(type!=='all'   && jobType(j)!==type) return false;
    if(airstrip!=='all' && j.airstrip!==airstrip) return false;
    if(search && !JSON.stringify(j).toLowerCase().includes(search)) return false;
    return true;
  });
  filtered.sort((a,b)=>{
    const aPC = a.status==='pilot_complete' ? 1 : 0;
    const bPC = b.status==='pilot_complete' ? 1 : 0;
    if(aPC !== bPC) return aPC - bPC; // pilot_complete always at bottom
    return (a.preferredDate||'').localeCompare(b.preferredDate||'');
  });

  document.getElementById('job-count').textContent = filtered.length+' job'+(filtered.length!==1?'s':'');
  const el = document.getElementById('job-list');

  if(!filtered.length){
    el.innerHTML=`<div class="empty-state"><div class="esi">📋</div><p>No jobs found</p></div>`;
    return;
  }

  el.innerHTML = filtered.map(j=>{
    const est   = estimateJob(j);
    const totalHa = est.totalHa;
    const type2 = jobType(j);
    const urg   = dateUrgency(j.preferredDate);
    const pads  = (j.paddocks||[]).filter(p=>p.name||p.ha).length;
    const prods = (j.products||[]).filter(p=>p.name).length;
    const sched = j.schedule?.aircraft ? `✈️ ${j.schedule.aircraft} · ${j.schedule.pilot||'—'}` : '';
    const mp = j.mixProgress;
    const loadsC = mp ? (mp.loadsComplete||0) : 0;
    const loadsT = mp ? (mp.loadsTotal||1) : 1;
    const mixPct = mp ? Math.min(100,Math.round((loadsC/loadsT)*100)) : 0;
    const mixBar = mp ? `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #f0f0f0">
      <div style="display:flex;justify-content:space-between;font-size:.68rem;color:var(--muted);margin-bottom:3px">
        <span>🧪 ${mp.mixer||'Mixer'} — ${loadsC}/${loadsT} loads</span>
        <span style="font-weight:700;color:${j.status==='pilot_complete'?'#16a34a':'#2563eb'}">${mixPct}%</span>
      </div>
      <div style="height:5px;background:#f0f0f0;border-radius:3px;overflow:hidden">
        <div style="height:100%;background:${j.status==='pilot_complete'?'#16a34a':'#2563eb'};width:${mixPct}%;border-radius:3px;transition:.5s"></div>
      </div>
    </div>` : '';
    // ── Compact card for pilot_complete ──
    if(j.status==='pilot_complete'){
      const comp = j.completion||{};
      const actTakeoff = comp.takeoffTime||'—';
      const actLanding = comp.landingTime||'—';
      const actVdo = comp.vdoStart&&comp.vdoStop?comp.vdoStart+'→'+comp.vdoStop:'—';
      const actSwath = comp.swath?comp.swath+'m':'—';
      const actPilot = comp.pilot||j.schedule?.pilot||'—';
      const actAC    = comp.aircraft||j.schedule?.aircraft||'—';
      return `<div class="job-card done-card" onclick="openJob('${j.id}')" style="opacity:.88;border-left:4px solid #16a34a">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1;min-width:0">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
              <span class="badge b-pilot_complete" style="font-size:.65rem">✅ Complete</span>
              <span style="font-weight:800;font-size:.9rem;color:var(--navy);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${j.clientName||'—'}</span>
            </div>
            <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px">${j.farmAddress||'—'}${j.airstrip?' · '+j.airstrip:''}</div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:.72rem">
              <span>📅 <strong>${fmtDate(comp.date||j.preferredDate)}</strong></span>
              <span>✈️ <strong>${actAC}</strong> · ${actPilot}</span>
              <span>🌾 <strong>${totalHa.toFixed(0)} ha</strong></span>
              ${est.cost>0?`<span>💰 <strong>${fmtMoney(j.actualCost||est.cost)}</strong></span>`:''}
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;font-size:.7rem;margin-top:3px;color:#374151">
              <span>🛫 <strong>${actTakeoff}</strong></span>
              <span>🛬 <strong>${actLanding}</strong></span>
              <span>📏 Swath <strong>${actSwath}</strong></span>
              ${comp.swathActualHa?`<span>Ha done: <strong>${comp.swathActualHa}</strong></span>`:''}
            </div>
          </div>
          <div style="font-size:1.4rem;flex-shrink:0">✅</div>
        </div>
      </div>`;
    }

    const isHerbCard = est.isHerb;
    return `<div class="job-card${urg?' '+urg:''}${isHerbCard?' herb-card':''}" onclick="openJob('${j.id}')" style="${isHerbCard?'border-left:4px solid #dc2626;background:#fff8f8;':''}">
      <div class="jc-top">
        <div>
          <div class="jc-title">${isHerbCard?'🌿 ':''}${j.clientName||'—'}</div>
          <div class="jc-sub">${j.farmAddress||'—'} ${j.airstrip?'· '+j.airstrip:''}</div>
          ${sched?`<div class="jc-sub" style="margin-top:3px;color:var(--navy)">${sched}</div>`:''}
        </div>
        <div class="jc-badges">
          <span class="badge b-${j.status||'new'}">${statusLabel(j.status||'new')}</span>
          <span class="badge b-${type2}">${type2.toUpperCase()}</span>
          ${isHerbCard?`<span class="badge" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5">🌿 HERB</span>`:''}
          ${urg?`<span class="badge b-${urg}">${urg==='overdue'?'⚠️ OVERDUE':'⏰ SOON'}</span>`:''}
        </div>
      </div>
      <div class="jc-meta">
        <span>📅 <strong>${fmtDate(j.preferredDate)}</strong></span>
        ${totalHa>0?`<span>🌾 <strong>${totalHa.toFixed(0)} ha</strong></span>`:''}
        ${est.cost>0?`<span>💰 <strong>${fmtMoney(est.cost)}</strong></span>`:''}
        ${est.breakdown?.blockTime>0?`<span>⏱️ <strong>${Math.floor(est.breakdown.blockTime*60)>=60?Math.floor(est.breakdown.blockTime*60/60)+'h '+Math.round(est.breakdown.blockTime*60%60)+'m':Math.round(est.breakdown.blockTime*60)+'m'}</strong> block</span>`:''}
        ${est.loads>0?`<span>🪣 <strong>${est.loads}</strong> load${est.loads!==1?'s':''} (${(est.totalUnits||0).toFixed(0)} ${est.unitLabel||'L'})</span>`:''}
        ${pads?`<span>📌 <strong>${pads}</strong> paddock${pads!==1?'s':''}</span>`:''}
        ${prods?`<span>🧪 <strong>${prods}</strong> product${prods!==1?'s':''}</span>`:''}
      </div>
      ${mixBar}
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════
// JOB DETAIL MODAL
// ═══════════════════════════════════════════════════
function openJob(id){
  const j = jobs.find(j=>j.id===id);
  if(!j) return;
  window._openJobId = id;
  const est  = estimateJob(j);
  const type2= jobType(j);
  const staff= getStaff();
  const ac802r = (staff.aircraftObjs||[]).find(a=>a.type==='AT-802')?.rate || staff.rate802 || 3300;
  const ac502r = (staff.aircraftObjs||[]).find(a=>a.type==='AT-502')?.rate || staff.rate502 || 2200;

  document.getElementById('modal-title').textContent = j.clientName||'Job Detail';
  document.getElementById('modal-overlay').classList.add('open');

  const aircraftOpts  = AIRCRAFT.map(a=>`<option${j.schedule?.aircraft===a?' selected':''}>${a}</option>`).join('');
  const pilotOpts     = staff.pilots.map(p=>`<option${j.schedule?.pilot===p?' selected':''}>${p}</option>`).join('');
  const mixerOpts     = staff.mixers.map(m=>`<option${j.schedule?.mixer===m?' selected':''}>${m}</option>`).join('');
  const statusOpts    = ['new','quoted','scheduled','in_progress','pilot_complete','priced','invoiced'].map(s=>`<option value="${s}"${j.status===s?' selected':''}>${statusLabel(s)}</option>`).join('');

  const paddockRows = (j.paddocks||[]).filter(p=>p.name||p.ha).map(p=>`<tr><td>${p.name||'—'}</td><td>${p.ha||0} ha</td><td>${p.cropType||'—'}</td></tr>`).join('');
  const productRows = (j.products||[]).filter(p=>p.name).map(p=>`<tr><td>${p.name}</td><td>${p.type||'—'}</td><td>${p.rate||0} ${p.unit||''}</td><td>${(p.totalQty||p.totalRequired||'—')}</td></tr>`).join('');

  const h = j.hazards||{};


  // ── Streamlined modal for pilot_complete jobs ──
  if(j.status === 'pilot_complete'){
    const comp = j.completion||{};
    const h = j.hazards||{};
    const rate = j.hourlyRate||3300;
    const hours = j.actualHours||(Math.round((est.breakdown?.totalFlight||0)*60)/60).toFixed(2);
    const chem  = j.chemCost||0;
    const airRatePerHa = AIRSTRIP_RATES[j.airstrip]||0;
    const autoAirstrip = airRatePerHa>0 ? Math.round(airRatePerHa*est.totalHa*100)/100 : 0;
    const chemDisplay = (chem||0) > 0 ? chem : autoAirstrip;
    const other = j.otherCharges||0;
    const other1 = j.other1||0;
    const other2 = j.other2||0;
    const ratePerHa = j.ratePerHa||0;
    const billingMode = j.billingMode||'hr';
    const flightCharge = billingMode==='ha'?Math.round(ratePerHa*est.totalHa):Math.round(rate*hours);
    const totalInv = j.actualCost||(flightCharge+chem+other1+other2);

    document.getElementById('modal-body').innerHTML = `

      <!-- Client & Job info (compact) -->
      <div class="msec">
        <div class="msec-title">Job Details</div>
        <div class="info-grid">
          <div class="ii"><div class="il">Client</div><div class="iv">${j.clientName||'—'}</div></div>
          <div class="ii"><div class="il">Agent</div><div class="iv">${j.agentName||'—'}</div></div>
          <div class="ii"><div class="il">Farm</div><div class="iv">${j.farmAddress||'—'}</div></div>
          <div class="ii"><div class="il">Airstrip</div><div class="iv">${j.airstrip||'—'}</div></div>
          <div class="ii"><div class="il">Date</div><div class="iv">${fmtDate(comp.date||j.preferredDate)}</div></div>
          <div class="ii"><div class="il">Invoice To</div><div class="iv">${j.invoiceTo||'—'}</div></div>
        </div>
        ${(j.paddocks||[]).filter(p=>p.name||p.ha).length?`
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:10px">
          <thead><tr>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Paddock</th>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Ha</th>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Crop</th>
          </tr></thead>
          <tbody>${(j.paddocks||[]).filter(p=>p.name||p.ha).map(p=>`<tr><td style="padding:5px 6px">${p.name||'—'}</td><td style="padding:5px 6px">${p.ha||0} ha</td><td style="padding:5px 6px">${p.cropType||'—'}</td></tr>`).join('')}</tbody>
        </table>`:''}
        ${(j.products||[]).filter(p=>p.name).length?`
        <table style="width:100%;border-collapse:collapse;font-size:.82rem;margin-top:8px">
          <thead><tr>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Product</th>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Rate</th>
            <th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Total Qty</th>
          </tr></thead>
          <tbody>${(j.products||[]).filter(p=>p.name).map(p=>`<tr><td style="padding:5px 6px">${p.name}</td><td style="padding:5px 6px">${p.rate||0} ${p.unit||''}</td><td style="padding:5px 6px">${p.totalQty||p.totalRequired||'—'}</td></tr>`).join('')}</tbody>
        </table>`:''}
      </div>

      <!-- Hazards (kept) -->
      ${(h.powerlines||h.susceptibleCrops||h.dwelling||h.anyHazards)?`<div class="msec">
        <div class="msec-title">⚠️ Hazards</div>
        <div style="display:grid;gap:4px;font-size:.82rem">
          ${h.powerlines==='yes'?`<div style="padding:6px 10px;background:#fef2f2;border-radius:7px;color:#dc2626;font-weight:700">⚡ Power Lines${h.powerlinesDesc?' — '+h.powerlinesDesc:''}</div>`:''}
          ${h.susceptibleCrops==='yes'?`<div style="padding:6px 10px;background:#fff7ed;border-radius:7px;color:#c2410c;font-weight:700">🌿 Susceptible Crops${h.susceptibleDesc?' — '+h.susceptibleDesc:''}</div>`:''}
          ${h.dwelling==='yes'?`<div style="padding:6px 10px;background:#fef2f2;border-radius:7px;color:#dc2626;font-weight:700">🏠 Dwelling Nearby</div>`:''}
          ${h.anyHazards==='yes'?`<div style="padding:6px 10px;background:#fff7ed;border-radius:7px;color:#92400e;font-weight:700">⚠️ Other: ${h.hazardsDesc||'—'}</div>`:''}
          ${h.neighboursNotified==='yes'?`<div style="padding:6px 10px;background:#f0fdf4;border-radius:7px;color:#15803d;font-weight:600">✅ Neighbours Notified</div>`:''}
        </div>
      </div>`:''}

      <!-- Pilot Completion Record (editable) -->
      <div class="msec" style="border:2px solid #2d7a45">
        <div class="msec-title" style="color:#065f46;display:flex;justify-content:space-between;align-items:center">
          <span>✅ Pilot Record</span>
          <button onclick="savePilotRecord('${j.id}')" class="btn btn-green btn-sm">💾 Save Changes</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:.82rem">
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">DATE</label>
            <input type="date" id="pr-date" value="${comp.date||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">PILOT</label>
            <input type="text" id="pr-pilot" value="${comp.pilot||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">AIRCRAFT</label>
            <input type="text" id="pr-aircraft" value="${comp.aircraft||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">MIXER</label>
            <input type="text" id="pr-mixer" value="${comp.mixer||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">TAKEOFF</label>
            <input type="time" id="pr-takeoff" value="${comp.takeoffTime||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">LANDING</label>
            <input type="time" id="pr-landing" value="${comp.landingTime||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">VDO START</label>
            <input type="text" id="pr-vdostart" value="${comp.vdoStart||''}" placeholder="e.g. 1234.5" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">VDO STOP</label>
            <input type="text" id="pr-vdostop" value="${comp.vdoStop||''}" placeholder="e.g. 1236.2" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">SWATH (m)</label>
            <input type="number" id="pr-swath" value="${comp.swath||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">DISPERSAL</label>
            <input type="text" id="pr-dispersal" value="${comp.dispersal||''}" style="width:100%;padding:7px;border:1.5px solid var(--border);border-radius:7px;font-size:.85rem"/></div>
        </div>
        ${comp.weather?`<div style="margin-top:10px;background:#f0fdf4;border-radius:8px;padding:10px;font-size:.82rem">
          <div style="font-weight:700;color:#065f46;margin-bottom:6px">🌤️ Weather</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">
            <div><span style="color:var(--muted)">Temp:</span> <strong>${comp.weather.tempC??'—'}°C</strong></div>
            <div><span style="color:var(--muted)">RH:</span> <strong>${comp.weather.rh??'—'}%</strong></div>
            <div><span style="color:var(--muted)">ΔT:</span> <strong>${comp.weather.deltaT??'—'}°C</strong></div>
            <div><span style="color:var(--muted)">Wind:</span> <strong>${comp.weather.windSpeed??'—'} km/h ${comp.weather.windDir||''}</strong></div>
          </div>
        </div>`:''}
      </div>

      <!-- Estimate box (below pilot records) -->
      <div style="margin-bottom:14px">
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">📊 Job Estimate</div>
        <div class="est-box" style="grid-template-columns:repeat(4,1fr)">
          <div class="ei"><div class="el">📅 Block Time</div><div class="ev" style="color:var(--navy)">${est.fh(est.breakdown.blockTime)}</div></div>
          <div class="ei"><div class="el">✈️ Flight Time</div><div class="ev">${est.fh(est.breakdown.total)}</div></div>
          <div class="ei"><div class="el">💰 Est. Cost</div><div class="ev">${fmtMoney(est.cost)}</div></div>
          <div class="ei"><div class="el">💵 $/ha</div><div class="ev">${est.costPerHa>0?'$'+est.costPerHa.toFixed(2):'—'}</div></div>
        </div>
      </div>

      <!-- ✅ Actual -->
      <div style="margin-bottom:14px">
        <div style="font-size:.72rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">✅ Actual</div>
        <div class="est-box" style="grid-template-columns:repeat(4,1fr);background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-color:#86efac" id="actual-summary-box">
          <div class="ei"><div class="el">📅 Block Time</div><div class="ev" id="act-block" style="color:#065f46">${(()=>{const t=comp.takeoffTime,l=comp.landingTime;if(t&&l){const[th,tm]=t.split(':').map(Number);const[lh,lm]=l.split(':').map(Number);const d=((lh*60+lm)-(th*60+tm))/60;return d>0?est.fh(d):'--';}return '--';})()}</div></div>
          <div class="ei"><div class="el">⏱️ Charged Hrs</div><div class="ev" id="act-tacho" style="color:#065f46">${(()=>{if(j.actualHours>0) return parseFloat(j.actualHours).toFixed(2)+' hrs'; let t=0;(comp.tachoSessions||[]).forEach(s=>{if(s.startTacho!==undefined&&s.startTacho!==''&&s.stopTacho!==undefined&&s.stopTacho!==''){const d=parseFloat(s.stopTacho)-parseFloat(s.startTacho);if(d>0)t+=d;}});if(t===0&&comp.vdoStart&&comp.vdoStop){const d=parseFloat(comp.vdoStop)-parseFloat(comp.vdoStart);if(d>0)t=d;}return t>0?t.toFixed(2)+' hrs':'--';})()}</div></div>
          <div class="ei"><div class="el">💰 Actual Cost</div><div class="ev" id="act-cost" style="color:#065f46">${j.actualCost>0?fmtMoney(j.actualCost):(()=>{let t=0;(comp.tachoSessions||[]).forEach(s=>{if(s.startTacho!==undefined&&s.startTacho!==''&&s.stopTacho!==undefined&&s.stopTacho!==''){const d=parseFloat(s.stopTacho)-parseFloat(s.startTacho);if(d>0)t+=d;}});if(t===0&&comp.vdoStart&&comp.vdoStop){const d=parseFloat(comp.vdoStop)-parseFloat(comp.vdoStart);if(d>0)t=d;}return t>0?fmtMoney(Math.round(t*rate)+chem+other):'--';})()}</div></div>
          <div class="ei"><div class="el">💵 $/ha</div><div class="ev" id="act-ha" style="color:#065f46">${(()=>{const ac=j.actualCost>0?j.actualCost:0;if(ac>0&&est.totalHa>0) return '$'+(ac/est.totalHa).toFixed(2); let t=0;(comp.tachoSessions||[]).forEach(s=>{if(s.startTacho!==undefined&&s.startTacho!==''&&s.stopTacho!==undefined&&s.stopTacho!==''){const d=parseFloat(s.stopTacho)-parseFloat(s.startTacho);if(d>0)t+=d;}});if(t===0&&comp.vdoStart&&comp.vdoStop){const d=parseFloat(comp.vdoStop)-parseFloat(comp.vdoStart);if(d>0)t=d;}const ac2=Math.round(t*rate)+chem+other;return t>0&&est.totalHa>0?'$'+(ac2/est.totalHa).toFixed(2):'--';})()}</div></div>
        </div>
      </div>

      <!-- Billing -->
      <div class="msec" style="border:2px solid #1a3a5c">
        <div class="msec-title" style="color:#1a3a5c">💰 Invoice</div>

        <!-- Pricing mode toggle -->
        <div style="display:flex;gap:6px;margin-bottom:10px">
          <button id="ac-mode-hr" onclick="acSetMode('hr','${j.id}')" class="btn btn-sm" style="flex:1;background:${(j.billingMode||'hr')==='hr'?'var(--navy)':' #f0f4f8'};color:${(j.billingMode||'hr')==='hr'?'#fff':'var(--navy)'};border:1.5px solid var(--navy)">⏱ Hourly Rate</button>
          <button id="ac-mode-ha" onclick="acSetMode('ha','${j.id}')" class="btn btn-sm" style="flex:1;background:${(j.billingMode||'hr')==='ha'?'var(--navy)':' #f0f4f8'};color:${(j.billingMode||'hr')==='ha'?'#fff':'var(--navy)'};border:1.5px solid var(--navy)">📐 $/ha</button>
        </div>

        <!-- Hourly fields -->
        <div id="ac-hr-fields" style="display:${(j.billingMode||'hr')==='hr'?'grid':'none'};grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">HOURLY RATE ($/hr)</label>
            <input type="number" id="ac-rate" value="${rate}" step="50" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">CHARGED HOURS</label>
            <input type="number" id="ac-hours" value="${hours}" step="0.05" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/></div>
        </div>

        <!-- $/ha fields -->
        <div id="ac-ha-fields" style="display:${(j.billingMode||'hr')==='ha'?'grid':'none'};grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">RATE ($/ha)</label>
            <input type="number" id="ac-rateha" value="${j.ratePerHa||''}" step="0.5" placeholder="e.g. 42.00" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/></div>
          <div style="display:flex;align-items:flex-end;padding-bottom:6px">
            <span style="font-size:.85rem;color:var(--muted)">Area: <b>${est.totalHa.toFixed(2)} ha</b></span>
          </div>
        </div>

        <!-- Chem -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">AIRSTRIP CHARGE ($)</label>
            <input type="number" id="ac-chem" value="${chemDisplay.toFixed(2)}" step="0.01" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/></div>
          <div><label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">DESCRIPTION</label>
            <input type="text" id="ac-chem-desc" value="${j.chemDesc||'Airstrip / Loading Area Maintenance'}" placeholder="Airstrip / Loading Area Maintenance" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
            <div style="font-size:.68rem;color:var(--muted);margin-top:3px">${airRatePerHa>0?'$'+airRatePerHa+'/ha × '+est.totalHa.toFixed(2)+'ha = $'+autoAirstrip.toFixed(2):'Enter rate above'}</div></div>
        </div>

        <!-- Other charge 1 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">OTHER CHARGE 1 ($)</label>
            <input type="number" id="ac-other1" value="${j.other1||''}" step="1" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">DESCRIPTION</label>
            <input type="text" id="ac-other1-desc" value="${j.other1Desc||''}" placeholder="Description (optional)" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
        </div>
        <div style="margin:-4px 0 10px;display:flex;align-items:center;gap:6px">
          <label style="display:flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;color:var(--muted);cursor:pointer">
            <input type="checkbox" id="ac-other1-pilot" ${j.other1InPilotPay?'checked':''} style="width:14px;height:14px">
            Include in pilot pay base
          </label>
        </div>

        <!-- Other charge 2 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">OTHER CHARGE 2 ($)</label>
            <input type="number" id="ac-other2" value="${j.other2||''}" step="1" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">DESCRIPTION</label>
            <input type="text" id="ac-other2-desc" value="${j.other2Desc||''}" placeholder="Description (optional)" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
        </div>
        <div style="margin:-4px 0 12px;display:flex;align-items:center;gap:6px">
          <label style="display:flex;align-items:center;gap:5px;font-size:.72rem;font-weight:700;color:var(--muted);cursor:pointer">
            <input type="checkbox" id="ac-other2-pilot" ${j.other2InPilotPay?'checked':''} style="width:14px;height:14px">
            Include in pilot pay base
          </label>
        </div>

        <div style="display:flex;align-items:center;gap:10px">
          <div id="ac-total-display" style="flex:1;font-size:1.3rem;font-weight:800;color:var(--navy)">${fmtMoney(totalInv)}</div>
          <button onclick="saveActualCost('${j.id}')" class="btn btn-green btn-sm">💾 Save</button>
          <button onclick="printInvoice('${j.id}')" class="btn btn-navy btn-sm">🖨️ Print</button><button onclick="xeroPushInvoice('${j.id}')" class="btn btn-sm" style="background:#13b5ea;color:#fff">🔗 Xero</button>
        </div>
      </div>

      <!-- Status -->
      <div class="msec">
        <div class="msec-title">Job Status</div>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <select id="m-status" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem;flex:1">${statusOpts}</select>
          <button class="btn btn-green btn-sm" onclick="updateStatus('${j.id}')">✅ Update</button>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
        <button class="btn btn-ghost btn-sm" onclick="editJob('${j.id}')">✏️ Edit Job</button>
        <button class="btn btn-red btn-sm" onclick="deleteJob('${j.id}')">🗑️ Delete</button>
      </div>`;

    return; // don't fall through to the full modal
  }

    document.getElementById('modal-body').innerHTML = `

    <!-- Estimate -->
    <div class="msec">
      <div class="msec-title">💰 Time &amp; Cost Estimate</div>

      <!-- Ferry + hopper editor -->
      <div style="background:#f8f9fa;border:1.5px solid #dde1e8;border-radius:10px;padding:12px;margin-bottom:12px">
        <div style="font-size:.75rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px">✏️ Estimate Adjustments</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px">🚗 Airstrip → Paddock (km, per load)</label>
            <input id="est-ferry" type="number" min="1" max="300" step="0.5" value="${j.ferryBase||15}"
              style="width:90px;padding:7px 10px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.9rem;font-weight:600;text-align:center"
              oninput="updateEstimate('${j.id}')"/>
          </div>
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px">🛣️ Extra Ferry (total km, once-off)</label>
            <input id="est-ferry-extra" type="number" min="0" max="500" step="0.5" value="${j.ferryExtra||0}"
              style="width:90px;padding:7px 10px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.9rem;font-weight:600;text-align:center"
              oninput="updateEstimate('${j.id}')"/>
          </div>
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px">🪣 Hopper Capacity (${type2==='spread'?'kg':'L'} per load)</label>
            <input id="est-hopper" type="number" min="100" max="10000" step="10" value="${j.hopperOverride||est.hopper}"
              style="width:100px;padding:7px 10px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.9rem;font-weight:600;text-align:center"
              oninput="updateEstimate('${j.id}')"/>
          </div>
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px">📐 Swath Width (m)</label>
            <input id="est-swath" type="number" min="10" max="50" step="1" value="${j.swathOverride||est.swathM}"
              style="width:80px;padding:7px 10px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.9rem;font-weight:600;text-align:center"
              oninput="updateEstimate('${j.id}')"/>
            <div style="font-size:.65rem;color:var(--muted);margin-top:3px;text-align:center">default ${est.swathM}m</div>
          </div>
          <div>
            <label style="font-size:.72rem;color:var(--muted);font-weight:600;display:block;margin-bottom:3px">🌿 Herb. Loading (%)</label>
            <div style="display:flex;align-items:center;gap:4px">
              <button id="est-herb-toggle" onclick="toggleHerbLoading('${j.id}')"
                style="padding:7px 10px;border-radius:7px;font-size:.82rem;font-weight:800;border:1.5px solid ${est.isHerb?'#16a34a':'#dde1e8'};background:${est.isHerb?'#dcfce7':'#f3f4f6'};color:${est.isHerb?'#15803d':'#6b7280'};cursor:pointer;white-space:nowrap">
                ${est.isHerb?'✅ ON':'OFF'}
              </button>
              <input id="est-herb-pct" type="number" min="0" max="100" step="1" value="${j.herbLoadingPct??getStaff().herbLoading??10}"
                style="width:60px;padding:7px 8px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.9rem;font-weight:600;text-align:center"
                oninput="updateEstimate('${j.id}')"/>
              <span style="font-size:.8rem;color:var(--muted);font-weight:600">%</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;align-self:flex-end">
            <div id="est-loads-badge" style="background:#1a3a5c;color:#fff;padding:6px 12px;border-radius:7px;font-size:.85rem;font-weight:700;text-align:center">${est.loads} load${est.loads!==1?'s':''}</div>
            <div id="est-units-lbl" style="font-size:.68rem;color:var(--muted);text-align:center">${est.totalUnits.toFixed(0)} ${est.unitLabel} total</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px;align-self:flex-end">
            <button onclick="saveFerryEdit('${j.id}')" class="btn btn-navy btn-sm">💾 Save</button>
            <div id="ferry-saved-msg" style="font-size:.72rem;color:var(--green);display:none;text-align:center">✅ Saved</div>
          </div>
        </div>
        <div style="font-size:.7rem;color:var(--muted);margin-top:8px">
          Hopper default: <strong>${est.hopper.toFixed(0)} ${est.unitLabel}</strong> · Swath default: <strong>${est.swathM}m</strong>${type2==='spread'?" (rate-based)":""} · Overrides saved per job
          <div style="margin-top:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <span style="font-size:.7rem;color:var(--muted);font-weight:600">💰 QUOTE AS:</span>
            <button onclick="setPriceAircraft('${j.id}','AT-802')" class="btn btn-sm" style="padding:4px 10px;font-size:.72rem;${!j.priceAsAircraft||!AIRCRAFT_502.includes(j.priceAsAircraft)?'background:var(--navy);color:#fff':''}" id="priceas-802-${j.id}">🛩️ AT-802 ($${ac802r}/hr)</button>
            <button onclick="setPriceAircraft('${j.id}','AT-502')" class="btn btn-sm" style="padding:4px 10px;font-size:.72rem;${j.priceAsAircraft&&AIRCRAFT_502.includes(j.priceAsAircraft)?'background:var(--navy);color:#fff':''}" id="priceas-502-${j.id}">✈️ AT-502 ($${ac502r}/hr)</button>
            <span style="font-size:.68rem;color:var(--muted)">(scheduling uses actual aircraft)</span>
          </div>
        </div>
      </div>

      <!-- Summary boxes -->
      <div class="est-box" style="grid-template-columns:repeat(4,1fr);margin-bottom:12px" id="est-summary-box">
        <div class="ei"><div class="el">📅 Block Time</div><div class="ev" style="color:var(--navy)">${est.fh(est.breakdown.blockTime)}</div></div>
        <div class="ei"><div class="el">✈️ Flight Time</div><div class="ev">${est.fh(est.breakdown.total)}</div></div>
        <div class="ei"><div class="el">💰 Est. Cost</div><div class="ev">${fmtMoney(est.cost)}</div></div>
        <div class="ei"><div class="el">💵 Cost / ha</div><div class="ev">${est.costPerHa>0?'$'+est.costPerHa.toFixed(2):'—'}</div></div>
      </div>

      <!-- Breakdown table -->
      <table style="width:100%;border-collapse:collapse;font-size:.82rem;background:#f8fafb;border-radius:8px;overflow:hidden" id="est-table">
        <thead>
          <tr style="background:#e8f0ea">
            <th style="text-align:left;padding:6px 10px;font-size:.7rem;color:var(--muted);font-weight:700;text-transform:uppercase">Time Component</th>
            <th style="text-align:right;padding:6px 10px;font-size:.7rem;color:var(--muted);font-weight:700;text-transform:uppercase">Duration</th>
          </tr>
        </thead>
        <tbody id="est-table-body">
          <tr><td style="padding:6px 10px">🛩️ Application (flying paddocks · ${est.swathM}m swath)</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est.fh(est.breakdown.appTime)}</td></tr>
          <tr style="background:#f0f4f2"><td style="padding:6px 10px">🔄 Turn time at ends</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est.fh(est.breakdown.turnTime)}</td></tr>
          <tr><td style="padding:6px 10px">🚗 Ferry (${est.ferryKm} km × 2 × ${est.loads} load${est.loads!==1?'s':''}${est.ferryExtra>0?' + '+est.ferryExtra.toFixed(1)+' km once-off':''})</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est.fh(est.breakdown.ferryTime)}</td></tr>
          <tr style="background:#f0f4f2"><td style="padding:6px 10px">🔧 Reload time (${est.loads} load${est.loads!==1?'s':''} × ${est.spread?'~2 min':'~10 min'} · ${est.totalUnits.toFixed(0)}${est.unitLabel} ÷ ${est.hopper.toFixed(0)}${est.unitLabel}/hopper)</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est.fh(est.breakdown.loadTime)}</td></tr>
          <tr><td style="padding:6px 10px">🔍 Paddock inspection</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est.fh(est.breakdown.inspect)}</td></tr>
          <tr style="background:#e8f0ea;font-weight:700"><td style="padding:7px 10px;font-size:.85rem">✈️ Total Flight Time</td><td style="text-align:right;padding:7px 10px;font-size:.88rem;color:var(--green)">${est.fh(est.breakdown.total)}</td></tr>
          <tr style="background:#dbeafe;font-weight:700"><td style="padding:7px 10px;font-size:.85rem">📅 Block Time (flight + reloads + 15 min setup)</td><td style="text-align:right;padding:7px 10px;font-size:.9rem;color:var(--blue)">${est.fh(est.breakdown.blockTime)}</td></tr>
        </tbody>
      </table>
      <div style="margin-top:8px;font-size:.72rem;color:var(--muted)">Reload time not charged. Invoice = Flight Time × $${(AIRCRAFT_502.includes(j.schedule?.aircraft)?staff.rate502:staff.rate802).toLocaleString()}/hr${est.isHerb?` + ${staff.herbLoading||10}% herbicide loading`:''} = <strong>${fmtMoney(est.cost)}</strong> ($${est.costPerHa.toFixed(2)}/ha)</div>
    </div>

    <!-- Client & Job Info -->
    <div class="msec">
      <div class="msec-title">Job Details</div>
      <div class="info-grid">
        <div class="ii"><div class="il">Client</div><div class="iv">${j.clientName||'—'}</div></div>
        <div class="ii"><div class="il">Agent/Agronomist</div><div class="iv">${j.agentName||'—'}</div></div>
        <div class="ii"><div class="il">Application Date</div><div class="iv">${fmtDate(j.preferredDate)}</div></div>
        <div class="ii"><div class="il">Airstrip</div><div class="iv">${j.airstrip||'—'}</div></div>
        <div class="ii"><div class="il">Farm Address</div><div class="iv">${j.farmAddress||'—'}</div></div>
        <div class="ii"><div class="il">Wind Direction</div><div class="iv">${j.windDirectionRequired||'—'}</div></div>
        <div class="ii"><div class="il">Water Rate</div><div class="iv">${j.waterRate||30} L/ha</div></div>
        <div class="ii"><div class="il">Invoice To</div><div class="iv">${j.invoiceTo||'—'}</div></div>
        <div class="ii"><div class="il">Recommendation</div><div class="iv">${j.hasRecommendation==='yes'?'✅ Yes':'❌ No'}</div></div>
        <div class="ii"><div class="il">Map Provided</div><div class="iv">${j.mapUploaded==='yes'?'✅ Yes':'❌ No'}</div></div>
      </div>
      ${j.additionalComments?`<div style="margin-top:10px;padding:10px;background:#f8f9fa;border-radius:8px;font-size:.85rem"><strong>Notes:</strong> ${j.additionalComments}</div>`:''}
    </div>

    <!-- Paddocks -->
    ${paddockRows?`<div class="msec">
      <div class="msec-title">Paddocks</div>
      <table style="width:100%;border-collapse:collapse;font-size:.82rem">
        <thead><tr><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Name</th><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Ha</th><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Crop</th></tr></thead>
        <tbody>${paddockRows}</tbody>
      </table>
    </div>`:''}

    <!-- Products -->
    ${productRows?`<div class="msec">
      <div class="msec-title">Products</div>
      <table style="width:100%;border-collapse:collapse;font-size:.82rem">
        <thead><tr><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Product</th><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Type</th><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Rate</th><th style="text-align:left;padding:5px 6px;font-size:.7rem;font-weight:700;color:var(--muted);border-bottom:2px solid var(--border)">Total</th></tr></thead>
        <tbody>${productRows}</tbody>
      </table>
    </div>`:''}

    
    <!-- Actual Billing -->
    ${j.status==='pilot_complete'?`
    <div class="msec" style="border:2px solid #1a3a5c">
      <div class="msec-title" style="color:#1a3a5c">💰 Billing — Estimated vs Actual</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:#f8fafc;border-radius:8px;padding:10px">
          <div style="font-size:.68rem;font-weight:700;color:var(--muted);margin-bottom:6px;text-transform:uppercase">📊 Estimated</div>
          <div style="font-size:.78rem;display:grid;gap:3px">
            <div><span style="color:var(--muted)">App time:</span> <strong>${Math.round((est.breakdown?.appTime||0)*60)} min</strong></div>
            <div><span style="color:var(--muted)">Turn time:</span> <strong>${Math.round((est.breakdown?.turnTime||0)*60)} min</strong></div>
            <div><span style="color:var(--muted)">Ferry:</span> <strong>${Math.round((est.breakdown?.ferryTime||0)*60)} min</strong></div>
            <div><span style="color:var(--muted)">Reload:</span> <strong>${Math.round((est.breakdown?.reloadTime||0)*60)} min</strong></div>
            <div style="border-top:1px solid var(--border);margin-top:4px;padding-top:4px"><span style="color:var(--muted)">Total flight:</span> <strong>${Math.round((est.breakdown?.totalFlight||0)*60)} min</strong></div>
            <div><span style="color:var(--muted)">Block time:</span> <strong>${Math.round((est.breakdown?.blockTime||0)*60)} min</strong></div>
            <div style="margin-top:4px;font-size:.9rem;font-weight:800;color:var(--navy)">Est: ${fmtMoney(est.cost)}</div>
          </div>
        </div>
        <div style="background:#f0fdf4;border-radius:8px;padding:10px;border:1.5px solid #86efac">
          <div style="font-size:.68rem;font-weight:700;color:#065f46;margin-bottom:6px;text-transform:uppercase">✅ Actual</div>
          <div style="font-size:.78rem;display:grid;gap:3px">
            <div><span style="color:var(--muted)">Takeoff:</span> <strong>${j.completion?.takeoffTime||'—'}</strong></div>
            <div><span style="color:var(--muted)">Landing:</span> <strong>${j.completion?.landingTime||'—'}</strong></div>
            <div><span style="color:var(--muted)">VDO start:</span> <strong>${j.completion?.vdoStart||'—'}</strong></div>
            <div><span style="color:var(--muted)">VDO stop:</span> <strong>${j.completion?.vdoStop||'—'}</strong></div>
            ${j.completion?.tachoSessions?.length?`<div style="border-top:1px solid #d1fae5;margin-top:4px;padding-top:4px"><span style="color:var(--muted)">VDO total:</span> <strong>${(()=>{let t=0;(j.completion.tachoSessions||[]).forEach(s=>{if(s.startTacho&&s.stopTacho)t+=parseFloat(s.stopTacho)-parseFloat(s.startTacho);});return t.toFixed(1);})()}</strong></div>`:''}
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px">
        <div style="font-size:.75rem;font-weight:800;color:var(--navy);margin-bottom:10px">Invoice Amount</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">HOURLY RATE ($/hr)</label>
            <input type="number" id="ac-rate" value="${j.hourlyRate||3300}" step="50" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">CHARGED FLIGHT (hrs)</label>
            <input type="number" id="ac-hours" value="${j.actualHours||(Math.round((est.breakdown?.totalFlight||0)*60)/60).toFixed(2)}" step="0.05" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">CHEM COST ($)</label>
            <input type="number" id="ac-chem" value="${j.chemCost||0}" step="1" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
          <div>
            <label style="font-size:.68rem;font-weight:700;color:var(--muted);display:block;margin-bottom:3px">OTHER CHARGES ($)</label>
            <input type="number" id="ac-other" value="${j.otherCharges||0}" step="1" oninput="recalcActualBox('${j.id}')" style="width:100%;padding:8px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem"/>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div id="ac-total-display" style="flex:1;font-size:1.2rem;font-weight:800;color:var(--navy)">
            ${fmtMoney(j.actualCost||(est.cost+(j.chemCost||0)+(j.otherCharges||0)))}
          </div>
          <button onclick="saveActualCost('${j.id}')" class="btn btn-green btn-sm" style="white-space:nowrap">Save Invoice</button>
          <button onclick="printInvoice('${j.id}')" class="btn btn-navy btn-sm" style="white-space:nowrap">Print Invoice</button>
        </div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:4px">Rate × hours + chem + other = total invoice</div>
      </div>
    </div>`:''}

<!-- Hazards -->
    <div class="msec">
      <div class="msec-title">⚠️ Hazards</div>
      <div class="hz-row"><span class="hz-label">Power Lines</span><span class="hz-val ${h.powerlines==='yes'?'yes':'no'}">${h.powerlines==='yes'?'YES ⚠️':'No'}</span></div>
      ${h.powerlinesDesc?`<div style="font-size:.8rem;color:var(--muted);padding:4px 0 8px">${h.powerlinesDesc}</div>`:''}
      <div class="hz-row"><span class="hz-label">Susceptible Crops</span><span class="hz-val ${h.susceptibleCrops==='yes'?'yes':'no'}">${h.susceptibleCrops==='yes'?'YES ⚠️':'No'}</span></div>
      ${h.susceptibleDesc?`<div style="font-size:.8rem;color:var(--muted);padding:4px 0 8px">${h.susceptibleDesc}</div>`:''}
      <div class="hz-row"><span class="hz-label">Within 150m Dwelling</span><span class="hz-val ${h.dwelling==='yes'?'yes':'no'}">${h.dwelling==='yes'?'YES':'No'}</span></div>
      <div class="hz-row"><span class="hz-label">Neighbours Notified</span><span class="hz-val ${h.neighboursNotified==='no'?'yes':'no'}">${h.neighboursNotified==='yes'?'Yes ✅':'NO ⚠️'}</span></div>
      <div class="hz-row"><span class="hz-label">Neighbours of Concern</span><span class="hz-val ${h.neighboursConcern==='yes'?'yes':'no'}">${h.neighboursConcern==='yes'?'YES ⚠️':'No'}</span></div>
      ${h.neighboursDesc?`<div style="font-size:.8rem;color:var(--muted);padding:4px 0 8px">${h.neighboursDesc}</div>`:''}
    </div>

    <!-- Map & Links -->
    <div class="msec" id="map-msec">
      <div class="msec-title" style="display:flex;justify-content:space-between;align-items:center">
        <span>🗺️ Paddock Map</span>
        <div style="display:flex;gap:6px">
          <button onclick="exportGeoJSON('${j.id}')" style="padding:4px 10px;border:1.5px solid #1a3a5c;border-radius:7px;background:#fff;color:#1a3a5c;font-size:.72rem;font-weight:700;cursor:pointer">⬇️ GeoJSON</button>
          <button onclick="toggleMapPanel('${j.id}')" id="map-toggle-btn" style="padding:4px 10px;border:1.5px solid var(--border);border-radius:7px;background:#f0f4f8;color:var(--muted);font-size:.72rem;font-weight:700;cursor:pointer">🗺️ Open Map</button>
        </div>
      </div>

      <!-- Links row -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">
        <div style="flex:1;min-width:200px">
          <label style="font-size:.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px">Agworld Link / URL</label>
          <input id="map-agworld-url" type="text" value="${j.agworldUrl||''}" placeholder="https://app.agworld.com/..." 
            style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:.8rem"
            onchange="saveMapMeta('${j.id}')"/>
        </div>
        <div style="flex:1;min-width:200px">
          <label style="font-size:.65rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.4px;display:block;margin-bottom:4px">Map / Recommendation Link</label>
          <input id="map-link-url" type="text" value="${j.mapUrl||''}" placeholder="Google Maps, Nearmap, PDF link..." 
            style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:8px;font-size:.8rem"
            onchange="saveMapMeta('${j.id}')"/>
        </div>
        <div style="display:flex;align-items:flex-end;gap:6px">
          ${j.agworldUrl?`<a href="${j.agworldUrl}" target="_blank" style="padding:8px 12px;background:#22c55e;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;text-decoration:none">Open Agworld ↗</a>`:''}
          ${j.mapUrl?`<a href="${j.mapUrl}" target="_blank" style="padding:8px 12px;background:#3b82f6;color:#fff;border-radius:8px;font-size:.75rem;font-weight:700;text-decoration:none">Open Map ↗</a>`:''}
        </div>
      </div>

      <!-- Paddock summary (ha from map) -->
      ${(j.paddockGeo||[]).length>0?`<div style="background:#f0f9ff;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:.8rem;color:#1a3a5c;font-weight:600">📐 ${(j.paddockGeo||[]).length} paddock${(j.paddockGeo||[]).length!==1?'s':''} mapped · ${(j.paddockGeo||[]).reduce((s,p)=>s+(p.hectares||0),0).toFixed(1)} ha total</div>`:''}

      <!-- Map container (hidden by default, shown on toggle) -->
      <div id="job-map-panel" style="display:none">
        <div id="job-map-container" style="height:380px;border-radius:10px;overflow:hidden;border:2px solid var(--border);margin-bottom:10px;position:relative">
          <div id="job-map" style="height:100%;width:100%"></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <button onclick="mapTool('polygon')" id="mt-polygon" style="padding:7px 12px;border:2px solid var(--border);border-radius:8px;background:#fff;font-size:.78rem;font-weight:700;cursor:pointer">🔷 Draw Paddock</button>
          <button onclick="mapTool('marker')" id="mt-marker" style="padding:7px 12px;border:2px solid var(--border);border-radius:8px;background:#fff;font-size:.78rem;font-weight:700;cursor:pointer">📍 Mark Hazard</button>
          <button onclick="mapTool('powerline')" id="mt-powerline" style="padding:7px 12px;border:2px solid var(--border);border-radius:8px;background:#fff;font-size:.78rem;font-weight:700;cursor:pointer">⚡ Power Line</button>
          <button onclick="clearMapLayers('${j.id}')" style="padding:7px 12px;border:2px solid #fca5a5;border-radius:8px;background:#fef2f2;color:#dc2626;font-size:.78rem;font-weight:700;cursor:pointer;margin-left:auto">🗑️ Clear All</button>
          <button onclick="saveMapData('${j.id}')" style="padding:7px 16px;border:none;border-radius:8px;background:var(--navy);color:#fff;font-size:.78rem;font-weight:700;cursor:pointer">💾 Save Map</button>
        </div>
        <div id="map-saved-msg" style="font-size:.75rem;color:var(--green);display:none;text-align:right;margin-bottom:4px">✅ Map saved to job</div>
        <div style="font-size:.7rem;color:var(--muted)">Click Draw Paddock then click corners on the map. Double-click to finish. Drag to adjust.</div>
      </div>
    </div>

    <!-- Schedule Assignment -->
    <div class="msec">
      <div class="msec-title">📅 Schedule Assignment</div>
      <div class="assign-grid">
        <div class="fg"><label>Aircraft</label><select id="m-aircraft">${aircraftOpts}</select></div>
        <div class="fg"><label>Pilot</label><select id="m-pilot"><option value="">-- Select --</option>${pilotOpts}</select></div>
        <div class="fg"><label>Mixer</label><select id="m-mixer"><option value="">-- Select --</option>${mixerOpts}</select></div>
        <div class="fg"><label>Scheduled Date</label><input type="date" id="m-date" value="${j.schedule?.scheduledDate||j.preferredDate||''}"/></div>
      </div>
      <div class="fg" style="margin-top:10px"><label>Internal Notes</label><textarea id="m-notes" rows="2">${j.notes||''}</textarea></div>
      <button class="btn btn-navy btn-sm" style="margin-top:10px" onclick="saveSchedule('${j.id}')">💾 Save Assignment</button>
    </div>

    <!-- Status -->
    <div class="msec">
      <div class="msec-title">Job Status</div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
        <select id="m-status" style="padding:8px 12px;border:1.5px solid var(--border);border-radius:8px;font-size:.88rem;flex:1">${statusOpts}</select>
        <button class="btn btn-green btn-sm" onclick="updateStatus('${j.id}')">✅ Update</button>
      </div>
    </div>


    <!-- Pilot Completion Record -->
    ${j.completion?`<div class="msec" style="border:2px solid #2d7a45;border-radius:12px">
      <div class="msec-title" style="color:#065f46">✅ Pilot Completion Record</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;font-size:.82rem;margin-bottom:10px">
        <div><span style="color:var(--muted)">Date:</span> <strong>${j.completion.date||'—'}</strong></div>
        <div><span style="color:var(--muted)">Pilot:</span> <strong>${j.completion.pilot||'—'}</strong></div>
        <div><span style="color:var(--muted)">Aircraft:</span> <strong>${j.completion.aircraft||'—'}</strong></div>
        <div><span style="color:var(--muted)">Mixer:</span> <strong>${j.completion.mixer||'—'}</strong></div>
        <div><span style="color:var(--muted)">VDO Start:</span> <strong>${j.completion.vdoStart||'—'}</strong></div>
        <div><span style="color:var(--muted)">VDO Stop:</span> <strong>${j.completion.vdoStop||'—'}</strong></div>
        <div><span style="color:var(--muted)">Takeoff:</span> <strong>${j.completion.takeoffTime||'—'}</strong></div>
        <div><span style="color:var(--muted)">Landing:</span> <strong>${j.completion.landingTime||'—'}</strong></div>
        <div><span style="color:var(--muted)">Starts:</span> <strong>${j.completion.numStarts||'—'}</strong></div>
        <div><span style="color:var(--muted)">Landings:</span> <strong>${j.completion.numLandings||'—'}</strong></div>
        <div><span style="color:var(--muted)">Swath:</span> <strong>${j.completion.swath?j.completion.swath+'m':'—'}</strong></div>
        <div><span style="color:var(--muted)">App Rate:</span> <strong>${j.completion.volRateActual||'—'}</strong></div>
        <div><span style="color:var(--muted)">Dispersal:</span> <strong>${j.completion.dispersal||'—'}</strong></div>
        <div><span style="color:var(--muted)">Droplet:</span> <strong>${j.completion.droplet||'N/A'}</strong></div>
      </div>
      ${j.completion.weather?`<div style="background:#f0fdf4;border-radius:8px;padding:10px;font-size:.82rem">
        <div style="font-weight:700;color:#065f46;margin-bottom:6px">🌤️ Weather at Application</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px">
          <div><span style="color:var(--muted)">Temp:</span> <strong>${j.completion.weather.tempC??'—'}°C</strong></div>
          <div><span style="color:var(--muted)">RH:</span> <strong>${j.completion.weather.rh??'—'}%</strong></div>
          <div><span style="color:var(--muted)">Delta T:</span> <strong>${j.completion.weather.deltaT??'—'}°C</strong></div>
          <div><span style="color:var(--muted)">Wind:</span> <strong>${j.completion.weather.windSpeed??'—'} km/h</strong></div>
          <div><span style="color:var(--muted)">Dir:</span> <strong>${j.completion.weather.windDir||'—'}</strong></div>
        </div>
      </div>`:''}
      ${j.completion.submittedAt?`<div style="font-size:.7rem;color:var(--muted);margin-top:8px">Submitted: ${new Date(j.completion.submittedAt).toLocaleString('en-AU')}</div>`:''}
    </div>`:''}

    <!-- Actions -->
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
      <button class="btn btn-ghost btn-sm" onclick="editJob('${j.id}')">✏️ Edit Job</button>
      <button class="btn btn-red btn-sm" onclick="deleteJob('${j.id}')">🗑️ Delete</button>
    </div>`;
}

function saveSchedule(id){
  const j = jobs.find(j=>j.id===id); if(!j) return;
  j.schedule = {
    aircraft: document.getElementById('m-aircraft').value,
    pilot:    document.getElementById('m-pilot').value,
    mixer:    document.getElementById('m-mixer').value,
    scheduledDate: document.getElementById('m-date').value
  };
  j.notes = document.getElementById('m-notes').value;
  if(j.schedule.aircraft && j.schedule.pilot) j.status='scheduled';
  saveJob(j); renderJobs(); openJob(id);
}

function updateStatus(id){
  const j = jobs.find(j=>j.id===id); if(!j) return;
  j.status = document.getElementById('m-status').value;
  saveJob(j); renderJobs(); closeModal();
}

function deleteJob(id){
  if(!confirm('Delete this job? This cannot be undone.')) return;
  deleteJobFromDB(id); renderJobs(); closeModal();
}

function editJob(id){
  const j = jobs.find(j=>j.id===id); if(!j) return;
  closeModal();
  switchTab('newjob');
  setTimeout(()=>populateForm(j),100);
}

function closeModal(){window._openJobId=null; document.getElementById('modal-overlay').classList.remove('open'); }
function closeModalOnBg(e){ if(e.target===document.getElementById('modal-overlay')) closeModal(); }

// ═══════════════════════════════════════════════════
// SCHEDULER TAB
// ═══════════════════════════════════════════════════
function changeWeek(dir){ weekOffset+=dir; renderScheduler(); }

// ═══ SHARED STATUS-FILTERED TAB RENDERER ═══
function renderStatusTab({statusFilter, listId, countId, searchId, stripId, emptyMsg, badgeColor, badgeLabel, nextStatus, nextLabel, nextColor}){
  const search=(document.getElementById(searchId)?.value||'').toLowerCase();
  const strip =document.getElementById(stripId)?.value||'all';

  // Populate airstrip filter
  const stripEl=document.getElementById(stripId);
  if(stripEl){
    const strips=[...new Set(jobs.filter(j=>statusFilter.includes(j.status)).map(j=>j.airstrip).filter(Boolean))].sort();
    const cur=stripEl.value;
    stripEl.innerHTML='<option value="all">All Airstrips</option>'+strips.map(s=>`<option${s===cur?' selected':''}>${s}</option>`).join('');
  }

  let filtered=jobs.filter(j=>{
    if(!baseFilter(j)) return false;
    if(!statusFilter.includes(j.status)) return false;
    if(strip!=='all' && j.airstrip!==strip) return false;
    if(search && !JSON.stringify(j).toLowerCase().includes(search)) return false;
    return true;
  }).sort((a,b)=>(a.preferredDate||'').localeCompare(b.preferredDate||''));

  const cEl=document.getElementById(countId);
  if(cEl) cEl.textContent=filtered.length+' job'+(filtered.length!==1?'s':'');
  const el=document.getElementById(listId);
  if(!el) return;

  if(!filtered.length){
    el.innerHTML=`<div class="empty-state"><div class="esi">✅</div><p>${emptyMsg}</p></div>`;
    return;
  }

  el.innerHTML=filtered.map(j=>{
    const est=estimateJob(j);
    const type2=jobType(j);
    const pads=(j.paddocks||[]).filter(p=>p.name||p.ha).length;
    const prods=(j.products||[]).filter(p=>p.name).length;
    const sched=j.schedule?.aircraft?`✈️ ${j.schedule.aircraft} · ${j.schedule.pilot||'—'}`:'';
    const cost=est.cost>0?`<span style="font-weight:800;color:var(--green)">$${est.cost.toLocaleString('en-AU',{maximumFractionDigits:0})}</span>`:'';
    const invoice=j.billingTotal>0?`<span style="font-weight:800;color:#7c3aed">$${Number(j.billingTotal).toLocaleString('en-AU',{maximumFractionDigits:0})} inv</span>`:'';
    return `<div class="job-card" onclick="openJob('${j.id}')" style="cursor:pointer;border-left:4px solid ${badgeColor}">
      <div class="job-header">
        <div>
          <span class="job-client">${j.client||'—'}</span>
          <span class="job-sub">${j.address||''} · ${j.airstrip||''}</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end">
          <span class="badge" style="background:${badgeColor}">${badgeLabel}</span>
          <span class="badge badge-${type2.toLowerCase()}">${type2.toUpperCase()}</span>
        </div>
      </div>
      <div class="job-meta">
        ${sched?`<span>${sched}</span>`:''}
        ${j.preferredDate?`<span>📅 ${j.preferredDate}</span>`:''}
        ${est.totalHa?`<span>🌾 ${est.totalHa} ha</span>`:''}
        ${cost}${invoice}
        ${pads?`<span>📍 ${pads} paddock${pads!==1?'s':''}</span>`:''}
        ${prods?`<span>🧪 ${prods} product${prods!==1?'s':''}</span>`:''}
      </div>
      ${nextStatus?`<div style="margin-top:8px;text-align:right">
        <button class="btn btn-sm" style="background:${nextColor};color:#fff" onclick="event.stopPropagation();setJobStatus('${j.id}','${nextStatus}')">
          ${nextLabel}
        </button>
      </div>`:''}
    </div>`;
  }).join('');
}

function renderPilotDone(){
  renderStatusTab({
    statusFilter:['pilot_complete'], listId:'pd-list', countId:'pd-count',
    searchId:'pd-search', stripId:'pd-airstrip',
    emptyMsg:'No jobs awaiting pricing',
    badgeColor:'#7c3aed', badgeLabel:'PILOT COMPLETE',
    nextStatus:'priced', nextLabel:'✅ Mark as Priced →', nextColor:'#16a34a'
  });
}

function renderPriced(){
  renderStatusTab({
    statusFilter:['priced'], listId:'pr-list', countId:'pr-count',
    searchId:'pr-search', stripId:'pr-airstrip',
    emptyMsg:'No jobs awaiting invoicing',
    badgeColor:'#16a34a', badgeLabel:'PRICED',
    nextStatus:null, nextLabel:'', nextColor:''
  });
}

function renderInvoiced(){
  renderStatusTab({
    statusFilter:['invoiced'], listId:'inv-list', countId:'inv-count',
    searchId:'inv-search', stripId:'inv-airstrip',
    emptyMsg:'No invoiced jobs',
    badgeColor:'#6b7280', badgeLabel:'INVOICED',
    nextStatus:null, nextLabel:'', nextColor:''
  });
}

function setJobStatus(jobId, newStatus){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  j.status=newStatus;
  lsSave();
  fsSaveJob(j).catch(e=>console.warn('setJobStatus save:',e));
  if(currentTab==='pilotdone') renderPilotDone();
  if(currentTab==='priced') renderPriced();
  if(currentTab==='invoiced') renderInvoiced();
  renderJobs();
}

function renderScheduler(){
  const now  = new Date();
  const base = new Date(now);
  base.setDate(now.getDate() - now.getDay() + 1 + weekOffset*7); // Monday
  const days = [];
  for(let i=0;i<7;i++){ const d=new Date(base); d.setDate(base.getDate()+i); days.push(d); }

  const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  // Use Adelaide timezone to avoid UTC date rollover issues
  const todayStr = new Date().toLocaleDateString('en-CA',{timeZone:'Australia/Adelaide'});

  document.getElementById('week-label').textContent =
    days[0].toLocaleDateString('en-AU',{day:'numeric',month:'short'})+' – '+
    days[6].toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});

  // Jobs with any date go to calendar; jobs with no date go to pool
  const getCalDate = j => j.schedule?.scheduledDate || j.preferredDate || '';
  const scheduled = jobs.filter(j=>getCalDate(j) && !['pilot_complete','invoiced'].includes(j.status) && baseFilter(j));
  const unscheduled = jobs.filter(j=>!getCalDate(j) && !['pilot_complete','invoiced'].includes(j.status) && baseFilter(j));

  const grid = document.getElementById('week-grid');
  grid.innerHTML = days.map((d,i)=>{
    const ds = d.toLocaleDateString('en-CA',{timeZone:'Australia/Adelaide'});
    const dayJobs = scheduled.filter(j=>getCalDate(j)===ds);
    const isToday = ds===todayStr;

    // Summary counts — split by operation type
    const SPREAD_TYPES=['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
    const mistingJobs = dayJobs.filter(j=>(j.products||[]).some(p=>p.type==='Misting'));
    const spreadJobs  = dayJobs.filter(j=>(j.products||[]).some(p=>SPREAD_TYPES.includes(p.type)));
    const sprayJobs   = dayJobs.filter(j=>!mistingJobs.includes(j)&&!spreadJobs.includes(j));
    const sprayHa     = sprayJobs.reduce((s,j)=>(j.paddocks||[]).reduce((a,p)=>a+(parseFloat(p.ha)||0),s),0);
    const spreadHa    = spreadJobs.reduce((s,j)=>(j.paddocks||[]).reduce((a,p)=>a+(parseFloat(p.ha)||0),s),0);
    const mistingHa   = mistingJobs.reduce((s,j)=>(j.paddocks||[]).reduce((a,p)=>a+(parseFloat(p.ha)||0),s),0);

    // Per-type, per-airstrip breakdown helper
    function airstripsFor(jobList){
      const map={};
      jobList.forEach(j=>{
        const as=(j.airstrip||'').trim()||'No Airstrip';
        if(!map[as]) map[as]=0;
        map[as]+=(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
      });
      return Object.entries(map).map(([as,ha])=>
        `<div style="display:flex;justify-content:space-between;font-size:.65rem;padding:1px 0 1px 8px;color:var(--muted)">
          <span style="font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:65%">${as}</span>
          <span style="white-space:nowrap">${ha.toFixed(0)} ha</span>
        </div>`
      ).join('');
    }

    // Helper to render a single job pill with status + progress
    function jobPill(j){
      const mp = j.mixProgress;
      const loadsC = mp ? (mp.loadsComplete||0) : 0;
      const loadsT = mp ? (mp.loadsTotal||1) : 1;
      const pct = Math.min(100, Math.round((loadsC/loadsT)*100));
      const isIP = j.status==='in_progress';
      const isPC = j.status==='pilot_complete';
      const est  = estimateJob(j);
      const ha   = est.totalHa.toFixed(0);
      const cls  = (j.products||[]).some(p=>['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'].includes(p.type)) ? 'spread'
                 : (j.products||[]).some(p=>p.type==='Misting') ? 'misting' : 'spray';
      const bg   = est.isHerb?'#fee2e2':cls==='spread'?'#fef9c3':cls==='misting'?'#e0e7ff':'#dbeafe';
      const borderL = est.isHerb ? 'border-left:3px solid #dc2626;' : '';
      const herbLabel = est.isHerb ? '<span style="font-size:.6rem;color:#dc2626;font-weight:800">🌿 HERB </span>' : '';
      const bar  = isIP||isPC ? `
        <div style="height:4px;background:rgba(0,0,0,.1);border-radius:3px;margin-top:4px;overflow:hidden">
          <div style="height:100%;background:${isPC?'#16a34a':'#2563eb'};width:${pct}%;border-radius:3px;transition:.3s"></div>
        </div>
        <div style="font-size:.6rem;color:#374151;margin-top:2px">${loadsC}/${loadsT} loads${isPC?' ✅':' 🔵'}</div>
      ` : '';
      const acIcon = isPC?'✅ ':isIP?'🔵 ':'';
      return `<div style="background:${bg};${borderL}border-radius:6px;padding:4px 6px;margin-bottom:3px;cursor:pointer" onclick="openJob('${j.id}')">
        <div style="font-size:.72rem;font-weight:700;${est.isHerb?'color:#dc2626':''}">${herbLabel}${acIcon}${j.clientName||'—'} · ${ha} ha</div>
        <div style="font-size:.62rem;color:#6b7280">${j.airstrip||'—'} · ${j.schedule?.aircraft||'—'}</div>
        ${bar}
      </div>`;
    }

    const summaryHtml = dayJobs.length===0
      ? '<div style="font-size:.7rem;color:#ccc;padding:6px 0;text-align:center">—</div>'
      : dayJobs.map(j=>jobPill(j)).join('');

    // Total block hours for the day
    const totalBlockHrs = dayJobs.reduce((s,j)=>s+estimateJob(j).breakdown.blockTime,0);
    const hrsLabel = totalBlockHrs>0
      ? (Math.floor(totalBlockHrs)+'h '+(Math.round((totalBlockHrs%1)*60))+'m')
      : '';

    return `<div class="day-col${isToday?' today':''}" style="min-height:90px">
      <div class="day-name" style="cursor:pointer" onclick="openDayPlan('${ds}')">${dayNames[i]}</div>
      <div class="day-num" style="cursor:pointer;text-decoration:underline dotted" onclick="openDayPlan('${ds}')">${d.getDate()}</div>
      ${hrsLabel?`<div style="font-size:.75rem;font-weight:800;color:var(--orange);margin-bottom:5px;text-align:center">⏱ ${hrsLabel}</div>`:'<div style="margin-bottom:5px"></div>'}
      ${summaryHtml}
    </div>`;
  }).join('');

  const ulist = document.getElementById('unscheduled-list');
  if(!ulist) return;
  if(!unscheduled.length){
    ulist.innerHTML='<div style="font-size:.83rem;color:var(--muted);padding:8px 0">All jobs are scheduled ✅</div>';
    return;
  }
  ulist.innerHTML = unscheduled.map(j=>{
    const est=estimateJob(j);
    return `<div class="pool-item" onclick="openJob('${j.id}')">
      <div>
        <div style="font-weight:700;font-size:.88rem">${j.clientName||'—'}</div>
        <div style="font-size:.75rem;color:var(--muted)">${fmtDate(j.preferredDate)} · ${j.airstrip||'—'} · ${est.totalHa.toFixed(0)} ha</div>
      </div>
      <span class="badge b-${j.status||'new'}">${statusLabel(j.status||'new')}</span>
    </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════
// NEW JOB FORM
// ═══════════════════════════════════════════════════
function initForm(){
  if(!document.getElementById('paddock-tbody').children.length) addPaddockRow();
  if(!document.getElementById('product-tbody').children.length) addProductRow();
  const dateEl = document.querySelector('[name="preferredDate"]');
  if(dateEl && !dateEl.value) dateEl.valueAsDate = new Date();
}

function paddockRowHTML(){
  return `<tr>
    <td><input type="text" name="pd_name[]" placeholder="Paddock name"/></td>
    <td><input type="number" name="pd_ha[]" placeholder="0" step="any" style="width:70px" oninput="recalcAllProductRows()"/></td>
    <td><select name="pd_crop[]">${CROP_TYPES.map(c=>`<option>${c}</option>`).join('')}</select></td>
    <td><button type="button" onclick="removeRow(this)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:1rem;padding:4px">✕</button></td>
  </tr>`;
}

const SPREAD_PROD=['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];

function setAppType(type){
  document.getElementById('apptype-hidden').value=type;
  const isSpread=(type==='spread');
  // Button active states
  const sprayBtn=document.getElementById('apptype-spray');
  const spreadBtn=document.getElementById('apptype-spread');
  sprayBtn.style.background  = isSpread?'rgba(255,255,255,.12)':'rgba(255,255,255,.9)';
  sprayBtn.style.color       = isSpread?'rgba(255,255,255,.6)':'#1a3a5c';
  sprayBtn.style.borderColor = isSpread?'rgba(255,255,255,.3)':'rgba(255,255,255,.9)';
  spreadBtn.style.background = isSpread?'rgba(255,255,255,.9)':'rgba(255,255,255,.12)';
  spreadBtn.style.color      = isSpread?'#ca8a04':'rgba(255,255,255,.6)';
  spreadBtn.style.borderColor= isSpread?'rgba(255,255,255,.9)':'rgba(255,255,255,.3)';
  // Show/hide fields
  document.getElementById('row-waterrate').style.display      = isSpread?'none':'';
  document.getElementById('row-spread-extras').style.display  = isSpread?'':'none';
  document.getElementById('row-chemdelivery').style.display   = isSpread?'none':'';
  // Products header + default unit
  document.getElementById('products-sec-title').childNodes[0].textContent = isSpread?'Products (Dry / Granular) ':'Products ';
  document.getElementById('prod-rate-hdr').textContent = isSpread?'Rate (kg/ha)':'Rate (L/ha)';
  // Update existing product rows
  document.querySelectorAll('#product-tbody [name="pr_unit[]"]').forEach(sel=>{
    sel.value = isSpread?'kg/ha':'L/ha';
  });
  recalcAllProductRows();
}

function getTotalHaFromForm(){
  return [...document.querySelectorAll('#paddock-tbody [name="pd_ha[]"]')].reduce((s,e)=>s+(parseFloat(e.value)||0),0);
}
function recalcProductRow(el){
  const tr=el.closest('tr');
  const rate=parseFloat(tr.querySelector('[name="pr_rate[]"]').value)||0;
  const totalHa=getTotalHaFromForm();
  const totEl=tr.querySelector('[name="pr_total[]"]');
  if(rate>0&&totalHa>0) totEl.value=(rate*totalHa).toFixed(1);
}
function onProdTypeChange(sel){
  const tr=sel.closest('tr');
  const isSpread=SPREAD_PROD.includes(sel.value);
  const unitSel=tr.querySelector('[name="pr_unit[]"]');
  unitSel.value=isSpread?'kg/ha':'L/ha';
  recalcProductRow(sel);
}
function recalcAllProductRows(){
  document.querySelectorAll('#product-tbody tr').forEach(tr=>{
    const rateEl=tr.querySelector('[name="pr_rate[]"]');
    if(rateEl) recalcProductRow(rateEl);
  });
  recalcWaterTotal();
}
function recalcWaterTotal(){
  const ha=getTotalHaFromForm();
  const wr=parseFloat(document.querySelector('[name="waterRate"]')?.value)||0;
  const el=document.getElementById('water-total-display');
  if(el) el.textContent=ha>0&&wr>0?(ha*wr).toFixed(0)+' L total':'';
}

function productRowHTML(){
  return `<tr>
    <td><input type="text" name="pr_name[]" placeholder="Product name"/></td>
    <td><select name="pr_type[]" onchange="onProdTypeChange(this)">${PROD_TYPES.map(c=>`<option>${c}</option>`).join('')}</select></td>
    <td><input type="number" name="pr_rate[]" placeholder="0" step="any" style="width:65px" oninput="recalcProductRow(this)"/></td>
    <td><select name="pr_unit[]"><option>L/ha</option><option>kg/ha</option></select></td>
    <td><input type="number" name="pr_total[]" placeholder="auto" step="any" style="width:75px"/></td>
    <td><button type="button" onclick="removeRow(this)" style="background:none;border:none;color:var(--red);cursor:pointer;font-size:1rem;padding:4px">✕</button></td>
  </tr>`;
}

function addPaddockRow(){ document.getElementById('paddock-tbody').insertAdjacentHTML('beforeend',paddockRowHTML()); }
function addProductRow(){ document.getElementById('product-tbody').insertAdjacentHTML('beforeend',productRowHTML()); }
function removeRow(btn){ btn.closest('tr').remove(); }
function toggleReveal(id,show){ document.getElementById(id).style.display=show?'':'none'; }

function getFormData(){
  const f = document.getElementById('new-job-form');
  const fd = new FormData(f);
  const pNames=[...f.querySelectorAll('[name="pd_name[]"]')].map(e=>e.value);
  const pHa   =[...f.querySelectorAll('[name="pd_ha[]"]')].map(e=>parseFloat(e.value)||0);
  const pCrop =[...f.querySelectorAll('[name="pd_crop[]"]')].map(e=>e.value);
  const paddocks = pNames.map((n,i)=>({name:n,ha:pHa[i],cropType:pCrop[i]})).filter(p=>p.name||p.ha);
  const prNames=[...f.querySelectorAll('[name="pr_name[]"]')].map(e=>e.value);
  const prType=[...f.querySelectorAll('[name="pr_type[]"]')].map(e=>e.value);
  const prRate=[...f.querySelectorAll('[name="pr_rate[]"]')].map(e=>parseFloat(e.value)||0);
  const prUnit=[...f.querySelectorAll('[name="pr_unit[]"]')].map(e=>e.value);
  const prTot =[...f.querySelectorAll('[name="pr_total[]"]')].map(e=>parseFloat(e.value)||0);
  const products = prNames.map((n,i)=>({name:n,type:prType[i],rate:prRate[i],unit:prUnit[i],totalRequired:prTot[i]})).filter(p=>p.name);
  return {
    base:fd.get('base')||'', clientName:fd.get('clientName'),agentName:fd.get('agentName'),
    subName:fd.get('subName'),subEmail:fd.get('subEmail'),subMobile:fd.get('subMobile'),
    invoiceTo:fd.get('invoiceTo'),preferredDate:fd.get('preferredDate'),
    airstrip:fd.get('airstrip'),farmAddress:fd.get('farmAddress'),
    windDirectionRequired:fd.get('windDirectionRequired'),
    waterRate:parseFloat(fd.get('waterRate'))||30,
    hasRecommendation:fd.get('hasRecommendation'),
    mapUploaded:fd.get('mapUploaded'),
    chemDelivery:fd.get('chemDelivery'),
    additionalComments:fd.get('additionalComments'),
    jobNotes:fd.get('jobNotes')||'',
    additionalHazards:fd.get('additionalHazards')||'',
    paddocks, products,
    hazards:{
      powerlines:fd.get('h_powerlines'),powerlinesDesc:fd.get('h_powerlinesDesc'),
      susceptibleCrops:fd.get('h_susceptibleCrops'),susceptibleDesc:fd.get('h_susceptibleDesc'),
      dwelling:fd.get('h_dwelling'),
      neighboursNotified:fd.get('h_neighboursNotified'),
      neighboursConcern:fd.get('h_neighboursConcern'),neighboursDesc:fd.get('h_neighboursDesc'),
    }
  };
}

function saveNewJob(e){
  e.preventDefault();
  const data = getFormData();
  const editId = document.getElementById('edit-job-id').value;
  if(editId){
    const idx = jobs.findIndex(j=>j.id===editId);
    if(idx>=0){ jobs[idx]={...jobs[idx],...data}; saveJob(jobs[idx]); }
  } else {
    const autoStatus = data.preferredDate ? 'scheduled' : 'new';
    const nj={id:Date.now().toString(),status:autoStatus,createdAt:new Date().toISOString(),schedule:{scheduledDate:data.preferredDate||''},...data};
    jobs.push(nj); saveJob(nj);
  }
  resetForm();
  alert('✅ Job saved!');
  switchTab('jobs');
}

function resetForm(){
  document.getElementById('new-job-form').reset();
  document.getElementById('edit-job-id').value='';
  document.getElementById('paddock-tbody').innerHTML='';
  document.getElementById('product-tbody').innerHTML='';
  addPaddockRow(); addProductRow(); setAppType('spray');
  ['rev-pl','rev-sc','rev-nc'].forEach(id=>document.getElementById(id).style.display='none');
}

function populateForm(j){
  const f = document.getElementById('new-job-form');
  document.getElementById('edit-job-id').value=j.id;
  const set=(n,v)=>{ const el=f.querySelector('[name="'+n+'"]'); if(el) el.value=v||''; };
  set('clientName',j.clientName);set('agentName',j.agentName);
  set('subName',j.subName);set('subEmail',j.subEmail);set('subMobile',j.subMobile);
  set('invoiceTo',j.invoiceTo);set('preferredDate',j.preferredDate);
  set('airstrip',j.airstrip);set('farmAddress',j.farmAddress);
  set('windDirectionRequired',j.windDirectionRequired);
  set('waterRate',j.waterRate);set('hasRecommendation',j.hasRecommendation);
  set('mapUploaded',j.mapUploaded);set('chemDelivery',j.chemDelivery);
  set('additionalComments',j.additionalComments);
  const h=j.hazards||{};
  set('h_powerlines',h.powerlines);set('h_powerlinesDesc',h.powerlinesDesc);
  set('h_susceptibleCrops',h.susceptibleCrops);set('h_susceptibleDesc',h.susceptibleDesc);
  set('h_dwelling',h.dwelling);set('h_neighboursNotified',h.neighboursNotified);
  set('h_neighboursConcern',h.neighboursConcern);set('h_neighboursDesc',h.neighboursDesc);
  // Reveal hazard sections
  if(h.powerlines==='yes') document.getElementById('rev-pl').style.display='';
  if(h.susceptibleCrops==='yes') document.getElementById('rev-sc').style.display='';
  if(h.neighboursConcern==='yes') document.getElementById('rev-nc').style.display='';
  // Paddocks
  document.getElementById('paddock-tbody').innerHTML='';
  (j.paddocks||[{name:'',ha:0,cropType:'Wheat'}]).forEach(p=>{
    addPaddockRow();
    const rows=document.querySelectorAll('#paddock-tbody tr');
    const last=rows[rows.length-1];
    last.querySelector('[name="pd_name[]"]').value=p.name||'';
    last.querySelector('[name="pd_ha[]"]').value=p.ha||'';
    last.querySelector('[name="pd_crop[]"]').value=p.cropType||'Wheat';
  });
  // Products
  document.getElementById('product-tbody').innerHTML='';
  (j.products||[{name:'',type:'Herbicide',rate:0,unit:'L/ha',totalRequired:0}]).forEach(p=>{
    addProductRow();
    const rows=document.querySelectorAll('#product-tbody tr');
    const last=rows[rows.length-1];
    last.querySelector('[name="pr_name[]"]').value=p.name||'';
    last.querySelector('[name="pr_type[]"]').value=p.type||'Herbicide';
    last.querySelector('[name="pr_rate[]"]').value=p.rate||'';
    last.querySelector('[name="pr_unit[]"]').value=p.unit||'L/ha';
    last.querySelector('[name="pr_total[]"]').value=p.totalRequired||'';
  });
  document.querySelector('.content#view-newjob').scrollTop=0;
}

// ─── JotForm Import ───────────────────────────────
function importJotForm(){
  const raw = document.getElementById('jotform-json').value.trim();
  if(!raw){ alert('Paste JotForm JSON first.'); return; }
  try{
    const d = JSON.parse(raw);
    const find=(keys)=>{for(const k of keys){for(const dk in d){if(dk.toLowerCase().includes(k.toLowerCase())&&d[dk]) return d[dk];}}return '';};
    const job={
      id:Date.now().toString(), status:(find(['preferredDate','applicationDate','date'])?'scheduled':'new'), createdAt:new Date().toISOString(), schedule:{scheduledDate:find(['preferredDate','applicationDate','date'])||''},
      clientName:find(['clientTrading','clientName','client']),
      agentName:find(['agentName','agronomist','agent']),
      preferredDate:find(['preferredDate','applicationDate','date']),
      farmAddress:find(['farmAddress','address','farm']),
      airstrip:find(['airstrip','strip']),
      windDirectionRequired:find(['windDirection','wind']),
      waterRate:parseFloat(find(['waterRate','water']))||30,
      hasRecommendation:find(['recommendation','recommend'])?'yes':'no',
      mapUploaded:find(['map','mapProvided'])?'yes':'no',
      invoiceTo:find(['invoiceTo','invoice'])||'Client',
      subName:find(['submitterName','personName','name']),
      subEmail:find(['submitterEmail','personEmail','email']),
      subMobile:find(['mobile','phone']),
      additionalComments:find(['comments','additional','notes']),
      paddocks:[],products:[],
      hazards:{
        powerlines:find(['powerline','powerLines'])?'yes':'no',
        susceptibleCrops:find(['susceptible'])?'yes':'no',
        dwelling:find(['dwelling','150m'])?'yes':'no',
        neighboursNotified:find(['neighbours','neighbors'])?'yes':'no',
        neighboursConcern:'no',
      }
    };
    jobs.push(job);
    saveJob(job);
    document.getElementById('jotform-json').value='';
    alert('✅ Job imported from JotForm!');
    switchTab('jobs');
  } catch(err){ alert('❌ Could not parse JSON: '+err.message); }
}

// ═══════════════════════════════════════════════════
// RECORDS TAB
// ═══════════════════════════════════════════════════
function recSetPeriod(){
  const p=document.getElementById('rec-period')?.value||'custom';
  const now=new Date();
  const y=now.getFullYear(), m=now.getMonth();
  let f='',t='';
  if(p==='thismonth'){f=`${y}-${String(m+1).padStart(2,'0')}-01`;t=new Date(y,m+1,0).toISOString().slice(0,10);}
  else if(p==='lastmonth'){const lm=m===0?12:m,ly=m===0?y-1:y;f=`${ly}-${String(lm).padStart(2,'0')}-01`;t=new Date(ly,lm,0).toISOString().slice(0,10);}
  else if(p==='thisquarter'){const q=Math.floor(m/3);f=`${y}-${String(q*3+1).padStart(2,'0')}-01`;t=new Date(y,q*3+3,0).toISOString().slice(0,10);}
  else if(p==='lastquarter'){const q=Math.floor(m/3);const lq=(q===0)?3:q-1;const lqy=(q===0)?y-1:y;f=`${lqy}-${String(lq*3+1).padStart(2,'0')}-01`;t=new Date(lqy,lq*3+3,0).toISOString().slice(0,10);}
  else if(p==='thisyear'){f=`${y}-01-01`;t=`${y}-12-31`;}
  else if(p==='lastyear'){f=`${y-1}-01-01`;t=`${y-1}-12-31`;}
  else if(p==='all'){f='';t='';}
  const fEl=document.getElementById('rec-from');const tEl=document.getElementById('rec-to');
  if(fEl)fEl.value=f;if(tEl)tEl.value=t;
  renderRecords();
}
window.recSetPeriod=recSetPeriod;

function recPilotOpt(key, val){
  const opts=JSON.parse(localStorage.getItem('at_pilotPayOpts')||'{}');
  opts[key]=val;
  localStorage.setItem('at_pilotPayOpts', JSON.stringify(opts));
  renderRecords();
}
window.recPilotOpt=recPilotOpt;

function renderRecords(){
  const search=(document.getElementById('rec-search')?.value||'').toLowerCase();
  const from  =document.getElementById('rec-from')?.value||'';
  const to    =document.getElementById('rec-to')?.value||'';
  const aircraft=document.getElementById('rec-aircraft')?.value||'all';
  const pilotF=document.getElementById('rec-pilot')?.value||'all';
  const statusF=document.getElementById('rec-status')?.value||'all';

  // Populate pilot dropdown from jobs + settings (refresh every render)
  const pilotEl=document.getElementById('rec-pilot');
  if(pilotEl){
    const curPilot=pilotEl.value;
    const staff2=getStaff();
    // Collect all pilots from jobs AND settings
    const pilotSet=new Set();
    jobs.filter(j=>['pilot_complete','invoiced'].includes(j.status)).forEach(j=>{
      const p=j.completion?.pilot||j.schedule?.pilot;
      if(p)pilotSet.add(p);
    });
    (staff2.pilots||[]).forEach(p=>{if(p.name)pilotSet.add(p.name);});
    pilotEl.innerHTML='<option value="all">All Pilots</option>'+[...pilotSet].sort().map(p=>`<option value="${p}">${p}</option>`).join('');
    if(curPilot&&curPilot!=='all')pilotEl.value=curPilot;
  }

  // Populate aircraft dropdown from jobs + settings (refresh every render)
  const acEl=document.getElementById('rec-aircraft');
  if(acEl){
    const curAc=acEl.value;
    const staff2=getStaff();
    const acSet=new Set();
    jobs.filter(j=>['pilot_complete','invoiced'].includes(j.status)).forEach(j=>{
      const ac=j.completion?.aircraft||j.schedule?.aircraft;
      if(ac)acSet.add(ac);
    });
    // Also add all known aircraft from settings
    (staff2.aircraftObjs||[]).forEach(a=>{if(a.rego)acSet.add(a.rego);});
    // Fallback: hardcoded fleet
    ['VH-ODV','VH-ODP','VH-ODN','VH-ODZ','VH-OUJ','VH-OUB','VH-ODG','VH-A54'].forEach(r=>acSet.add(r));
    acEl.innerHTML='<option value="all">All Aircraft</option>'+[...acSet].sort().map(a=>`<option value="${a}">${a}</option>`).join('');
    if(curAc&&curAc!=='all')acEl.value=curAc;
  }

  // Helper: get the best date for a job
  const jobDate=j=>j.completion?.date||j.schedule?.scheduledDate||j.preferredDate||'';
  // Helper: actual revenue (use saved actualCost if available, else estimate)
  const jobRev=j=>j.actualCost>0?j.actualCost:estimateJob(j).cost;
  const jobHrs=j=>j.actualHours>0?parseFloat(j.actualHours):estimateJob(j).hours;
  const jobHa =j=>estimateJob(j).totalHa;
  const jobAircraft=j=>j.completion?.aircraft||j.schedule?.aircraft||'—';
  const jobPilot=j=>j.completion?.pilot||j.schedule?.pilot||'—';

  const statusSet = statusF==='invoiced'?['invoiced']:statusF==='pilot_complete'?['pilot_complete']:['pilot_complete','invoiced'];
  const completed=jobs.filter(j=>statusSet.includes(j.status)&&baseFilter(j));

  let filtered=completed.filter(j=>{
    if(aircraft!=='all'&&jobAircraft(j)!==aircraft)return false;
    if(pilotF!=='all'&&jobPilot(j)!==pilotF)return false;
    const d=jobDate(j);
    if(from&&d&&d<from)return false;
    if(to  &&d&&d>to)  return false;
    if(search&&!JSON.stringify(j).toLowerCase().includes(search))return false;
    return true;
  });
  filtered.sort((a,b)=>jobDate(b).localeCompare(jobDate(a)));

  // ── Summary stats ──
  const totalJobs=filtered.length;
  const totalHa=filtered.reduce((s,j)=>s+jobHa(j),0);
  const totalRev=filtered.reduce((s,j)=>s+jobRev(j),0);
  const totalHrs=filtered.reduce((s,j)=>s+jobHrs(j),0);
  const avgHa=totalHa>0?totalRev/totalHa:0;
  const avgHr=totalHrs>0?totalRev/totalHrs:0;
  document.getElementById('records-stats').innerHTML=`
    <div class="stat-card"><div class="sv">${totalJobs}</div><div class="sl">Jobs</div></div>
    <div class="stat-card"><div class="sv">${totalHa.toFixed(0)}</div><div class="sl">Hectares</div></div>
    <div class="stat-card"><div class="sv">${fmtMoney(totalRev)}</div><div class="sl">Actual Revenue</div></div>
    <div class="stat-card"><div class="sv">$${avgHa.toFixed(2)}</div><div class="sl">$/ha</div></div>
    <div class="stat-card"><div class="sv">${totalHrs.toFixed(1)}</div><div class="sl">Total Hours</div></div>
    <div class="stat-card"><div class="sv">${avgHr>0?fmtMoney(Math.round(avgHr)):'-'}</div><div class="sl">Avg $/hr</div></div>`;

  // ── Pilot pay options (persisted in localStorage) ──
  const pilotPayOpts = JSON.parse(localStorage.getItem('at_pilotPayOpts')||'{}');
  const incOther1 = pilotPayOpts.incOther1===true;
  const incOther2 = pilotPayOpts.incOther2===true;

  // Pilot revenue base: strip airstrip charge always; optional charges use per-job flag or global pref
  const jobPilotBase = j => {
    if(j.actualCost>0){
      let base = j.actualCost;
      base -= (j.chemCost||0);
      const o1In = j.other1InPilotPay!==undefined ? j.other1InPilotPay : incOther1;
      const o2In = j.other2InPilotPay!==undefined ? j.other2InPilotPay : incOther2;
      if(!o1In) base -= (j.other1||0);
      if(!o2In) base -= (j.other2||0);
      return Math.max(0, base);
    }
    return estimateJob(j).cost;
  };

  // ── Breakdown panels ──
  // By Pilot
  const staff=getStaff();
  const pilotMap={};
  filtered.forEach(j=>{
    const p=jobPilot(j); const r=jobRev(j); const h=jobHrs(j);
    const base=jobPilotBase(j);
    if(!pilotMap[p])pilotMap[p]={rev:0,hrs:0,jobs:0,pay:0,base:0};
    pilotMap[p].rev+=r; pilotMap[p].hrs+=h; pilotMap[p].jobs++; pilotMap[p].base+=base;
    const pObj=(staff.pilots||[]).find(x=>x.name===p);
    const pct=pObj?.pay||16;
    pilotMap[p].pay+=base*(pct/100);
    pilotMap[p].pct=pct;
  });
  const pilotRows=Object.entries(pilotMap).sort((a,b)=>b[1].rev-a[1].rev).map(([n,v])=>
    `<tr><td>${n}</td><td>${v.jobs}</td><td>${v.hrs.toFixed(1)}</td><td>${fmtMoney(v.rev)}</td><td>${fmtMoney(v.base)}</td><td style="color:#16a34a;font-weight:700">${fmtMoney(v.pay)} <span style="font-size:.7rem;color:var(--muted)">(${v.pct}%)</span></td></tr>`).join('');

  // By Aircraft
  const acMap={};
  filtered.forEach(j=>{
    const ac=jobAircraft(j); const r=jobRev(j); const h=jobHrs(j);
    if(!acMap[ac])acMap[ac]={rev:0,hrs:0,jobs:0};
    acMap[ac].rev+=r; acMap[ac].hrs+=h; acMap[ac].jobs++;
  });
  const acRows=Object.entries(acMap).sort((a,b)=>b[1].rev-a[1].rev).map(([n,v])=>
    `<tr><td>${n}</td><td>${v.jobs}</td><td>${v.hrs.toFixed(1)}</td><td style="font-weight:700">${fmtMoney(v.rev)}</td></tr>`).join('');

  // By Airstrip
  const stripMap={};
  filtered.forEach(j=>{
    const s=j.airstrip||'Unknown'; const r=jobRev(j); const ha=jobHa(j);
    const airRev=(j.chemCost>0&&j.chemDesc&&j.chemDesc.toLowerCase().includes('airstrip'))?j.chemCost:((AIRSTRIP_RATES[s]||0)*ha);
    if(!stripMap[s])stripMap[s]={rev:0,airRev:0,ha:0,jobs:0};
    stripMap[s].rev+=r; stripMap[s].airRev+=airRev; stripMap[s].ha+=ha; stripMap[s].jobs++;
  });
  const stripRows=Object.entries(stripMap).sort((a,b)=>b[1].rev-a[1].rev).map(([n,v])=>
    `<tr><td>${n}</td><td>${v.jobs}</td><td>${v.ha.toFixed(0)}</td><td>${fmtMoney(v.rev)}</td><td style="color:#2563eb">${v.airRev>0?fmtMoney(v.airRev):'—'}</td></tr>`).join('');

  const bpStyle='background:#fff;border:1.5px solid var(--border);border-radius:10px;padding:12px;overflow-x:auto';
  const thStyle='style="font-size:.68rem;font-weight:700;color:var(--muted);text-transform:uppercase;padding:4px 6px;text-align:left;border-bottom:1.5px solid var(--border)"';
  const tdStyle='style="font-size:.75rem;padding:4px 6px;border-bottom:1px solid #f0f0f0"';
  document.getElementById('records-breakdown').innerHTML=`
    <div style="${bpStyle}">
      <div style="font-weight:800;font-size:.8rem;color:var(--navy);margin-bottom:6px">✈️ By Pilot</div>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:8px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <span style="font-size:.7rem;font-weight:700;color:#374151">Include in pay base:</span>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:600">
          <input type="checkbox" ${incOther1?'checked':''} onchange="recPilotOpt('incOther1',this.checked)" style="width:14px;height:14px"> Other Charge 1
        </label>
        <label style="display:flex;align-items:center;gap:4px;cursor:pointer;font-weight:600">
          <input type="checkbox" ${incOther2?'checked':''} onchange="recPilotOpt('incOther2',this.checked)" style="width:14px;height:14px"> Other Charge 2
        </label>
        <span style="font-size:.67rem;color:#9ca3af">Airstrip charge always excluded</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th ${thStyle}>Pilot</th><th ${thStyle}>Jobs</th><th ${thStyle}>Hrs</th><th ${thStyle}>Total Rev</th><th ${thStyle}>Pay Base</th><th ${thStyle}>Pilot Pay</th></tr></thead>
        <tbody style="font-size:.75rem">${pilotRows||'<tr><td colspan="6" style="color:var(--muted);font-size:.75rem;padding:8px">No data</td></tr>'}</tbody>
      </table>
    </div>
    <div style="${bpStyle}">
      <div style="font-weight:800;font-size:.8rem;color:var(--navy);margin-bottom:8px">🛩️ By Aircraft</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th ${thStyle}>Aircraft</th><th ${thStyle}>Jobs</th><th ${thStyle}>Hrs</th><th ${thStyle}>Revenue</th></tr></thead>
        <tbody style="font-size:.75rem">${acRows||'<tr><td colspan="4" style="color:var(--muted);font-size:.75rem;padding:8px">No data</td></tr>'}</tbody>
      </table>
    </div>
    <div style="${bpStyle}">
      <div style="font-weight:800;font-size:.8rem;color:var(--navy);margin-bottom:8px">📍 By Airstrip</div>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr><th ${thStyle}>Airstrip</th><th ${thStyle}>Jobs</th><th ${thStyle}>Ha</th><th ${thStyle}>Revenue</th><th ${thStyle}>Strip Charge</th></tr></thead>
        <tbody style="font-size:.75rem">${stripRows||'<tr><td colspan="5" style="color:var(--muted);font-size:.75rem;padding:8px">No data</td></tr>'}</tbody>
      </table>
    </div>`;

  if(!filtered.length){
    document.getElementById('records-table').innerHTML='<div class="empty-state"><div class="esi">📊</div><p>No records in this period</p></div>';
    return;
  }

  // ── Monthly accordion ──
  const byMonth={};
  filtered.forEach(j=>{
    const d=jobDate(j)||'0000-00';
    const mk=d.slice(0,7); // YYYY-MM
    if(!byMonth[mk])byMonth[mk]=[];
    byMonth[mk].push(j);
  });
  const monthKeys=Object.keys(byMonth).sort((a,b)=>b.localeCompare(a));

  const fmtMonth=mk=>{if(!mk||mk==='0000-00')return 'Unknown';const[y,m]=mk.split('-');return new Date(parseInt(y),parseInt(m)-1,1).toLocaleDateString('en-AU',{month:'long',year:'numeric'});};

  document.getElementById('records-table').innerHTML = monthKeys.map((mk,mi)=>{
    const mJobs=byMonth[mk];
    const mRev=mJobs.reduce((s,j)=>s+jobRev(j),0);
    const mHa=mJobs.reduce((s,j)=>s+jobHa(j),0);
    const mHrs=mJobs.reduce((s,j)=>s+jobHrs(j),0);
    const open=mi===0?'open':'';
    const rows=mJobs.map(j=>{
      const rev=jobRev(j); const ha=jobHa(j); const hrs=jobHrs(j);
      const ac=jobAircraft(j); const pilot=jobPilot(j);
      const pObj=(staff.pilots||[]).find(x=>x.name===pilot);
      const pct=pObj?.pay||16;
      const pilotBase=jobPilotBase(j);
      const pilotPay=pilotBase*(pct/100);
      const isHerb=j.appSubType==='Herbicide'||j.herbOverride==='on';
      const herbBadge=isHerb?'<span style="font-size:.6rem;background:#fee2e2;color:#dc2626;padding:1px 4px;border-radius:4px;font-weight:700">HERB</span>':'';
      const statCol=j.status==='invoiced'?'#16a34a':'#2563eb';
      const weather=j.completion?.weather||'';
      return `<tr onclick="openJob('${j.id}')" style="cursor:pointer;transition:background .1s" onmouseover="this.style.background='#f8fafc'" onmouseout="this.style.background=''">
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;white-space:nowrap">${fmtDate(jobDate(j))}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;font-weight:700">${j.clientName||'—'} ${herbBadge}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0">${j.airstrip||'—'}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0">${ac}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0">${pilot}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0"><span class="badge b-${jobType(j)}">${jobType(j).toUpperCase()}</span></td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right">${ha.toFixed(0)}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right">${hrs.toFixed(1)}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:800;color:${statCol}">${fmtMoney(rev)}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;text-align:right">$${ha>0?(rev/ha).toFixed(2):'—'}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;color:#16a34a">${fmtMoney(pilotPay)}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0;color:var(--muted);font-size:.68rem">${weather}</td>
        <td style="font-size:.75rem;padding:5px 8px;border-bottom:1px solid #f0f0f0"><span style="font-size:.68rem;background:${j.status==='invoiced'?'#d1fae5':'#dbeafe'};color:${statCol};padding:2px 6px;border-radius:6px;font-weight:700">${statusLabel(j.status)}</span></td>
      </tr>`;
    }).join('');
    return `<details ${open} style="margin-bottom:8px;border:1.5px solid var(--border);border-radius:10px;overflow:hidden">
      <summary style="padding:10px 14px;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:.88rem;user-select:none">
        <span>📁 ${fmtMonth(mk)} <span style="font-weight:400;font-size:.78rem;color:var(--muted);margin-left:8px">${mJobs.length} job${mJobs.length!==1?'s':''} · ${mHa.toFixed(0)} ha · ${mHrs.toFixed(1)} hrs</span></span>
        <span style="font-size:1rem;font-weight:800;color:var(--navy)">${fmtMoney(mRev)}</span>
      </summary>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse;min-width:900px">
          <thead style="background:#f0f4f8"><tr>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Date</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Client</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Airstrip</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Aircraft</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Pilot</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Type</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:right;border-bottom:2px solid var(--border)">Ha</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:right;border-bottom:2px solid var(--border)">Hrs</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:right;border-bottom:2px solid var(--border)">Revenue</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:right;border-bottom:2px solid var(--border)">$/ha</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:right;border-bottom:2px solid var(--border)">Pilot Pay</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Weather</th>
            <th style="font-size:.68rem;font-weight:700;color:var(--muted);padding:5px 8px;text-align:left;border-bottom:2px solid var(--border)">Status</th>
          </tr></thead>
          <tbody>${rows}</tbody>
          <tfoot style="background:#f0fdf4"><tr>
            <td colspan="6" style="font-size:.75rem;font-weight:800;padding:6px 8px;color:var(--navy)">MONTH TOTAL</td>
            <td style="font-size:.75rem;font-weight:800;padding:6px 8px;text-align:right">${mHa.toFixed(0)}</td>
            <td style="font-size:.75rem;font-weight:800;padding:6px 8px;text-align:right">${mHrs.toFixed(1)}</td>
            <td style="font-size:.75rem;font-weight:800;padding:6px 8px;text-align:right;color:var(--navy)">${fmtMoney(mRev)}</td>
            <td style="font-size:.75rem;font-weight:800;padding:6px 8px;text-align:right">$${mHa>0?(mRev/mHa).toFixed(2):'—'}</td>
            <td style="font-size:.75rem;font-weight:800;padding:6px 8px;text-align:right;color:#16a34a">${fmtMoney(mJobs.reduce((s,j)=>{const p=(staff.pilots||[]).find(x=>x.name===jobPilot(j));return s+jobPilotBase(j)*((p?.pay||16)/100);},0))}</td>
            <td colspan="2"></td>
          </tr></tfoot>
        </table>
      </div>
    </details>`;
  }).join('');
}

function recExportCSV(){
  const search=(document.getElementById('rec-search')?.value||'').toLowerCase();
  const from=document.getElementById('rec-from')?.value||'';
  const to=document.getElementById('rec-to')?.value||'';
  const aircraft=document.getElementById('rec-aircraft')?.value||'all';
  const pilotF=document.getElementById('rec-pilot')?.value||'all';
  const statusF=document.getElementById('rec-status')?.value||'all';
  const staff=getStaff();
  const jobDate=j=>j.completion?.date||j.schedule?.scheduledDate||j.preferredDate||'';
  const jobRev=j=>j.actualCost>0?j.actualCost:estimateJob(j).cost;
  const jobHrs=j=>j.actualHours>0?parseFloat(j.actualHours):estimateJob(j).hours;
  const jobHa=j=>estimateJob(j).totalHa;
  const jobAircraft=j=>j.completion?.aircraft||j.schedule?.aircraft||'';
  const jobPilot=j=>j.completion?.pilot||j.schedule?.pilot||'';
  const statusSet=statusF==='invoiced'?['invoiced']:statusF==='pilot_complete'?['pilot_complete']:['pilot_complete','invoiced'];
  const filtered=jobs.filter(j=>statusSet.includes(j.status)&&baseFilter(j)).filter(j=>{
    if(aircraft!=='all'&&jobAircraft(j)!==aircraft)return false;
    if(pilotF!=='all'&&jobPilot(j)!==pilotF)return false;
    const d=jobDate(j);
    if(from&&d&&d<from)return false;
    if(to&&d&&d>to)return false;
    if(search&&!JSON.stringify(j).toLowerCase().includes(search))return false;
    return true;
  }).sort((a,b)=>jobDate(b).localeCompare(jobDate(a)));
  const cols=['Date','Client','Farm','Airstrip','Aircraft','Pilot','Type','Herbicide','Ha','Hours','Revenue','$/ha','Pilot Pay %','Pilot Pay $','Takeoff','Landing','VDO Start','VDO Stop','Weather','Notes','Status'];
  const rows=filtered.map(j=>{
    const rev=jobRev(j); const ha=jobHa(j); const hrs=jobHrs(j);
    const pilot=jobPilot(j); const pObj=(staff.pilots||[]).find(x=>x.name===pilot);
    const pct=pObj?.pay||16; const pay=rev*(pct/100);
    const isHerb=j.appSubType==='Herbicide'||j.herbOverride==='on';
    const comp=j.completion||{};
    return [jobDate(j),j.clientName,j.farmAddress,j.airstrip,jobAircraft(j),pilot,jobType(j),isHerb?'Yes':'No',ha.toFixed(0),hrs.toFixed(2),rev.toFixed(2),(ha>0?rev/ha:0).toFixed(2),pct,pay.toFixed(2),comp.takeoffTime,comp.landingTime,comp.vdoStart,comp.vdoStop,comp.weather,j.jobNotes,j.status].map(v=>`"${(v||'').toString().replace(/"/g,'""')}"`);
  });
  const csv=[cols.join(','),...rows.map(r=>r.join(','))].join('\n');
  const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent(csv);a.download=`aerotech-records-${new Date().toISOString().slice(0,10)}.csv`;a.click();
}
window.recExportCSV=recExportCSV;

// ═══════════════════════════════════════════════════
// STAFF CONFIG MODAL
// ═══════════════════════════════════════════════════
// ─── Settings helpers ───────────────────────────────
function cfgAddHopperType(typeName=''){
  const wrap=document.createElement('div');
  wrap.style.cssText='border:1.5px solid var(--border);border-radius:8px;padding:10px;background:#fafbfc';
  const hdr=document.createElement('div');
  hdr.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:8px';
  const nameInp=document.createElement('input');
  nameInp.type='text'; nameInp.placeholder='Aircraft type name (e.g. Cessna 188)';
  nameInp.value=typeName; nameInp.dataset.fid='hopTypeName';
  nameInp.style.cssText='flex:1;padding:7px 8px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem';
  const del=document.createElement('button');
  del.textContent='✕'; del.className='btn btn-sm';
  del.style.cssText='background:#fee2e2;color:#b91c1c;padding:6px 10px';
  del.onclick=()=>wrap.remove();
  hdr.appendChild(nameInp); hdr.appendChild(del);
  const grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px';
  [['Spray / Liquid (L)','hopSpray','3020'],['Urea (kg)','hopUrea','2000'],['Fertiliser (kg)','hopFert','2400'],
   ['Snail Bait (kg)','hopSnail','2000'],['Mouse Bait (kg)','hopMouse','1200'],['Seed (kg)','hopSeed','2000']
  ].forEach(([lbl,fid,def])=>{
    const d=document.createElement('div'); d.className='fg';
    const l=document.createElement('label'); l.textContent=lbl;
    const inp=document.createElement('input'); inp.type='number'; inp.value=def; inp.dataset.fid=fid;
    inp.style.cssText='width:100%;padding:6px 8px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem';
    d.appendChild(l); d.appendChild(inp); grid.appendChild(d);
  });
  wrap.appendChild(hdr); wrap.appendChild(grid);
  document.getElementById('cfg-hopper-extra').appendChild(wrap);
}
function cfgAddSwathType(typeName=''){
  const wrap=document.createElement('div');
  wrap.style.cssText='border:1.5px solid var(--border);border-radius:8px;padding:10px;background:#fafbfc';
  const hdr=document.createElement('div');
  hdr.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:8px';
  const nameInp=document.createElement('input');
  nameInp.type='text'; nameInp.placeholder='Aircraft type name (e.g. Cessna 188)';
  nameInp.value=typeName; nameInp.dataset.fid='swTypeName';
  nameInp.style.cssText='flex:1;padding:7px 8px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem';
  const del=document.createElement('button');
  del.textContent='✕'; del.className='btn btn-sm';
  del.style.cssText='background:#fee2e2;color:#b91c1c;padding:6px 10px';
  del.onclick=()=>wrap.remove();
  hdr.appendChild(nameInp); hdr.appendChild(del);
  const grid=document.createElement('div');
  grid.style.cssText='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px';
  [['Herbicide (m)','swHerb','21'],['Insecticide (m)','swIns','21'],['Fungicide (m)','swFung','21'],
   ['Urea (m)','swUrea','24'],['Fertiliser (m)','swFert','24'],['Snail Bait (m)','swSnail','12'],
   ['Mouse Bait (m)','swMouse','12'],['Seed (m)','swSeed','18']
  ].forEach(([lbl,fid,def])=>{
    const d=document.createElement('div'); d.className='fg';
    const l=document.createElement('label'); l.textContent=lbl;
    const inp=document.createElement('input'); inp.type='number'; inp.value=def; inp.dataset.fid=fid;
    inp.style.cssText='width:100%;padding:6px 8px;border:1.5px solid var(--border);border-radius:8px;font-size:.82rem';
    d.appendChild(l); d.appendChild(inp); grid.appendChild(d);
  });
  wrap.appendChild(hdr); wrap.appendChild(grid);
  document.getElementById('cfg-swath-extra').appendChild(wrap);
}
function cfgTab(name){
  ['pilots','mixers','aircraft','strips','hopper','swaths','xero'].forEach(t=>{
    document.getElementById('cfg-pane-'+t).style.display=t===name?'block':'none';
    const btn=document.getElementById('cfg-tab-'+t);
    if(btn){btn.style.background=t===name?'var(--navy)':'';btn.style.color=t===name?'#fff':'';}
  });
}
function cfgRow(fields){
  const row=document.createElement('div');
  row.style.cssText='display:flex;gap:6px;align-items:center';
  fields.forEach(f=>{
    let el;
    if(f.isSelect){
      el=document.createElement('select');
      f.isSelect.forEach(opt=>{
        const o=document.createElement('option'); o.value=opt; o.textContent=opt;
        if(opt===f.value) o.selected=true;
        el.appendChild(o);
      });
    } else {
      el=document.createElement('input');
      el.type=f.type||'text'; el.placeholder=f.placeholder||''; el.value=f.value||'';
    }
    el.dataset.fid=f.id;
    el.style.cssText='flex:'+(f.width||1)+';padding:7px 8px;border:1.5px solid var(--border);border-radius:8px;font-size:.85rem;min-width:0';
    row.appendChild(el);
  });
  const del=document.createElement('button');
  del.textContent='✕'; del.className='btn btn-sm';
  del.style.cssText='background:#fee2e2;color:#b91c1c;flex-shrink:0;padding:6px 10px';
  del.onclick=()=>row.remove();
  row.appendChild(del);
  return row;
}
function cfgAddPilot(name='',pay='',pin=''){
  document.getElementById('cfg-pilots-list').appendChild(cfgRow([
    {id:'name',placeholder:'Pilot name',value:name,width:3},
    {id:'pay', placeholder:'Pay %',value:pay,type:'number',width:1},
    {id:'pin', placeholder:'PIN',value:pin,type:'number',width:1},
  ]));
}
function cfgAddMixer(name='',pin=''){
  document.getElementById('cfg-mixers-list').appendChild(cfgRow([
    {id:'name',placeholder:'Mixer name',value:name,width:3},
    {id:'pin', placeholder:'PIN',value:pin,width:1},
  ]));
}
function cfgAddAircraft(rego='',type='AT-802',rate=''){
  document.getElementById('cfg-aircraft-list').appendChild(cfgRow([
    {id:'rego', placeholder:'Rego e.g. VH-ODV', value:rego,  width:2},
    {id:'type', placeholder:'Type', value:type, width:2, isSelect:['AT-802','AT-502','Other']},
    {id:'rate', placeholder:'$/hr', value:rate, width:1.5, type:'number'},
  ]));
}
function cfgAddStrip(name='',rate=''){
  document.getElementById('cfg-strips-list').appendChild(cfgRow([
    {id:'name',placeholder:'Airstrip name',value:name,width:3},
    {id:'rate',placeholder:'$/ha',value:rate,type:'number',width:1},
  ]));
}
function cfgReadRows(listId){
  const rows=[...document.getElementById(listId).children];
  return rows.map(row=>{
    const obj={};
    row.querySelectorAll('[data-fid]').forEach(inp=>{ obj[inp.dataset.fid]=inp.value.trim(); });
    return obj;
  }).filter(o=>o.name||o.rego);
}
// Aircraft list items are wrapped in a card div - reads all [data-fid] inside each card
function cfgReadAircraftRows(){
  const rows=[...document.getElementById('cfg-aircraft-list').children];
  return rows.map(wrap=>{
    const obj={};
    wrap.querySelectorAll('[data-fid]').forEach(el=>{ obj[el.dataset.fid]=el.value||el.textContent||''; });
    return obj;
  }).filter(o=>o.rego);
}

function openStaffModal(){
  const s=getStaff();
  // Pilots
  document.getElementById('cfg-pilots-list').innerHTML='';
  (s.pilotObjs||[]).forEach(p=>cfgAddPilot(p.name,p.pay||'',p.pin||''));
  // Mixers
  document.getElementById('cfg-mixers-list').innerHTML='';
  (s.mixerObjs||[]).forEach(m=>cfgAddMixer(m.name,m.pin||''));
  // Aircraft
  document.getElementById('cfg-aircraft-list').innerHTML='';
  (s.aircraftObjs||[]).forEach(a=>cfgAddAircraft(a.rego,a.type,a.rate||''));
  // Airstrips
  document.getElementById('cfg-strips-list').innerHTML='';
  (s.stripObjs||[]).forEach(st=>cfgAddStrip(st.name,st.rate||''));
  // Hopper per aircraft type
  const hc=s.hopperCaps||{};
  const h802=s.hopperCaps802||{}; const h502=s.hopperCaps502||{};
  const hlEl=document.getElementById('cfg-herb-loading'); if(hlEl) hlEl.value=s.herbLoading??10;
  document.getElementById('cfg-802-spray').value=h802['Spray']||hc['Spray']||3020;
  document.getElementById('cfg-802-urea').value=h802['Urea']||hc['Urea']||2000;
  document.getElementById('cfg-802-fert').value=h802['Fertiliser']||hc['Fertiliser']||2400;
  document.getElementById('cfg-802-snail').value=h802['Snail Bait']||hc['Snail Bait']||2000;
  document.getElementById('cfg-802-mouse').value=h802['Mouse Bait']||hc['Mouse Bait']||1200;
  document.getElementById('cfg-802-seed').value=h802['Seed']||hc['Seed']||2000;
  document.getElementById('cfg-502-spray').value=h502['Spray']||1500;
  document.getElementById('cfg-502-urea').value=h502['Urea']||1200;
  document.getElementById('cfg-502-fert').value=h502['Fertiliser']||1400;
  document.getElementById('cfg-502-snail').value=h502['Snail Bait']||1200;
  document.getElementById('cfg-502-mouse').value=h502['Mouse Bait']||800;
  document.getElementById('cfg-502-seed').value=h502['Seed']||1200;
  // Swaths
  const sw802=s.swaths802||{}; const sw502=s.swaths502||{};
  const swDefs802={herb:24,ins:28,fung:28,mist:40,other:28,fert:28,snail:35,mouse:50,seed:20,ur50:30,ur75:28,ur100:26,ur125:24,ur150:22,ur151:20};
  const swDefs502={herb:20,ins:24,fung:24,mist:35,other:24,fert:22,snail:35,mouse:50,seed:20,ur50:26,ur75:24,ur100:22,ur125:20,ur150:18,ur151:16};
  // Load spray/spread swath fields (prefix cfg-802-sw- or cfg-502-sw-)
  Object.keys(swDefs802).forEach(k=>{
    const el=document.getElementById('cfg-802-sw-'+k)||document.getElementById('cfg-802-ur-'+k.replace('ur',''));
    const el2=k.startsWith('ur')?document.getElementById('cfg-802-ur-'+k.slice(2)):document.getElementById('cfg-802-sw-'+k);
    if(el2){el2.value=sw802[k]||swDefs802[k];el2.setAttribute('value',el2.value);}
  });
  Object.keys(swDefs502).forEach(k=>{
    const el2=k.startsWith('ur')?document.getElementById('cfg-502-ur-'+k.slice(2)):document.getElementById('cfg-502-sw-'+k);
    if(el2){el2.value=sw502[k]||swDefs502[k];el2.setAttribute('value',el2.value);}
  });
  // Clear extra type slots
  const he=document.getElementById('cfg-hopper-extra'); if(he) he.innerHTML='';
  const se=document.getElementById('cfg-swath-extra');  if(se) se.innerHTML='';
  // Start on pilots tab
  cfgTab('pilots');
  // Xero settings — load from localStorage
  const _xci=document.getElementById('cfg-xero-client-id'); if(_xci)_xci.value=localStorage.getItem('at_xeroClientId')||getStaff().xeroClientId||'';
  const _xcs=document.getElementById('cfg-xero-client-secret'); if(_xcs)_xcs.value=localStorage.getItem('at_xeroClientSecret')||'';
  const _xis=document.getElementById('cfg-xero-inv-status'); if(_xis)_xis.value=localStorage.getItem('at_xeroInvStatus')||'AUTHORISED';
  const _xtr=document.getElementById('cfg-xero-terms'); if(_xtr)_xtr.value=localStorage.getItem('at_xeroTerms')||'14';
  const _xac=document.getElementById('cfg-xero-account'); if(_xac)_xac.value=localStorage.getItem('at_xeroAccount')||'';
  const _xtx=document.getElementById('cfg-xero-tax'); if(_xtx)_xtx.value=localStorage.getItem('at_xeroTax')||'OUTPUT';
  const _xru=document.getElementById('xero-redirect-uri'); if(_xru)_xru.textContent='https://app.aerops.com.au/';
  const _xruo=document.getElementById('cfg-xero-redirect-uri-override'); if(_xruo)_xruo.value='https://app.aerops.com.au/';
  const _xst=document.getElementById('xero-status'); if(_xst){const tok=localStorage.getItem('at_xeroToken');_xst.textContent=tok?'✅ Connected to Xero':'⚪ Not connected';_xst.style.color=tok?'#16a34a':'#6b7280';}
  document.getElementById('staff-modal-overlay').classList.add('open');
}
function closeStaffModal(){ document.getElementById('staff-modal-overlay').classList.remove('open'); }
function closeStaffOnBg(e){ if(e.target===document.getElementById('staff-modal-overlay')) closeStaffModal(); }
async function saveStaff(){
  // Save Xero settings to localStorage
  const _sxci=document.getElementById('cfg-xero-client-id'); if(_sxci) { if(_sxci.value.trim()) localStorage.setItem('at_xeroClientId',_sxci.value.trim()); else localStorage.removeItem('at_xeroClientId'); }
  const _sxcs=document.getElementById('cfg-xero-client-secret'); if(_sxcs) { if(_sxcs.value.trim()) localStorage.setItem('at_xeroClientSecret',_sxcs.value.trim()); else localStorage.removeItem('at_xeroClientSecret'); }
  const _sxis=document.getElementById('cfg-xero-inv-status'); if(_sxis)localStorage.setItem('at_xeroInvStatus',_sxis.value);
  const _sxtr=document.getElementById('cfg-xero-terms'); if(_sxtr)localStorage.setItem('at_xeroTerms',_sxtr.value);
  const _sxac=document.getElementById('cfg-xero-account'); if(_sxac)localStorage.setItem('at_xeroAccount',_sxac.value.trim());
  const _sxtx=document.getElementById('cfg-xero-tax'); if(_sxtx)localStorage.setItem('at_xeroTax',_sxtx.value.trim()||'OUTPUT');
  // Safe element reader — returns fallback if element missing or value empty
  const gv=(id,fb)=>{const el=document.getElementById(id);return el?(parseFloat(el.value)||fb):fb;};
  const pilotObjs = cfgReadRows('cfg-pilots-list').map(p=>({name:p.name,pay:parseFloat(p.pay)||0,pin:p.pin||''}));
  const mixerObjs = cfgReadRows('cfg-mixers-list').map(m=>({name:m.name,pin:m.pin||''}));
  const aircraftObjs = cfgReadAircraftRows().map(a=>({rego:a.rego,type:a.type||'AT-802',rate:parseFloat(a.rate)||3300}));
  const stripObjs = cfgReadRows('cfg-strips-list').map(st=>({name:st.name,rate:parseFloat(st.rate)||0}));
  const newRates={};
  stripObjs.forEach(st=>{if(st.name)newRates[st.name]=st.rate;});
  Object.assign(AIRSTRIP_RATES,newRates);
  Object.keys(AIRSTRIP_RATES).forEach(k=>{if(!(k in newRates))delete AIRSTRIP_RATES[k];});
  const s={
    pilotObjs, mixerObjs, aircraftObjs, stripObjs,
    pilots: pilotObjs.map(p=>p.name),
    mixers: mixerObjs.map(m=>m.name),
    rate802: aircraftObjs.filter(a=>a.type==='AT-802').reduce((mn,a)=>Math.min(mn,a.rate),9999)||3300,
    rate502: aircraftObjs.filter(a=>a.type==='AT-502').reduce((mn,a)=>Math.min(mn,a.rate),9999)||2200,
    herbLoading: gv('cfg-herb-loading',10),
    xeroClientId: (document.getElementById('cfg-xero-client-id')?.value||'').trim()||undefined,
    hopperCaps802:{
      'Spray':     gv('cfg-802-spray',3020),
      'Urea':      gv('cfg-802-urea', 2000),
      'Fertiliser':gv('cfg-802-fert', 2400),
      'Snail Bait':gv('cfg-802-snail',2000),
      'Mouse Bait':gv('cfg-802-mouse',1200),
      'Seed':      gv('cfg-802-seed', 2000),
    },
    hopperCaps502:{
      'Spray':     gv('cfg-502-spray',1500),
      'Urea':      gv('cfg-502-urea', 1200),
      'Fertiliser':gv('cfg-502-fert', 1400),
      'Snail Bait':gv('cfg-502-snail',1200),
      'Mouse Bait':gv('cfg-502-mouse', 800),
      'Seed':      gv('cfg-502-seed', 1200),
    },
    hopperCaps:{
      'Spray':     gv('cfg-802-spray',3020),
      'Urea':      gv('cfg-802-urea', 2000),
      'Fertiliser':gv('cfg-802-fert', 2400),
      'Snail Bait':gv('cfg-802-snail',2000),
      'Mouse Bait':gv('cfg-802-mouse',1200),
      'Seed':      gv('cfg-802-seed', 2000),
    },
    swaths802:{
      herb: gv('cfg-802-sw-herb', 24), ins:  gv('cfg-802-sw-ins',  28),
      fung: gv('cfg-802-sw-fung', 28), mist: gv('cfg-802-sw-mist', 40),
      other:gv('cfg-802-sw-other',28), fert: gv('cfg-802-sw-fert', 28),
      snail:gv('cfg-802-sw-snail',35), mouse:gv('cfg-802-sw-mouse',50),
      seed: gv('cfg-802-sw-seed', 20),
      ur50: gv('cfg-802-ur-50',  30), ur75: gv('cfg-802-ur-75',  28),
      ur100:gv('cfg-802-ur-100', 26), ur125:gv('cfg-802-ur-125', 24),
      ur150:gv('cfg-802-ur-150', 22), ur151:gv('cfg-802-ur-151', 20),
    },
    swaths502:{
      herb: gv('cfg-502-sw-herb', 20), ins:  gv('cfg-502-sw-ins',  24),
      fung: gv('cfg-502-sw-fung', 24), mist: gv('cfg-502-sw-mist', 35),
      other:gv('cfg-502-sw-other',24), fert: gv('cfg-502-sw-fert', 22),
      snail:gv('cfg-502-sw-snail',35), mouse:gv('cfg-502-sw-mouse',50),
      seed: gv('cfg-502-sw-seed', 20),
      ur50: gv('cfg-502-ur-50',  26), ur75: gv('cfg-502-ur-75',  24),
      ur100:gv('cfg-502-ur-100', 22), ur125:gv('cfg-502-ur-125', 20),
      ur150:gv('cfg-502-ur-150', 18), ur151:gv('cfg-502-ur-151', 16),
    },
  };
  localStorage.setItem('at_staff',JSON.stringify(s));
  try{
    const body={fields:Object.fromEntries(Object.entries(s).filter(([,v])=>v!==undefined&&v!==null).map(([k,v])=>[k,fsVal(v)]))};
    const r=await fetch(FS_BASE+'/config/settings',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok) throw new Error('HTTP '+r.status);
  }catch(e){ console.warn('Settings sync failed:',e); alert('⚠️ Saved locally but cloud sync failed: '+e.message); return; }
  closeStaffModal();
  renderJobs();
  alert('✅ Settings saved and synced to all devices!');
}

// ═══════════════════════════════════════════════════
// SAMPLE DATA
// ═══════════════════════════════════════════════════
function loadSampleData(){
  const today=new Date();
  const dt=(offset)=>{const d=new Date(today);d.setDate(d.getDate()+offset);return d.toISOString().slice(0,10);};
  jobs=[
    {id:'s1',status:'scheduled',createdAt:new Date().toISOString(),
      clientName:'Morrison Grain',agentName:'EP Agronomy',preferredDate:dt(1),
      farmAddress:'Lot 27 Verran Rd, Verran SA',airstrip:'Cummins',
      windDirectionRequired:'NW',waterRate:30,hasRecommendation:'yes',mapUploaded:'yes',
      invoiceTo:'Agent',chemDelivery:'Agent',additionalComments:'',
      paddocks:[{name:'North Block',ha:220,cropType:'Wheat'},{name:'South Block',ha:180,cropType:'Barley'}],
      products:[{name:'Trifluralin',type:'Herbicide',rate:1.2,unit:'L/ha',totalRequired:480},{name:'Hasten',type:'Adjuvant/Wetter',rate:0.15,unit:'L/ha',totalRequired:60}],
      hazards:{powerlines:'no',susceptibleCrops:'no',dwelling:'no',neighboursNotified:'yes',neighboursConcern:'no'},
      schedule:{aircraft:'VH-ODV',pilot:'Adam Sullivan',mixer:'Ben Simcock',scheduledDate:dt(1)}},
    {id:'s2',status:'new',createdAt:new Date().toISOString(),
      clientName:'Trelour Farms',agentName:'',preferredDate:dt(2),
      farmAddress:'Section 45 Arno Bay Rd, Arno Bay SA',airstrip:"Trelour's",
      windDirectionRequired:'SE',waterRate:30,hasRecommendation:'yes',mapUploaded:'yes',
      invoiceTo:'Client',chemDelivery:'Client',additionalComments:'Rocky corners on North Block — approach from south',
      paddocks:[{name:'Front Paddock',ha:150,cropType:'Canola'},{name:'Back Paddock',ha:95,cropType:'Canola'}],
      products:[{name:'Prosaro',type:'Fungicide',rate:0.5,unit:'L/ha',totalRequired:122.5}],
      hazards:{powerlines:'yes',powerlinesDesc:'High voltage line along northern boundary',susceptibleCrops:'no',dwelling:'no',neighboursNotified:'yes',neighboursConcern:'no'},
      schedule:{}},
    {id:'s3',status:'scheduled',createdAt:new Date().toISOString(),
      clientName:'Schulz Agriculture',agentName:'Landmark Cummins',preferredDate:dt(3),
      farmAddress:'Hundred of Murdinga, Lock SA',airstrip:'Karkoo',
      windDirectionRequired:'',waterRate:30,hasRecommendation:'yes',mapUploaded:'yes',
      invoiceTo:'Agent',chemDelivery:'Both',additionalComments:'',
      paddocks:[{name:'Home Paddock',ha:320,cropType:'Wheat'},{name:'Reserve',ha:210,cropType:'Barley'},{name:'New Ground',ha:180,cropType:'Oats'}],
      products:[{name:'SuperU',type:'Urea',rate:120,unit:'kg/ha',totalRequired:86400}],
      hazards:{powerlines:'no',susceptibleCrops:'no',dwelling:'no',neighboursNotified:'yes',neighboursConcern:'no'},
      schedule:{aircraft:'VH-ODP',pilot:'Henry Trealor',mixer:'Robert Proud',scheduledDate:dt(3)}},
    {id:'s4',status:'in_progress',createdAt:new Date().toISOString(),
      clientName:'EP Grazing Co',agentName:'',preferredDate:dt(0),
      farmAddress:'Hundred of Playford, Cleve SA',airstrip:'Heymans',
      windDirectionRequired:'NE',waterRate:30,hasRecommendation:'no',mapUploaded:'yes',
      invoiceTo:'Client',chemDelivery:'Client',additionalComments:'Snail pressure very high on northern end',
      paddocks:[{name:'Claypan Block',ha:180,cropType:'Wheat'},{name:'Sandy Rise',ha:90,cropType:'Lentils'}],
      products:[{name:'Metarex Inov',type:'Snail Bait',rate:5,unit:'kg/ha',totalRequired:1350}],
      hazards:{powerlines:'no',susceptibleCrops:'yes',susceptibleDesc:'Organic vineyard 800m east — use eastern buffer',dwelling:'no',neighboursNotified:'yes',neighboursConcern:'yes',neighboursDesc:'John Harris at Lot 12 — notified, no concerns raised'},
      schedule:{aircraft:'VH-ODV',pilot:'Michael Crettenden',mixer:'Amber Meyers',scheduledDate:dt(0)}},
    {id:'s5',status:'pilot_complete',createdAt:new Date().toISOString(),
      clientName:'Hamlyn Farming Trust',agentName:'Elders Port Lincoln',preferredDate:dt(-5),
      farmAddress:'Section 112 Koppio Rd, Koppio SA',airstrip:"Smithy's",
      windDirectionRequired:'SW',waterRate:40,hasRecommendation:'yes',mapUploaded:'yes',
      invoiceTo:'Agent',chemDelivery:'Agent',additionalComments:'',
      paddocks:[{name:'Koppio Block',ha:450,cropType:'Barley'},{name:'Hill Country',ha:120,cropType:'Wheat'}],
      products:[{name:'Roundup PowerMax',type:'Herbicide',rate:2.0,unit:'L/ha',totalRequired:1140},{name:'Uptake',type:'Adjuvant/Wetter',rate:0.2,unit:'L/ha',totalRequired:114}],
      hazards:{powerlines:'no',susceptibleCrops:'no',dwelling:'yes',dwelling_approval:'yes',neighboursNotified:'yes',neighboursConcern:'no'},
      schedule:{aircraft:'VH-ODV',pilot:'Adam Sullivan',mixer:'Shaun Dempsey',scheduledDate:dt(-5)}},
    {id:'s6',status:'scheduled',createdAt:new Date().toISOString(),
      clientName:'Wundowie Ag',agentName:'',preferredDate:dt(-1),
      farmAddress:'Lot 7 Wudinna-Kimba Rd, Wudinna SA',airstrip:'Modras',
      windDirectionRequired:'N',waterRate:30,hasRecommendation:'no',mapUploaded:'no',
      invoiceTo:'Client',chemDelivery:'Client',additionalComments:'Urgent — mice pressure building',
      paddocks:[{name:'East Paddock',ha:200,cropType:'Wheat'},{name:'West Paddock',ha:160,cropType:'Barley'}],
      products:[{name:'Bromadiolone',type:'Mouse Bait',rate:1,unit:'kg/ha',totalRequired:360}],
      hazards:{powerlines:'no',susceptibleCrops:'no',dwelling:'no',neighboursNotified:'no',neighboursConcern:'no'},
      schedule:{scheduledDate:dt(-1)}}
  ];
  saveJobs();
}


// ═══ DAY PLAN ═══
let dpDate='', dpOrder={}, dpTimes={};
function openDayPlan(ds){dpDate=ds;document.getElementById('dayplan-overlay').classList.add('open');renderDayPlan();}
function closeDayModal(){document.getElementById('dayplan-overlay').classList.remove('open');}
function closeDayOnBg(e){if(e.target===document.getElementById('dayplan-overlay'))closeDayModal();}
function dpKey(id){return dpDate+'_'+id;}
// Silently calculate + persist estimated start times for a date without opening the modal
function silentCalcTimes(ds){
  const prev=dpDate; dpDate=ds;
  const ord=dpOrder[ds]||[];
  if(!ord.length){dpDate=prev;return;}
  // seed first job per pilot at 07:00 if not already set
  const pilots=new Set(ord.map(id=>{const j=jobs.find(j=>j.id===id);return j?.schedule?.pilot||''}).filter(Boolean));
  pilots.forEach(pilot=>{
    const pjobs=ord.map(id=>jobs.find(j=>j.id===id)).filter(j=>j&&j.schedule?.pilot===pilot);
    if(pjobs.length&&!dpTimes[dpKey(pjobs[0].id)]) dpTimes[dpKey(pjobs[0].id)]='07:00';
    pjobs.forEach(j=>cascadeTimesFrom(j.id));
  });
  persistEstTimes();
  dpDate=prev;
}

function renderDayPlan(){
  // Ensure jobs array is current (guard against stale closure)
  if(typeof jobs === 'undefined' || jobs.length === 0) {
    if(window._allJobs && window._allJobs.length > 0) { jobs = window._allJobs; }
  }
  const d=new Date(dpDate+'T00:00:00');
  const DAY_NAMES=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  document.getElementById('dayplan-title').textContent=DAY_NAMES[d.getDay()]+' '+d.toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  const getCalDate=j=>j.schedule?.scheduledDate||j.preferredDate||'';
  const dayJobs=jobs.filter(j=>getCalDate(j)===dpDate&&!['invoiced'].includes(j.status));
  if(!dpOrder[dpDate])dpOrder[dpDate]=[];
  dayJobs.forEach(j=>{if(!dpOrder[dpDate].includes(j.id))dpOrder[dpDate].push(j.id);});
  dpOrder[dpDate]=dpOrder[dpDate].filter(id=>dayJobs.some(j=>j.id===id));
  const ordJobs=dpOrder[dpDate].map(id=>dayJobs.find(j=>j.id===id)).filter(Boolean);
  const staff=getStaff();
  const totalHa=dayJobs.reduce((s,j)=>s+estimateJob(j).totalHa,0);
  const totalCost=dayJobs.reduce((s,j)=>s+estimateJob(j).cost,0);
  const totalBlock=dayJobs.reduce((s,j)=>s+estimateJob(j).breakdown.blockTime,0);
  // Group by pilot
  const pilotMap={};
  const unassigned=[];
  ordJobs.forEach(j=>{
    const p=j.schedule?.pilot||'';
    if(!p){unassigned.push(j);return;}
    if(!pilotMap[p])pilotMap[p]=[];
    pilotMap[p].push(j);
  });
  const nPilots=Object.keys(pilotMap).length;
  let html=`<div class="dp-sum-bar">
    <div class="dp-sum-item"><div class="dps-l">Jobs</div><div class="dps-v">${dayJobs.length}</div></div>
    <div class="dp-sum-item"><div class="dps-l">Total Ha</div><div class="dps-v">${totalHa.toFixed(0)} ha</div></div>
    <div class="dp-sum-item"><div class="dps-l">Pilots Flying</div><div class="dps-v">${nPilots}</div></div>
    <div class="dp-sum-item"><div class="dps-l">Est. Revenue</div><div class="dps-v">${fmtMoney(totalCost)}</div></div>
    <div class="dp-sum-item"><div class="dps-l">Total Block</div><div class="dps-v">${Math.floor(totalBlock*60)>=60?Math.floor(totalBlock*60/60)+'h '+Math.round(totalBlock*60%60)+'m':Math.round(totalBlock*60)+'m'}</div></div>
  </div>`;
  if(!dayJobs.length){html+='<div style="text-align:center;padding:40px;color:var(--muted)"><div style="font-size:2rem;margin-bottom:8px">📭</div><p style="font-weight:700">No jobs on this day</p></div>';document.getElementById('dayplan-body').innerHTML=html;document.getElementById('dayplan-subtitle').textContent='No jobs';return;}
  document.getElementById('dayplan-subtitle').textContent=dayJobs.length+' job'+(dayJobs.length!==1?'s':'')+' · '+totalHa.toFixed(0)+' ha · '+fmtMoney(totalCost);
  const PCOLS=['#1a3a5c','#1a7a2e','#7c3aed','#dc2626','#d97706','#0369a1'];
  const SPREAD_TYPES_DP=['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
  function jobClass(j){
    if((j.products||[]).some(p=>p.type==='Misting')) return 'misting';
    if((j.products||[]).some(p=>SPREAD_TYPES_DP.includes(p.type))) return 'spread';
    return 'spray';
  }
  function fmtBlk(h){const m=Math.round(h*60);return m>=60?Math.floor(m/60)+'h '+m%60+'m':m+'m';}

  // Build horizontal lanes
  html+='<div class="dp-lanes">';

  Object.entries(pilotMap).forEach(([pilot,pjobs],pi)=>{
    const pHa=pjobs.reduce((s,j)=>s+estimateJob(j).totalHa,0);
    const pBlk=pjobs.reduce((s,j)=>s+estimateJob(j).breakdown.blockTime,0);
    const col=PCOLS[pi%PCOLS.length];
    const ac=pjobs[0]?.schedule?.aircraft||'';
    html+=`<div class="dp-lane">
      <div class="dp-lane-hdr" style="background:${col}">
        <div class="dp-lane-name">👤 ${pilot.split(' ')[0]} ${pilot.split(' ').slice(1).join(' ')}</div>
        <div class="dp-lane-sub">${ac?ac+' · ':''}${pHa.toFixed(0)} ha · ⏱ ${fmtBlk(pBlk)}</div>
      </div>
      <div class="dp-lane-jobs">`;
    // Cascade times — seed from actual takeoff where available, then cascade using actual landings
    if(pjobs.length>0){
      // Set each job's start time from actual takeoff if pilot has submitted completion
      pjobs.forEach((j,ji)=>{
        if(j.completion && j.completion.takeoffTime && /^\d{1,2}:\d{2}/.test(j.completion.takeoffTime)){
          dpTimes[dpKey(j.id)] = j.completion.takeoffTime;
        } else if(!dpTimes[dpKey(j.id)]) {
          dpTimes[dpKey(j.id)] = ji===0 ? '07:00' : dpTimes[dpKey(pjobs[0].id)]||'07:00';
        }
      });
      // Initialise first if not set
      if(!dpTimes[dpKey(pjobs[0].id)]) dpTimes[dpKey(pjobs[0].id)]='07:00';
      // Cascade forward for jobs without actual times
      for(let ci=1;ci<pjobs.length;ci++){
        const cur=pjobs[ci];
        // Skip if this job already has an actual takeoff time
        if(cur.completion && cur.completion.takeoffTime && /^\d{1,2}:\d{2}/.test(cur.completion.takeoffTime)) continue;
        const prev=pjobs[ci-1];
        const actualLanding = prev.completion && prev.completion.landingTime
          ? prev.completion.landingTime : null;
        let nm;
        if(actualLanding && /^\d{1,2}:\d{2}/.test(actualLanding)){
          const [ph,pm]=actualLanding.split(':').map(Number);
          nm=ph*60+pm+15; // 15 min turnaround after actual landing
        } else {
          const [ph,pm]=(dpTimes[dpKey(prev.id)]||'07:00').split(':').map(Number);
          const blk=Math.round(estimateJob(prev).breakdown.blockTime*60);
          nm=ph*60+pm+blk+15;
        }
        dpTimes[dpKey(pjobs[ci].id)]=String(Math.floor(nm/60)).padStart(2,'0')+':'+String(nm%60).padStart(2,'0');
      }
    }
    pjobs.forEach((j,ji)=>{
      const est=estimateJob(j);
      const jcls=jobClass(j);
      const st=dpTimes[dpKey(j.id)]||'07:00';
      const blkMins=Math.round(est.breakdown.blockTime*60);
      const[sh,sm]=st.split(':').map(Number);
      const endMins=sh*60+sm+blkMins;
      const et=String(Math.floor(endMins/60)).padStart(2,'0')+':'+String(endMins%60).padStart(2,'0');
      const hz=j.hazards?.powerlines==='yes';
      const isFirst=(ji===0);
      const actualTakeoff=j.completion?.takeoffTime||null;
      const actualLanding=j.completion?.landingTime||null;
      const isComplete=j.status==='pilot_complete';
      const timeRow = isComplete && actualTakeoff && actualLanding
        ? `<div style="font-size:.72rem;margin-bottom:5px;background:#f0fdf4;border-radius:6px;padding:4px 8px">✅ <strong>${actualTakeoff}</strong> → <strong>${actualLanding}</strong> <span style="color:#16a34a;font-weight:700">(actual)</span></div>`
        : isFirst
        ? `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px" onclick="event.stopPropagation()">
             <label style="font-size:.7rem;color:#6b7280;font-weight:600;white-space:nowrap">Start</label>
             <input type="time" value="${st}" onchange="dpSetTime('${j.id}',this.value)" style="padding:4px 6px;border:1.5px solid #1a3a5c;border-radius:7px;font-size:.8rem;font-weight:600;font-family:inherit;background:#f0f4ff;flex:1;min-width:0"/>
             <span style="font-size:.72rem;color:#6b7280;white-space:nowrap">→ ${et}</span>
           </div>`
        : `<div style="font-size:.72rem;color:#6b7280;margin-bottom:5px">🕐 ${st} → ${et}</div>`;
      html+=`<div class="dp-mini-job ${jcls}" style="${est.isHerb?'background:#fee2e2;border-left:3px solid #dc2626;':''}">
        <div style="display:flex;align-items:flex-start;gap:6px">
          <div style="display:flex;flex-direction:column;gap:2px;flex-shrink:0;margin-top:1px">
            <button onclick="dpMoveJob('${j.id}',-1);event.stopPropagation()" style="background:#f3f4f6;border:1px solid #dde1e8;border-radius:4px;width:26px;height:24px;font-size:.75rem;cursor:pointer;line-height:1;padding:0" title="Move up">▲</button>
            <button onclick="dpMoveJob('${j.id}',1);event.stopPropagation()" style="background:#f3f4f6;border:1px solid #dde1e8;border-radius:4px;width:26px;height:24px;font-size:.75rem;cursor:pointer;line-height:1;padding:0" title="Move down">▼</button>
          </div>
          <div style="flex:1;min-width:0">
            <div class="dp-mini-client" style="font-size:.92rem;margin-bottom:3px;${est.isHerb?'color:#dc2626;font-weight:800':''}">${est.isHerb?'🌿 ':''}${j.clientName||'—'}${hz?' <span style="color:#dc2626">⚡</span>':''}</div>
            <div class="dp-mini-detail" style="font-size:.78rem;margin-bottom:2px"><strong>${j.airstrip||'—'}</strong> · ${est.totalHa.toFixed(0)} ha</div>
            <div class="dp-mini-detail" style="font-size:.75rem;margin-bottom:6px">${est.loads} load${est.loads!==1?'s':''} · ${est.totalUnits.toFixed(0)} ${est.unitLabel}</div>
            ${timeRow}
            <div class="dp-mini-tags">
              <span style="font-size:.68rem;background:#f3f4f6;padding:3px 8px;border-radius:10px;font-weight:600">${fmtBlk(est.breakdown.blockTime)}</span>
              ${j.schedule?.mixer?`<span style="font-size:.68rem;background:#dbeafe;padding:3px 8px;border-radius:10px;font-weight:600">🧪 ${j.schedule.mixer.split(' ')[0]}</span>`:''}
              ${j.status==='in_progress'?`<span style="font-size:.68rem;background:#fef08a;color:#713f12;padding:3px 8px;border-radius:10px;font-weight:700">🔵 In Progress</span>`:''}
              ${j.status==='pilot_complete'?`<span style="font-size:.68rem;background:#d1fae5;color:#065f46;padding:3px 8px;border-radius:10px;font-weight:700">✅ Complete</span>`:''}
              <button onclick="openJob('${j.id}');event.stopPropagation()" style="font-size:.68rem;background:#f3f4f6;border:1px solid #dde1e8;padding:3px 8px;border-radius:10px;cursor:pointer;font-weight:600">✏️ Edit</button>
            </div>
            ${(()=>{
              const mp=j.mixProgress;
              if(!mp) return '';
              const lc=mp.loadsComplete||0, lt=mp.loadsTotal||1;
              const pct=Math.min(100,Math.round((lc/lt)*100));
              const barColor=j.status==='pilot_complete'?'#16a34a':'#2563eb';
              const lastT=mp.loadTimes&&mp.loadTimes.length?mp.loadTimes[mp.loadTimes.length-1]:'';
              return `<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(0,0,0,.07)">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                  <span style="font-size:.68rem;font-weight:700;color:#374151">🧪 Mixer Progress</span>
                  <span style="font-size:.68rem;font-weight:800;color:${barColor}">${lc}/${lt} loads · ${pct}%</span>
                </div>
                <div style="height:7px;background:#e5e7eb;border-radius:4px;overflow:hidden;margin-bottom:4px">
                  <div style="height:100%;background:${barColor};width:${pct}%;border-radius:4px;transition:.5s"></div>
                </div>
                ${lastT?`<div style="font-size:.65rem;color:#6b7280">Last load: ${lastT} · Mixer: ${mp.mixer||'—'}</div>`:''}
              </div>`;
            })()}
          </div>
        </div>
      </div>`;
    });
    html+='</div></div>'; // close dp-lane-jobs + dp-lane
  });

  // Unassigned lane (if any)
  if(unassigned.length){
    html+=`<div class="dp-lane dp-unassigned-lane">
      <div class="dp-lane-hdr" style="background:#e67e22">
        <div class="dp-lane-name">⚠️ Unassigned</div>
        <div class="dp-lane-sub">${unassigned.length} job${unassigned.length!==1?'s':''} — needs pilot</div>
      </div>
      <div class="dp-lane-jobs">`;
    unassigned.forEach(j=>{
      const est=estimateJob(j);
      const jcls=jobClass(j);
      html+=`<div class="dp-mini-job ${jcls}">
        <div class="dp-mini-client">${j.clientName||'—'}</div>
        <div class="dp-mini-detail"><strong>${j.airstrip||'—'}</strong> · ${est.totalHa.toFixed(0)} ha · ${fmtBlk(est.breakdown.blockTime)}</div>
        <div style="display:flex;gap:5px;margin-top:6px;flex-wrap:wrap">
          <select style="padding:4px 7px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.72rem;flex:1" onchange="dpAssignPilot('${j.id}',this.value)" onclick="event.stopPropagation()">
            <option value="">— Pilot —</option>
            ${staff.pilots.map(p=>`<option${j.schedule?.pilot===p?' selected':''}>${p}</option>`).join('')}
          </select>
          <select style="padding:4px 7px;border:1.5px solid #dde1e8;border-radius:7px;font-size:.72rem;flex:1" onchange="dpAssignAircraft('${j.id}',this.value)" onclick="event.stopPropagation()">
            <option value="">— A/C —</option>
            ${['VH-ODV','VH-ODP','VH-ODG','VH-ODN','VH-ODZ','VH-A54','VH-OUJ','VH-OUB'].map(a=>`<option${j.schedule?.aircraft===a?' selected':''}>${a}</option>`).join('')}
          </select>
        </div>
      </div>`;
    });
    html+='</div></div>';
  }
  html+='</div>'; // close dp-lanes

  document.getElementById('dayplan-body').innerHTML=html;
  // Persist calculated times to Firestore so Pilot/Mixer PWAs can show them
  setTimeout(persistEstTimes, 300);
}

function dpSetTime(jobId, val) {
  dpTimes[dpKey(jobId)] = val;
  cascadeTimesFrom(jobId);
  renderDayPlan();
  persistEstTimes(); // save all estimated times to Firestore
}
// Save estimated start times back to each job's schedule.estStart in Firestore
function persistEstTimes() {
  const ord = dpOrder[dpDate]||[];
  ord.forEach(id=>{
    const t = dpTimes[dpKey(id)]; if(!t) return;
    const j = jobs.find(j=>j.id===id); if(!j) return;
    if(!j.schedule) j.schedule={};
    if(j.schedule.estStart === t) return; // no change
    j.schedule.estStart = t;
    saveJob(j).catch(()=>{});
  });
}
function cascadeTimesFrom(fromId) {
  const j = jobs.find(j=>j.id===fromId); if(!j) return;
  const pilot = (j.schedule && j.schedule.pilot) || ""; if(!pilot) return;
  const ord = dpOrder[dpDate]||[];
  const pj = ord.map(id=>jobs.find(j=>j.id===id)).filter(j=>j&&((j.schedule&&j.schedule.pilot)||"")=== pilot);
  const idx = pj.findIndex(j=>j.id===fromId);
  // Also seed the fromId with actual takeoff if available
  if(j.completion && j.completion.takeoffTime && /^\d{1,2}:\d{2}/.test(j.completion.takeoffTime)){
    dpTimes[dpKey(fromId)] = j.completion.takeoffTime;
  }
  for (let i=Math.max(1,idx+1);i<pj.length;i++) {
    const cur=pj[i];
    // Skip jobs that already have actual takeoff times
    if(cur.completion && cur.completion.takeoffTime && /^\d{1,2}:\d{2}/.test(cur.completion.takeoffTime)){
      dpTimes[dpKey(cur.id)] = cur.completion.takeoffTime;
      continue;
    }
    const prev=pj[i-1];
    const actualLanding = prev.completion && prev.completion.landingTime
      ? prev.completion.landingTime : null;
    let nm;
    if(actualLanding && /^\d{1,2}:\d{2}/.test(actualLanding)){
      const [ph,pm]=actualLanding.split(':').map(Number);
      nm = ph*60+pm+15;
    } else {
      const pt=dpTimes[dpKey(prev.id)]||"07:00";
      const [ph,pm]=pt.split(":").map(Number);
      const blk=Math.round(estimateJob(prev).breakdown.blockTime*60);
      nm=ph*60+pm+blk+15;
    }
    dpTimes[dpKey(pj[i].id)]=String(Math.floor(nm/60)).padStart(2,"0")+":"+String(nm%60).padStart(2,"0");
  }
  // Persist all cascaded times to Firestore
  setTimeout(persistEstTimes, 500);
}
async function savePilotRecord(jobId){
  const j = jobs.find(j=>j.id===jobId); if(!j) return;
  if(!j.completion) j.completion={};
  j.completion.date      = document.getElementById('pr-date')?.value||j.completion.date;
  j.completion.pilot     = document.getElementById('pr-pilot')?.value||j.completion.pilot;
  j.completion.aircraft  = document.getElementById('pr-aircraft')?.value||j.completion.aircraft;
  j.completion.mixer     = document.getElementById('pr-mixer')?.value||j.completion.mixer;
  j.completion.takeoffTime = document.getElementById('pr-takeoff')?.value||j.completion.takeoffTime;
  j.completion.landingTime = document.getElementById('pr-landing')?.value||j.completion.landingTime;
  j.completion.vdoStart  = document.getElementById('pr-vdostart')?.value||j.completion.vdoStart;
  j.completion.vdoStop   = document.getElementById('pr-vdostop')?.value||j.completion.vdoStop;
  j.completion.swath     = parseFloat(document.getElementById('pr-swath')?.value)||j.completion.swath;
  j.completion.dispersal = document.getElementById('pr-dispersal')?.value||j.completion.dispersal;
  await saveJob(j);
  renderJobs();
  const btn=document.querySelector('#modal-body button[onclick*="savePilotRecord"]');
  if(btn){btn.textContent='✅ Saved!';setTimeout(()=>btn.textContent='💾 Save Changes',2000);}
}
function acSetMode(mode, jobId){
  var hrF=document.getElementById('ac-hr-fields');
  var haF=document.getElementById('ac-ha-fields');
  if(hrF) hrF.style.display=mode==='hr'?'grid':'none';
  if(haF) haF.style.display=mode==='ha'?'grid':'none';
  var btnHr=document.getElementById('ac-mode-hr');
  var btnHa=document.getElementById('ac-mode-ha');
  if(btnHr){btnHr.style.background=mode==='hr'?'var(--navy)':'#f0f4f8';btnHr.style.color=mode==='hr'?'#fff':'var(--navy)';}
  if(btnHa){btnHa.style.background=mode==='ha'?'var(--navy)':'#f0f4f8';btnHa.style.color=mode==='ha'?'#fff':'var(--navy)';}
  var j=jobs.find(function(jj){return jj.id===jobId;}); if(j) j.billingMode=mode;
  recalcActualBox(jobId);
}
function recalcActualBox(jobId){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const mode=(document.getElementById('ac-ha-fields')?.style.display==='grid')?'ha':'hr';
  const rate=parseFloat(document.getElementById('ac-rate')?.value)||0;
  const hours=parseFloat(document.getElementById('ac-hours')?.value)||0;
  const rateHa=parseFloat(document.getElementById('ac-rateha')?.value)||0;
  const chem=parseFloat(document.getElementById('ac-chem')?.value)||0;
  const other1=parseFloat(document.getElementById('ac-other1')?.value)||parseFloat(document.getElementById('ac-other')?.value)||0;
  const other2=parseFloat(document.getElementById('ac-other2')?.value)||0;
  const ha=estimateJob(j).totalHa||0;
  const fc=mode==='ha'?Math.round(rateHa*ha):Math.round(rate*hours);
  const total=fc+chem+other1+other2;
  const fmt=v=>new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:0}).format(v);
  const cEl=document.getElementById('act-cost'); if(cEl) cEl.textContent=total>0?fmt(total):'--';
  const hEl=document.getElementById('act-ha');   if(hEl) hEl.textContent=ha>0&&total>0?'$'+(total/ha).toFixed(2):'--';
  const dEl=document.getElementById('ac-total-display'); if(dEl) dEl.textContent=fmt(total);
}
function printInvoice(jobId){
  var j=jobs.find(function(j){return j.id===jobId;}); if(!j) return;
  var est=estimateJob(j), comp=j.completion||{};
  var rate=j.hourlyRate||3300;
  var hours=j.actualHours||0;
  var chem=j.chemCost||0;
  var other1b=j.other1||0; var other2b=j.other2||0;
  var allOther=chem+other1b+other2b;
  var ha=est.totalHa||0;
  var flightCharge=(j.billingMode==='ha')?Math.round((j.ratePerHa||0)*ha):Math.round((j.hourlyRate||3300)*(j.actualHours||0));
  var totalCharges=j.actualCost||(flightCharge+allOther);
  var gst=Math.round(totalCharges*0.1);
  var invTotal=totalCharges+gst;
  var date=comp.date||j.preferredDate||'';
  var dateStr=date?new Date(date+'T00:00:00').toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}):'--';
  var now=new Date();
  var yy=String(now.getFullYear()).slice(-2);
  var mm=String(now.getMonth()+1).padStart(2,'0');
  var dd=String(now.getDate()).padStart(2,'0');
  var rnd=Math.random().toString(36).slice(2,6).toUpperCase();
  var invNo='ATA-'+yy+mm+dd+'-'+rnd;
  var fmtA=function(v){return new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:2}).format(v);};
  var fmtN=function(v){return new Intl.NumberFormat('en-AU',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v);};
  var pads=(j.paddocks||[]).filter(function(p){return p.name||p.ha;});
  var seenCrops={};
  var crops=pads.map(function(p){return p.cropType;}).filter(function(v){if(v&&!seenCrops[v]){seenCrops[v]=1;return true;}return false;}).join(', ')||'--';
  var pilot=comp.pilot||(j.schedule&&j.schedule.pilot)||'--';
  var aircraft=comp.aircraft||(j.schedule&&j.schedule.aircraft)||'--';
  var clientName=j.invoiceTo||j.clientName||'--';

  // Paddock rows for the service table (one row per paddock)
  var padRows='';
  if(pads.length){
    pads.forEach(function(p){
      var desc=(j.applicationType||'Spray').toUpperCase()+' - '+(p.name||'Paddock')+(p.cropType?' ('+p.cropType+')':'');
      padRows+='<tr><td>'+desc+'</td>'
        +'<td align="center">'+(p.ha||0)+' HA</td>'
        +'<td align="right">-</td>'
        +'<td align="right">-</td></tr>';
    });
  } else if(ha>0){
    padRows='<tr><td>'+((j.applicationType||'Spray').toUpperCase())+' - '+(j.farmAddress||'--')+'</td>'
      +'<td align="center">'+ha.toFixed(2)+' HA</td>'
      +'<td align="right">-</td><td align="right">-</td></tr>';
  }
  // Product rows
  var prodRows='';
  (j.products||[]).filter(function(p){return p.name;}).forEach(function(p){
    var qty=((parseFloat(p.rate)||0)*ha).toFixed(1);
    var u=p.unit||'L';
    prodRows+='<tr style="background:#f8fafc"><td style="padding-left:18px;color:#555">'+p.name+' (Client Supplied)</td>'
      +'<td align="center">'+ha.toFixed(2)+' HA</td>'
      +'<td align="right">'+(p.rate||0)+' '+u+'/ha</td>'
      +'<td align="right">'+qty+' '+u+'</td></tr>';
  });

  var bmode=j.billingMode||'hr';
  var rateHa=j.ratePerHa||0;
  var airstrip=j.chemCost||0, airstripDesc=j.chemDesc||'Airstrip / Loading Area Maintenance';
  var other1=j.other1||0, other1Desc=j.other1Desc||'Other Charges';
  var other2=j.other2||0, other2Desc=j.other2Desc||'Other Charges';
  var flightCharge2=bmode==='ha'?Math.round(rateHa*ha):Math.round(rate*hours);
  var chargeRows='';
  if(bmode==='ha'&&rateHa>0){
    chargeRows+='<tr><td>AERIAL APPLICATION</td>'
      +'<td align="center">'+ha.toFixed(2)+' HA</td>'
      +'<td align="right">$'+fmtN(rateHa)+'/ha</td>'
      +'<td align="right"><b>'+fmtA(flightCharge2)+'</b></td></tr>';
  } else if(hours>0){
    chargeRows+='<tr><td>AERIAL APPLICATION</td>'
      +'<td align="center">'+ha.toFixed(2)+' HA</td>'
      +'<td align="right">$'+rate.toLocaleString()+'/hr</td>'
      +'<td align="right"><b>'+fmtA(flightCharge2)+'</b></td></tr>';
    chargeRows+='<tr style="background:#f8fafc"><td style="padding-left:18px;color:#555">'+hours.toFixed(2)+' hrs @ $'+rate.toLocaleString()+'/hr</td><td></td><td></td><td></td></tr>';
  } else {
    chargeRows+='<tr><td>AERIAL APPLICATION</td>'
      +'<td align="center">'+ha.toFixed(2)+' HA</td>'
      +'<td align="right">-</td>'
      +'<td align="right"><b>'+fmtA(flightCharge2)+'</b></td></tr>';
  }
  var airRateDisplay=(j.airstrip&&AIRSTRIP_RATES&&AIRSTRIP_RATES[j.airstrip])?'$'+AIRSTRIP_RATES[j.airstrip]+'/ha':'-';
  if(airstrip>0) chargeRows+='<tr><td>'+airstripDesc+'</td><td align="center">'+ha.toFixed(2)+' HA</td><td align="right">'+airRateDisplay+'</td><td align="right"><b>'+fmtA(airstrip)+'</b></td></tr>';
  if(other1>0) chargeRows+='<tr><td>'+other1Desc+'</td><td align="center">'+ha.toFixed(2)+' HA</td><td align="right">-</td><td align="right"><b>'+fmtA(other1)+'</b></td></tr>';
  if(other2>0) chargeRows+='<tr><td>'+other2Desc+'</td><td align="center">'+ha.toFixed(2)+' HA</td><td align="right">-</td><td align="right"><b>'+fmtA(other2)+'</b></td></tr>';

  var win=window.open('','_blank','width=850,height=1100');
  if(!win){alert('Allow popups to print invoice');return;}

  var css=''
    +'*{margin:0;padding:0;box-sizing:border-box}'
    +'body{font-family:Arial,Helvetica,sans-serif;font-size:9.5pt;color:#222;background:#fff}'
    +'.page{padding:14mm 16mm 10mm}'
    +'/* ── Header ── */'
    +'.hdr{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #1a3a5c;padding-bottom:10px;margin-bottom:12px}'
    +'.co-name{font-size:15pt;font-weight:900;color:#1a3a5c;letter-spacing:-.3px}'
    +'.co-sub{font-size:8pt;color:#666;margin-top:3px;line-height:1.5}'
    +'.inv-badge{text-align:right}'
    +'.inv-badge .title{font-size:20pt;font-weight:900;color:#1a3a5c;letter-spacing:1px}'
    +'.inv-badge .meta{font-size:8.5pt;color:#444;margin-top:4px;line-height:1.7}'
    +'/* ── Info grid ── */'
    +'.info{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}'
    +'.info-box{border:1px solid #ddd;border-radius:4px;padding:8px 10px}'
    +'.info-box .lbl{font-size:6.5pt;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px}'
    +'.info-box .val{font-size:9pt;line-height:1.6;color:#222}'
    +'.info-box .name{font-size:10.5pt;font-weight:700;color:#1a3a5c}'
    +'/* ── Tables ── */'
    +'table{width:100%;border-collapse:collapse;font-size:8.5pt;margin-bottom:10px}'
    +'thead tr{background:#1a3a5c}'
    +'thead th{color:#fff;padding:5px 7px;font-size:7pt;text-transform:uppercase;letter-spacing:.4px;font-weight:700}'
    +'tbody td{padding:5px 7px;border-bottom:1px solid #eee;vertical-align:top}'
    +'tbody tr:last-child td{border-bottom:none}'
    +'.sec-hdr{font-size:7pt;font-weight:700;color:#1a3a5c;text-transform:uppercase;letter-spacing:.6px;border-bottom:1.5px solid #1a3a5c;padding:4px 0 3px;margin-bottom:4px}'
    +'/* ── Totals ── */'
    +'.totals-wrap{display:flex;justify-content:flex-end;margin-bottom:14px}'
    +'.totals{border:1px solid #ddd;border-radius:4px;min-width:240px}'
    +'.tot-row{display:flex;justify-content:space-between;padding:5px 10px;font-size:9pt;border-bottom:1px solid #eee}'
    +'.tot-row:last-child{border-bottom:none}'
    +'.tot-row.grand{background:#1a3a5c;color:#fff;font-weight:900;font-size:12pt;border-radius:0 0 4px 4px}'
    +'/* ── Footer ── */'
    +'.ftr{border-top:2px solid #1a3a5c;margin-top:12px;padding-top:10px;display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:8pt;color:#555}'
    +'.ftr h4{font-weight:700;color:#1a3a5c;font-size:8.5pt;margin-bottom:5px}'
    +'.ftr .warning{color:#c00;font-weight:700;margin-top:6px;font-size:8.5pt}'
    +'@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{padding:0}@page{margin:12mm;size:A4}}';

  var html='<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tax Invoice '+invNo+'</title><style>'+css+'</style></head><body><div class="page">'
    // ── Header ──
    +'<div class="hdr">'
    +'<div><div class="co-name">AEROTECH AUSTRALASIA PTY LTD</div>'
    +'<div class="co-sub">7 Dakota Drive, Parafield Airport SA 5106<br>ABN: 72 056 435 208 &nbsp;|&nbsp; receivables@aerotech.net.au</div></div>'
    +'<div class="inv-badge"><div class="title">TAX INVOICE</div>'
    +'<div class="meta">'
    +'Invoice No: <b>'+invNo+'</b><br>'
    +'Invoice Date: <b>'+dateStr+'</b><br>'
    +(j.clientRef?'Your Order No: <b>'+j.clientRef+'</b><br>':'')
    +'Work Order: <b>'+(j.id||'').slice(-8)+'</b>'
    +'</div></div></div>'
    // ── Info Grid ──
    +'<div class="info">'
    +'<div class="info-box"><div class="lbl">Bill To</div>'
    +'<div class="name">'+clientName+'</div>'
    +(j.farmAddress?'<div class="val" style="margin-top:3px">'+j.farmAddress+'</div>':'')
    +(j.clientPhone?'<div class="val">'+j.clientPhone+'</div>':'')
    +'</div>'
    +'<div class="info-box"><div class="lbl">Job Details</div>'
    +'<div class="val">'
    +'<b>Farm:</b> '+(j.farmAddress||'--')+'<br>'
    +'<b>Airstrip:</b> '+(j.airstrip||'--')+'<br>'
    +'<b>Crop:</b> '+crops+'<br>'
    +'<b>Date:</b> '+dateStr+'<br>'
    +'<b>Pilot:</b> '+pilot+' &nbsp;|&nbsp; <b>Aircraft:</b> '+aircraft+'<br>'
    +'<b>Type:</b> '+((j.applicationType||'Spray').toUpperCase())+' &nbsp;|&nbsp; <b>Area:</b> '+ha.toFixed(2)+' ha'
    +'</div></div>'
    +'</div>'
    // ── Fields & Products table ──
    +(pads.length?'<div class="sec-hdr">Fields &amp; Products Applied</div>'
      +'<table><thead><tr>'
      +'<th style="width:52%">Description</th>'
      +'<th style="width:16%;text-align:center">Area</th>'
      +'<th style="width:16%;text-align:right">Rate</th>'
      +'<th style="width:16%;text-align:right">Quantity</th>'
      +'</tr></thead><tbody>'+padRows+prodRows+'</tbody></table>':'')
    // ── Charges table ──
    +'<div class="sec-hdr">Charge Details</div>'
    +'<table><thead><tr>'
    +'<th style="width:52%">Charge Description</th>'
    +'<th style="width:16%;text-align:center">Area</th>'
    +'<th style="width:16%;text-align:right">Rate</th>'
    +'<th style="width:16%;text-align:right">Amount</th>'
    +'</tr></thead><tbody>'+chargeRows+'</tbody></table>'
    // ── Totals ──
    +'<div class="totals-wrap"><div class="totals">'
    +'<div class="tot-row"><span>Total Charges</span><span>'+fmtA(totalCharges)+'</span></div>'
    +'<div class="tot-row"><span>GST (10%)</span><span>'+fmtA(gst)+'</span></div>'
    +'<div class="tot-row grand"><span>INVOICE TOTAL</span><span>'+fmtA(invTotal)+'</span></div>'
    +'</div></div>'
    // ── Footer ──
    +'<div class="ftr">'
    +'<div><h4>Payment Details</h4>'
    +'<p>BSB: <b>105 170</b></p>'
    +'<p>Account No: <b>764431740</b></p>'
    +'<p>Email: receivables@aerotech.net.au</p>'
    +'<p class="warning">PLEASE PAY ON INVOICE WITHIN 14 DAYS</p>'
    +'<p style="margin-top:4px">Please quote invoice number with payment.</p>'
    +'<p>No statement will be issued.</p>'
    +'</div>'
    +'<div><h4>AEROTECH AUSTRALASIA PTY LTD</h4>'
    +'<p>7 Dakota Drive</p><p>Parafield Airport SA 5106</p>'
    +'<p style="margin-top:4px">ABN: 72 056 435 208</p>'
    +'<div style="margin-top:14px;padding:8px 12px;background:#f0f4f8;border-radius:4px;border-left:3px solid #1a3a5c">'
    +'<div style="font-size:7.5pt;color:#888;margin-bottom:2px">INVOICE TOTAL (INC. GST)</div>'
    +'<div style="font-size:16pt;font-weight:900;color:#1a3a5c">'+fmtA(invTotal)+'</div>'
    +'</div></div></div>'
    +'</div>'
    +'<sc'+'ript>setTimeout(function(){window.print();},600);</s'+'cript>'
    +'</body></html>';

  win.document.write(html);
  win.document.close();
}
async function saveActualCost(jobId){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const mode=(document.getElementById('ac-ha-fields')?.style.display==='grid')?'ha':'hr';
  const rate=parseFloat(document.getElementById('ac-rate')?.value)||3300;
  const hours=parseFloat(document.getElementById('ac-hours')?.value)||0;
  const rateHa=parseFloat(document.getElementById('ac-rateha')?.value)||0;
  const chem=parseFloat(document.getElementById('ac-chem')?.value)||0;
  const chemDesc=document.getElementById('ac-chem-desc')?.value||'';
  // Support both the simple ac-other field and the detailed ac-other1/ac-other2 fields
  const other1El=document.getElementById('ac-other1');
  const other2El=document.getElementById('ac-other2');
  const otherSimpleEl=document.getElementById('ac-other');
  const other1=other1El ? parseFloat(other1El.value)||0 : (otherSimpleEl ? parseFloat(otherSimpleEl.value)||0 : 0);
  const other1Desc=document.getElementById('ac-other1-desc')?.value||'';
  const other2=other2El ? parseFloat(other2El.value)||0 : 0;
  const other2Desc=document.getElementById('ac-other2-desc')?.value||'';
  const ha=estimateJob(j).totalHa||0;
  const fc=mode==='ha'?Math.round(rateHa*ha):Math.round(rate*hours);
  const total=fc+chem+other1+other2;
  j.billingMode=mode; j.hourlyRate=rate; j.actualHours=hours; j.ratePerHa=rateHa;
  j.chemCost=chem; j.chemDesc=chemDesc;
  j.other1=other1; j.other1Desc=other1Desc;
  j.other2=other2; j.other2Desc=other2Desc;
  j.other1InPilotPay = document.getElementById('ac-other1-pilot')?.checked||false;
  j.other2InPilotPay = document.getElementById('ac-other2-pilot')?.checked||false;
  j.otherCharges=other1+other2; j.actualCost=total;
  await saveJob(j);
  renderJobs();
  openJob(jobId);
  // Brief green flash on the actual summary box as save confirmation
  setTimeout(()=>{
    const box=document.getElementById('actual-summary-box');
    if(box){box.style.transition='box-shadow .15s';box.style.boxShadow='0 0 0 3px #16a34a';setTimeout(()=>{box.style.boxShadow='';},900);}
  },80);
}
async function dpAssignPilot(jobId,pilot){const j=jobs.find(j=>j.id===jobId);if(!j)return;if(!j.schedule)j.schedule={};j.schedule.pilot=pilot;if(pilot&&j.schedule.aircraft)j.status='scheduled';await saveJob(j);renderDayPlan();renderJobs();}
async function dpAssignMixer(jobId,mixer){const j=jobs.find(j=>j.id===jobId);if(!j)return;if(!j.schedule)j.schedule={};j.schedule.mixer=mixer;await saveJob(j);renderDayPlan();}
async function dpAssignAircraft(jobId,aircraft){const j=jobs.find(j=>j.id===jobId);if(!j)return;if(!j.schedule)j.schedule={};j.schedule.aircraft=aircraft;if(aircraft&&j.schedule.pilot)j.status='scheduled';await saveJob(j);renderDayPlan();renderJobs();}
function dpMoveJob(jobId, dir) {
  const ord = dpOrder[dpDate]; if(!ord) return;
  const idx = ord.indexOf(jobId); if(idx<0) return;
  const ni = idx+dir; if(ni<0||ni>=ord.length) return;
  [ord[idx],ord[ni]] = [ord[ni],ord[idx]];
  dpOrder[dpDate] = [...ord];
  // Recascade times for the affected pilot group from the earliest affected job
  const j = jobs.find(j=>j.id===jobId);
  if(j) { const firstId = ord[Math.min(idx,ni)]; cascadeTimesFrom(firstId); }
  renderDayPlan();
}
function initDpDrag(){}


function updateEstimate(jobId) {
  const j = jobs.find(j=>j.id===jobId); if(!j) return;
  const ferry = parseFloat(document.getElementById('est-ferry')?.value)||15;
  const extra = parseFloat(document.getElementById('est-ferry-extra')?.value)||0;
  const hopperOvr = parseFloat(document.getElementById('est-hopper')?.value)||0;
  const swathOvr  = parseFloat(document.getElementById('est-swath')?.value)||0;
  const herbPctOvr = parseFloat(document.getElementById('est-herb-pct')?.value);
  const tmp = {...j, ferryBase: ferry, ferryExtra: extra, hopperOverride: hopperOvr||undefined, swathOverride: swathOvr||undefined};
  if(!isNaN(herbPctOvr)) tmp.herbLoadingPct = herbPctOvr;
  const est2 = estimateJob(tmp);
  const type2 = jobType(tmp);
  // Update summary boxes
  const sb = document.getElementById('est-summary-box');
  if(sb) sb.innerHTML =
    `<div class="ei"><div class="el">📅 Block Time</div><div class="ev" style="color:var(--navy)">${est2.fh(est2.breakdown.blockTime)}</div></div>`+
    `<div class="ei"><div class="el">✈️ Flight Time</div><div class="ev">${est2.fh(est2.breakdown.total)}</div></div>`+
    `<div class="ei"><div class="el">💰 Est. Cost</div><div class="ev">${fmtMoney(est2.cost)}</div></div>`+
    `<div class="ei"><div class="el">💵 Cost / ha</div><div class="ev">${est2.costPerHa>0?'$'+est2.costPerHa.toFixed(2):'—'}</div></div>`;
  // Update ferry label
  // Update loads badge
  const lb = document.getElementById('est-loads-badge');
  if(lb) lb.textContent = est2.loads+' load'+(est2.loads!==1?'s':'');
  const ul = document.getElementById('est-units-lbl');
  if(ul) ul.textContent = est2.totalUnits.toFixed(0)+' '+est2.unitLabel+' total';
  // Update table body
  const tb = document.getElementById('est-table-body');
  if(tb) tb.innerHTML =
    `<tr><td style="padding:6px 10px">🛩️ Application (flying paddocks · ${est2.swathM}m swath)</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est2.fh(est2.breakdown.appTime)}</td></tr>`+
    `<tr style="background:#f0f4f2"><td style="padding:6px 10px">🔄 Turn time at ends</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est2.fh(est2.breakdown.turnTime)}</td></tr>`+
    `<tr><td style="padding:6px 10px">🚗 Ferry (${ferry.toFixed(1)} km × 2 × ${est2.loads} load${est2.loads!==1?'s':''}${extra>0?' + '+extra.toFixed(1)+' km once-off':''})</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est2.fh(est2.breakdown.ferryTime)}</td></tr>`+
    `<tr style="background:#f0f4f2"><td style="padding:6px 10px">🔧 Reload time (${est2.loads} load${est2.loads!==1?'s':''} × ${est2.spread?'~2 min':'~10 min'} · ${est2.totalUnits.toFixed(0)}${est2.unitLabel} ÷ ${est2.hopper.toFixed(0)}${est2.unitLabel}/hopper)</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est2.fh(est2.breakdown.loadTime)}</td></tr>`+
    `<tr><td style="padding:6px 10px">🔍 Paddock inspection</td><td style="text-align:right;padding:6px 10px;font-weight:600">${est2.fh(est2.breakdown.inspect)}</td></tr>`+
    `<tr style="background:#e8f0ea;font-weight:700"><td style="padding:7px 10px;font-size:.85rem">✈️ Total Flight Time</td><td style="text-align:right;padding:7px 10px;font-size:.88rem;color:var(--green)">${est2.fh(est2.breakdown.total)}</td></tr>`+
    `<tr style="background:#dbeafe;font-weight:700"><td style="padding:7px 10px;font-size:.85rem">📅 Block Time (flight + reloads + 15 min setup)</td><td style="text-align:right;padding:7px 10px;font-size:.9rem;color:var(--blue)">${est2.fh(est2.breakdown.blockTime)}</td></tr>`;
}

async function saveFerryEdit(jobId) {
  const j = jobs.find(j=>j.id===jobId); if(!j) return;
  const ferry = parseFloat(document.getElementById('est-ferry')?.value)||15;
  const extra = parseFloat(document.getElementById('est-ferry-extra')?.value)||0;
  const hopperOvr2 = parseFloat(document.getElementById('est-hopper')?.value)||0;
  const swathOvr2 = parseFloat(document.getElementById('est-swath')?.value)||0;
  const herbPctSave = parseFloat(document.getElementById('est-herb-pct')?.value);
  j.ferryBase      = ferry;
  j.ferryExtra     = extra;
  j.hopperOverride = hopperOvr2 || null;
  j.swathOverride  = swathOvr2 || null;
  if(!isNaN(herbPctSave)) j.herbLoadingPct = herbPctSave;
  await saveJob(j);
  renderJobs();
  const msg = document.getElementById('ferry-saved-msg');
  if(msg){ msg.style.display='inline'; setTimeout(()=>msg.style.display='none',2000); }
}

function toggleHerbLoading(jobId){
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const est=estimateJob(j);
  // Toggle opposite of current state
  j.herbOverride = est.isHerb ? 'off' : 'on';
  saveJob(j); openJob(jobId);
}
window.toggleHerbLoading=toggleHerbLoading;

// ═══════════════════════════════════════════════════
// EXPOSE TO GLOBAL SCOPE (module scope isolation fix)
// ═══════════════════════════════════════════════════
window.switchTab      = switchTab;
function setPriceAircraft(jobId, acType){
  const j=jobs.find(x=>x.id===jobId); if(!j) return;
  j.priceAsAircraft = acType==='AT-502' ? 'VH-ODG' : 'VH-ODV';
  saveJob(j); openJob(jobId);
}
window.setPriceAircraft=setPriceAircraft;
window.setBase=setBase;
window.openJob        = openJob;
window.closeModal     = closeModal;
window.closeModalOnBg = closeModalOnBg;
window.saveSchedule   = saveSchedule;
window.updateStatus   = updateStatus;
window.deleteJob      = deleteJob;
window.editJob        = editJob;

// ═══ XERO OAUTH (PKCE) ═══
const XERO_SCOPES='openid profile email accounting.invoices accounting.contacts offline_access';

// Generate PKCE code verifier + challenge
async function pkceChallenge(){
  const verifier=Array.from(crypto.getRandomValues(new Uint8Array(32))).map(b=>b.toString(16).padStart(2,'0')).join('');
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(verifier));
  const challenge=btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
  return{verifier,challenge};
}

async function xeroConnect(){
  const clientId=(document.getElementById('cfg-xero-client-id')?.value||localStorage.getItem('at_xeroClientId')||'').trim();
  const clientSecret=(document.getElementById('cfg-xero-client-secret')?.value||localStorage.getItem('at_xeroClientSecret')||'').trim();
  if(!clientId){alert('Paste your Xero Client ID first in Settings → Xero.');return;}
  // Note: clientSecret is optional — PKCE apps don't use one
  localStorage.setItem('at_xeroClientId',clientId);
  if(clientSecret) localStorage.setItem('at_xeroClientSecret',clientSecret);
  else localStorage.removeItem('at_xeroClientSecret');
  const {verifier,challenge}=await pkceChallenge();
  localStorage.setItem('at_xeroVerifier',verifier);
  const state=Math.random().toString(36).slice(2);
  localStorage.setItem('at_xeroState',state);
  // Always use the canonical redirect URI — must match exactly what's in Xero developer app
  const redirectUri='https://app.aerops.com.au/';
  localStorage.setItem('at_xeroRedirectUri',redirectUri);
  const url='https://login.xero.com/identity/connect/authorize?'+new URLSearchParams({
    response_type:'code',client_id:clientId,redirect_uri:redirectUri,
    scope:XERO_SCOPES,state:state,
    code_challenge:challenge,code_challenge_method:'S256'
  });
  window.location.href=url;
}

function xeroDisconnect(){
  ['at_xeroToken','at_xeroRefresh','at_xeroTenantId','at_xeroExpiry','at_xeroState','at_xeroVerifier','at_xeroRedirectUri','at_xeroClientSecret','at_xeroClientId'].forEach(k=>localStorage.removeItem(k));
  const el=document.getElementById('xero-status');
  if(el){el.textContent='⚪ Disconnected — credentials cleared';el.style.color='#6b7280';}
  // Clear the UI fields too
  const ci=document.getElementById('cfg-xero-client-id'); if(ci) ci.value='';
  const cs=document.getElementById('cfg-xero-client-secret'); if(cs) cs.value='';
}

async function xeroExchangeCode(){
  const params=new URLSearchParams(window.location.search);
  const code=params.get('code'); const state=params.get('state');
  if(!code||state!==localStorage.getItem('at_xeroState')) return;
  // Clear URL params without reloading page
  window.history.replaceState({},'',window.location.pathname);
  const clientId=localStorage.getItem('at_xeroClientId')||'';
  const clientSecret=localStorage.getItem('at_xeroClientSecret')||'';
  const verifier=localStorage.getItem('at_xeroVerifier')||'';
  const redirectUri=localStorage.getItem('at_xeroRedirectUri')||'https://app.aerops.com.au/';
  try{
    // PKCE flow: call Xero token endpoint directly with code_verifier (no client_secret needed)
    // Web app flow: also works if clientSecret is provided
    const bodyParams=new URLSearchParams();
    bodyParams.set('grant_type','authorization_code');
    bodyParams.set('code',code);
    bodyParams.set('client_id',clientId);
    bodyParams.set('redirect_uri',redirectUri);
    if(verifier) bodyParams.set('code_verifier',verifier);
    if(clientSecret) bodyParams.set('client_secret',clientSecret);
    const resp=await fetch('https://identity.xero.com/connect/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:bodyParams.toString()
    });
    const data=await resp.json();
    if(data.access_token){
      localStorage.setItem('at_xeroToken',data.access_token);
      if(data.refresh_token) localStorage.setItem('at_xeroRefresh',data.refresh_token);
      const expiry=Date.now()+(data.expires_in||1800)*1000;
      localStorage.setItem('at_xeroExpiry',String(expiry));
      // Get tenant (organisation) ID — wrap in try/catch as api.xero.com/connections may have CORS on some browsers
      let tenantName='';
      try{
        const connResp=await fetch('https://api.xero.com/connections',{headers:{'Authorization':'Bearer '+data.access_token,'Content-Type':'application/json'}});
        const connections=await connResp.json();
        if(connections&&connections[0]){
          localStorage.setItem('at_xeroTenantId',connections[0].tenantId);
          localStorage.setItem('at_xeroOrgName',connections[0].tenantName||'');
          tenantName=connections[0].tenantName||'';
        }
      }catch(connErr){
        // CORS may block this — tenant ID will be fetched on first invoice push
        console.warn('Could not fetch Xero tenant ID yet — will retry on invoice push:',connErr.message);
      }
      const el=document.getElementById('xero-status');
      if(el){el.textContent='✅ Connected'+(tenantName?' — '+tenantName:'');el.style.color='#16a34a';}
      alert('✅ Xero connected successfully! You can now push invoices directly to Xero.');
    } else {
      console.error('Xero token error',data);
      alert('Xero connection failed: '+(data.error_description||data.error||JSON.stringify(data).slice(0,200))+'\n\nMake sure your Xero app is set up as a PKCE app (not Web app) at developer.xero.com');
    }
  }catch(e){
    console.error('Xero exchange error',e);
    alert('Xero connection error: '+e.message);
  }
}

async function xeroRefreshToken(){
  const refresh=localStorage.getItem('at_xeroRefresh');
  const clientId=localStorage.getItem('at_xeroClientId');
  const clientSecret=localStorage.getItem('at_xeroClientSecret')||'';
  if(!refresh||!clientId) return false;
  try{
    const params=new URLSearchParams();
    params.set('grant_type','refresh_token');
    params.set('refresh_token',refresh);
    params.set('client_id',clientId);
    if(clientSecret) params.set('client_secret',clientSecret);
    const resp=await fetch('https://identity.xero.com/connect/token',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body:params.toString()
    });
    const data=await resp.json();
    if(data.access_token){
      localStorage.setItem('at_xeroToken',data.access_token);
      if(data.refresh_token) localStorage.setItem('at_xeroRefresh',data.refresh_token);
      localStorage.setItem('at_xeroExpiry',String(Date.now()+(data.expires_in||1800)*1000));
      return true;
    }
  }catch(e){console.error('Xero refresh failed',e);}
  return false;
}

async function getXeroToken(){
  const expiry=parseInt(localStorage.getItem('at_xeroExpiry')||'0');
  if(Date.now()>expiry-60000){
    const ok=await xeroRefreshToken();
    if(!ok) return null;
  }
  return localStorage.getItem('at_xeroToken');
}
async function xeroPushInvoice(jobId){
  const token=await getXeroToken();
  if(!token){alert('Xero not connected. Go to Settings → Xero tab and tap "Connect to Xero".');return;}
  // If tenant ID wasn't captured during connect (CORS), fetch it now
  let tenantId=localStorage.getItem('at_xeroTenantId');
  if(!tenantId){
    try{
      const connResp=await fetch('https://api.xero.com/connections',{headers:{'Authorization':'Bearer '+token,'Content-Type':'application/json'}});
      const connections=await connResp.json();
      if(connections&&connections[0]){
        tenantId=connections[0].tenantId;
        localStorage.setItem('at_xeroTenantId',tenantId);
        localStorage.setItem('at_xeroOrgName',connections[0].tenantName||'');
      }
    }catch(e){console.warn('Tenant fetch failed:',e);}
  }
  if(!tenantId){alert('Xero connected but could not get organisation ID. Please disconnect and reconnect in Settings → Xero.');return;}
  const j=jobs.find(j=>j.id===jobId); if(!j) return;
  const est=estimateJob(j);
  const invStatus=localStorage.getItem('at_xeroInvStatus')||'AUTHORISED';
  const terms=parseInt(localStorage.getItem('at_xeroTerms')||'14');
  const acctCode=localStorage.getItem('at_xeroAccount')||'200';
  const taxType=localStorage.getItem('at_xeroTax')||'OUTPUT';
  const dueDate=new Date(); dueDate.setDate(dueDate.getDate()+terms);
  const dueDateStr=dueDate.toISOString().slice(0,10);
  const ha=est.totalHa; const rev=j.actualCost||est.cost;
  const lineItems=[];
  // Main flight charge
  const flightDesc=`${j.applicationType||'Aerial Spray'} - ${j.clientName||''} - ${j.airstrip||''} (${ha.toFixed(1)} ha)`;
  const flightAmt=j.billingMode==='ha'?(j.ratePerHa||0)*ha:((j.hourlyRate||3300)*(j.actualHours||0));
  if(flightAmt>0) lineItems.push({Description:flightDesc,UnitAmount:parseFloat(flightAmt.toFixed(2)),Quantity:1,AccountCode:acctCode,TaxType:taxType});
  // Airstrip
  if(j.chemCost>0) lineItems.push({Description:j.chemDesc||'Airstrip / Loading Area Maintenance',UnitAmount:parseFloat(j.chemCost.toFixed(2)),Quantity:1,AccountCode:acctCode,TaxType:taxType});
  // Other charges
  if(j.other1>0) lineItems.push({Description:j.other1Desc||'Other Charge 1',UnitAmount:parseFloat(j.other1.toFixed(2)),Quantity:1,AccountCode:acctCode,TaxType:taxType});
  if(j.other2>0) lineItems.push({Description:j.other2Desc||'Other Charge 2',UnitAmount:parseFloat(j.other2.toFixed(2)),Quantity:1,AccountCode:acctCode,TaxType:taxType});
  const payload={Invoices:[{Type:'ACCREC',Contact:{Name:j.invoiceTo||j.clientName||'Unknown'},
    LineItems:lineItems,Date:new Date().toISOString().slice(0,10),DueDate:dueDateStr,
    LineAmountTypes:'EXCLUSIVE',Status:invStatus,Reference:j.invoiceRef||'ATA-'+Date.now()}]};
  try{
    const res=await fetch('https://api.xero.com/api.xro/2.0/Invoices',{method:'POST',
      headers:{'Authorization':'Bearer '+token,'Xero-Tenant-Id':tenantId,'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify(payload)});
    const data=await res.json();
    if(res.ok&&data.Invoices?.[0]?.InvoiceID){
      j.xeroInvoiceId=data.Invoices[0].InvoiceID;
      j.xeroInvoiceNo=data.Invoices[0].InvoiceNumber||'';
      await saveJob(j);
      openJob(jobId);
      alert('✅ Invoice pushed to Xero! Invoice #: '+j.xeroInvoiceNo);
    } else {
      console.error('Xero error',data);
      alert('Xero error: '+(data.Message||JSON.stringify(data).slice(0,200)));
    }
  }catch(e){alert('Xero push failed: '+e.message);}
}
window.xeroConnect=xeroConnect;
window.updateStatus=updateStatus;
window.setJobStatus=setJobStatus;
window.renderPilotDone=renderPilotDone;
window.renderPriced=renderPriced;
window.renderInvoiced=renderInvoiced;
window.xeroDisconnect=xeroDisconnect;
window.xeroPushInvoice=xeroPushInvoice;
window.xeroRefreshToken=xeroRefreshToken;
// Check for Xero redirect on page load
if(window.location.search.includes('code=')&&window.location.search.includes('state=')) xeroExchangeCode();


// ═══ ADMIN: CLEAR ALL JOBS ═══
async function clearAllJobs(){
  const confirm1 = prompt('Type DELETE ALL to confirm clearing every job from Firestore and localStorage:');
  if(confirm1 !== 'DELETE ALL'){alert('Cancelled — nothing deleted.');return;}
  const confirm2 = confirm('FINAL WARNING: This will permanently delete ALL jobs. Are you absolutely sure?');
  if(!confirm2){alert('Cancelled.');return;}
  try{
    syncBadge('saving');
    // Delete all jobs from Firestore
    const snap = await getDocs(collection(db,'jobs'));
    const batch_size = snap.docs.length;
    let deleted = 0;
    for(const d of snap.docs){
      await deleteDoc(doc(db,'jobs',d.id));
      deleted++;
    }
    // Clear localStorage
    localStorage.removeItem('at_jobs');
    jobs = [];
    window._allJobs = [];
    syncBadge('live');
    renderJobs();
    if(currentTab==='scheduler') renderScheduler();
    closeStaffModal();
    alert('✅ Done — ' + deleted + ' job' + (deleted!==1?'s':'') + ' deleted. The system is now clean and ready for real jobs.');
  }catch(e){
    syncBadge('error');
    alert('Error deleting jobs: '+e.message);
  }
}
window.clearAllJobs = clearAllJobs;

window.openStaffModal = openStaffModal;
window.closeStaffModal= closeStaffModal;
window.closeStaffOnBg = closeStaffOnBg;
window.saveStaff      = saveStaff;
window.cfgTab         = cfgTab;
window.cfgAddPilot    = cfgAddPilot;
window.cfgAddMixer    = cfgAddMixer;
window.cfgAddAircraft = cfgAddAircraft;
window.cfgAddStrip    = cfgAddStrip;
window.cfgReadAircraftRows = cfgReadAircraftRows;
window.cfgAddHopperType = cfgAddHopperType;
window.cfgAddSwathType  = cfgAddSwathType;
window.addPaddockRow  = addPaddockRow;
window.addProductRow  = addProductRow;
window.onProdTypeChange = onProdTypeChange;
window.recalcProductRow = recalcProductRow;
window.recalcAllProductRows = recalcAllProductRows;
window.recalcWaterTotal = recalcWaterTotal;
window.setAppType = setAppType;
window.removeRow      = removeRow;
window.toggleReveal   = toggleReveal;
window.saveNewJob     = saveNewJob;
window.resetForm      = resetForm;
window.importJotForm  = importJotForm;
window.changeWeek     = changeWeek;
window.renderJobs     = renderJobs;
window.renderRecords  = renderRecords;
window.openDayPlan=openDayPlan;
window.closeDayModal=closeDayModal;
window.closeDayOnBg=closeDayOnBg;
window.dpSetTime=dpSetTime;
window.dpAssignPilot=dpAssignPilot;
window.dpAssignAircraft=dpAssignAircraft;
window.dpAssignMixer=dpAssignMixer;
window.dpMoveJob=dpMoveJob;
window.cascadeTimesFrom=cascadeTimesFrom;
window.updateEstimate=updateEstimate;
window.saveFerryEdit=saveFerryEdit;
window.acSetMode=acSetMode;
window.printInvoice=printInvoice;
window.saveActualCost=saveActualCost;
window.savePilotRecord=savePilotRecord;
window.recalcActualBox=recalcActualBox;

// ═══════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════
function setBase(b){
  currentBase=b; localStorage.setItem('at_base',b);
  const sel=document.getElementById('base-sel'); if(sel) sel.value=b;
  renderJobs();
  if(currentTab==='scheduler') renderScheduler();
  if(currentTab==='records') renderRecords();
}
function baseFilter(j){ return !currentBase || j.base===currentBase; }
function loadSettings(){
  // Use REST API directly for reliability
  fetch(FS_BASE+'/config/settings').then(r=>r.ok?r.json():null).then(d=>{
    if(!d||!d.fields) return;
    const remote=Object.fromEntries(Object.entries(d.fields).map(([k,v])=>[k,fsFromVal(v)]));
    localStorage.setItem('at_staff',JSON.stringify(remote));
    if(remote.stripObjs){
      Object.keys(AIRSTRIP_RATES).forEach(k=>delete AIRSTRIP_RATES[k]);
      remote.stripObjs.forEach(s=>{if(s.name&&s.rate!=null)AIRSTRIP_RATES[s.name]=parseFloat(s.rate);});
    }
    if(remote.xeroClientId && !localStorage.getItem('at_xeroClientId')){
      localStorage.setItem('at_xeroClientId', remote.xeroClientId);
    }
    renderJobs();
  }).catch(e=>console.warn('loadSettings REST:',e));
}

// Tab button event delegation (module scope fix)
document.querySelectorAll('[data-tab]').forEach(btn=>{
  btn.addEventListener('click',()=>switchTab(btn.dataset.tab));
});

loadSettings();
loadJobs();
setTimeout(()=>{const s=document.getElementById('base-sel');if(s)s.value=currentBase;},200);
setTimeout(()=>{if(!jobs.length)loadSampleData();renderJobs();},300);
renderJobs();
initForm();

// Global error catcher — surface JS errors visibly
window.addEventListener('error',(e)=>{
  console.error('GLOBAL ERROR:',e.message,'at',e.filename,e.lineno);
  const el=document.getElementById('sync-dot');
  if(el){el.textContent='⚠️ JS Error: '+e.message.slice(0,60);el.style.color='#ef4444';}
});
window.addEventListener('unhandledrejection',(e)=>{
  console.error('UNHANDLED PROMISE:',e.reason);
  const el=document.getElementById('sync-dot');
  if(el){el.textContent='⚠️ '+String(e.reason).slice(0,60);el.style.color='#ef4444';}
});
