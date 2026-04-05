// Aerotech Mixer PWA — app.js  (plain JS, no ES modules, no Firebase SDK)
'use strict';

var SPREAD_TYPES = ['Fertiliser','Urea','Snail Bait','Mouse Bait','Seed'];
var jobs = [], mixerName = '', jobId = '', activeJobIds = [];

// ─── Firestore REST ───────────────────────────────────────────
var FS_BASE = 'https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';
var FS_KEY  = 'AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI';

function fsVal(v) {
  if (!v) return null;
  if ('stringValue'  in v) return v.stringValue;
  if ('integerValue' in v) return parseInt(v.integerValue, 10);
  if ('doubleValue'  in v) return parseFloat(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue'    in v) return null;
  if ('arrayValue'   in v) return (v.arrayValue.values || []).map(fsVal);
  if ('mapValue'     in v) {
    var o = {}, f = v.mapValue.fields || {};
    Object.keys(f).forEach(function(k){ o[k] = fsVal(f[k]); });
    return o;
  }
  return null;
}
function fsDoc(doc) {
  var o = { id: doc.name.split('/').pop() }, f = doc.fields || {};
  Object.keys(f).forEach(function(k){ o[k] = fsVal(f[k]); });
  return o;
}
function fsToVal(v) {
  if (typeof v === 'string')  return { stringValue: v };
  if (typeof v === 'number')  return { doubleValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (v === null)             return { nullValue: null };
  if (Array.isArray(v))       return { arrayValue: { values: v.map(fsToVal) } };
  if (typeof v === 'object') {
    var f = {};
    Object.keys(v).forEach(function(k){ f[k] = fsToVal(v[k]); });
    return { mapValue: { fields: f } };
  }
  return { nullValue: null };
}
function fsUpdate(docId, data) {
  var fields = {};
  Object.keys(data).forEach(function(k){ fields[k] = fsToVal(data[k]); });
  var mask = Object.keys(data).map(function(k){ return 'updateMask.fieldPaths=' + k; }).join('&');
  return fetch(FS_BASE + '/jobs/' + docId + '?' + mask + '&key=' + FS_KEY, {
    signal: AbortSignal.timeout(20000),
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: fields })
  });
}
function fetchJobs() {
  fetch(FS_BASE + '/jobs?pageSize=200&key=' + FS_KEY, { signal: AbortSignal.timeout(20000) })
    .then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function(d){
      if (d.error) throw new Error(d.error.message);
      jobs = (d.documents || []).map(fsDoc);
      var b = document.getElementById('sync-badge');
      b.textContent = 'Live'; b.className = 'sync ok';
      if (document.getElementById('s-jobs').classList.contains('active')) renderJobs();
    })
    .catch(function(e){
      var b = document.getElementById('sync-badge');
      b.textContent = 'Retrying...'; b.className = 'sync ok';
      setTimeout(fetchJobs, 5000);
    });
}
fetchJobs();
setInterval(fetchJobs, 10000);

// ─── Helpers ──────────────────────────────────────────────────
function show(id){ document.querySelectorAll('.screen').forEach(function(s){ s.classList.toggle('active', s.id===id); }); }

function today() {
  // Use Adelaide timezone — handles ACST (UTC+9:30) and ACDT (UTC+10:30) automatically
  return new Date().toLocaleDateString('en-CA', {timeZone: 'Australia/Adelaide'});
}

function getDate(j){ return (j.schedule && j.schedule.scheduledDate) || j.preferredDate || ''; }

function jobClass(j){
  var p = j.products || [];
  if (p.some(function(x){ return x.type === 'Misting'; })) return 'misting';
  if (p.some(function(x){ return SPREAD_TYPES.indexOf(x.type) >= 0; })) return 'spread';
  return 'spray';
}

function calcLoads(j){
  var prods = j.products || [], pads = j.paddocks || [];
  var spread = prods.some(function(x){ return SPREAD_TYPES.indexOf(x.type) >= 0; });
  var totalHa = pads.reduce(function(s,p){ return s + (parseFloat(p.ha)||0); }, 0);
  var caps = {Urea:2000,Fertiliser:2400,'Snail Bait':2000,'Mouse Bait':1200,Seed:2000,Spray:3020};
  var hopper;
  if (spread) {
    var pp = prods.filter(function(x){ return SPREAD_TYPES.indexOf(x.type) >= 0; })[0];
    hopper = parseFloat(j.hopperOverride) || (pp ? caps[pp.type] || 2000 : 2000);
  } else {
    hopper = parseFloat(j.hopperOverride) || caps.Spray;
  }
  var waterRate = parseFloat(j.waterRate) || 30;
  var appRate = spread ? prods.reduce(function(s,p){ return s+(parseFloat(p.rate)||0); }, 0) || 1 : waterRate;
  var totalUnits = totalHa * appRate;
  var loads = Math.max(1, Math.ceil(totalUnits / hopper));
  var haPerLoad = Math.round((totalHa / loads) * 10000) / 10000;
  return { spread:spread, loads:loads, hopper:hopper, totalUnits:totalUnits,
           perLoad:haPerLoad*appRate, haPerLoad:haPerLoad, unit:spread?'kg':'L',
           totalHa:totalHa, appRate:appRate };
}

function getStock(id){ return JSON.parse(localStorage.getItem('mixer_stock_'+id)||'null'); }
function saveStock(id,s){ localStorage.setItem('mixer_stock_'+id, JSON.stringify(s)); }
function getProg(id){ return JSON.parse(localStorage.getItem('mixer_progress_'+id)||'{"load":0,"checks":{},"loadTimes":[]}'); }
function saveProg(id,p){ localStorage.setItem('mixer_progress_'+id, JSON.stringify(p)); }

function buildContainers(entries){
  var arr = [];
  (entries||[]).forEach(function(e){
    var s=parseFloat(e.size), c=parseInt(e.count,10);
    if (s>0&&c>0) for(var i=0;i<c;i++) arr.push(s);
  });
  return arr.sort(function(a,b){ return b-a; });
}
function calcContainerUsage(containers, amount){
  var state=containers.slice(), lines=[], rem=amount;
  for(var i=0;i<state.length&&rem>0.001;i++){
    if(state[i]<=0) continue;
    var used=Math.min(state[i],rem);
    rem-=used; state[i]-=used;
    lines.push({idx:i,size:containers[i],used:used,leftover:state[i]});
  }
  return {lines:lines,state:state,remaining:rem};
}

// ─── Auth ─────────────────────────────────────────────────────
function doAfterLogin(name){
  mixerName = name;
  document.getElementById('hdr-sub').textContent = 'Signed in as ' + name;
  var btn=document.getElementById('signout-btn');
  if(btn) btn.style.display='block';
  show('s-jobs');
  renderJobs();
}
// Called by login.js — also set _doAfterLogin so login.js stub can find it
window._doAfterLogin = doAfterLogin;
window._appLogin = doAfterLogin;

window.signOut = function(){
  localStorage.removeItem('at_mixer');
  mixerName = '';
  document.getElementById('hdr-sub').textContent = 'Sign in to continue';
  var btn=document.getElementById('signout-btn');
  if(btn) btn.style.display='none';
  document.getElementById('pin-section').style.display = 'none';
  document.querySelectorAll('.mixer-btn').forEach(function(b){ b.classList.remove('sel'); });
  show('s-login');
};

// ─── Jobs screen ──────────────────────────────────────────────
function renderJobs(){
  var td = today();
  var d = new Date(td + 'T00:00:00');
  document.getElementById('jobs-date').textContent = d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});
  var list = jobs.filter(function(j){
    if(getDate(j)!==td || j.status==='invoiced') return false;
    // 'ALL' mode: show every job scheduled today regardless of mixer assignment
    if(mixerName==='ALL') return true;
    // Normal mode: only show jobs assigned to this mixer
    return j.schedule && j.schedule.mixer===mixerName;
  })
    .sort(function(a,b){
      var pa=getProg(a.id), pb=getProg(b.id);
      var ald=calcLoads(a), bld=calcLoads(b);
      var adone=pa.load>=ald.loads, bdone=pb.load>=bld.loads;
      if(adone!==bdone) return adone?1:-1;
      return ((a.schedule&&(a.schedule.estStart||a.schedule.startTime))||'23:59').localeCompare((b.schedule&&(b.schedule.estStart||b.schedule.startTime))||'23:59');
    });
  var jl = document.getElementById('jobs-list');
  if (!list.length) {
    var synced = document.getElementById('sync-badge').classList.contains('ok');
    jl.innerHTML = (synced || jobs.length>0)
      ? '<div class="empty"><div class="ei">🌤</div><p>No jobs today (' + td + ').</p></div>'
      : '<div class="empty"><div class="ei">⏳</div><p>Connecting…</p></div>';
    return;
  }
  jl.innerHTML = list.map(function(j){
    var ld=calcLoads(j), cls=jobClass(j), p=getProg(j.id);
    var done=p.load>=ld.loads, pct=Math.min(100,Math.round((p.load/ld.loads)*100));
    var ac=cls==='spread'?'linear-gradient(135deg,#92400e,#b45309)':cls==='misting'?'linear-gradient(135deg,#5b21b6,#7c3aed)':'linear-gradient(135deg,#1e3a8a,#2563eb)';
    var pilot=(j.schedule&&(j.schedule.pilotName||j.schedule.pilot))||j.pilotName||j.pilot||'—';
    var aircraft=(j.schedule&&(j.schedule.aircraft||j.schedule.aircraftReg))||j.aircraft||j.agentName||j.aircraftReg||'—';
    var prods=(j.products||[]).map(function(x){return x.name||x.type;}).join(', ')||'—';
    var isHerb_m = j.appSubType==='Herbicide' || (!j.appSubType && (j.products||[])[0]&&(j.products||[])[0].type==='Herbicide') || j.herbOverride==='on';
    return '<div style="background:'+(isHerb_m?'#fee2e2':'#fff')+';border-left:'+(isHerb_m?'4px solid #dc2626':'none')+';border-radius:14px;margin-bottom:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);cursor:pointer" onclick="goJobOrMixing(\''+j.id+'\')">'
      +'<div style="background:'+ac+';padding:12px 14px;display:flex;justify-content:space-between;align-items:flex-start">'
      +'<div><div style="font-size:1rem;font-weight:900;color:#fff">'+(j.clientName||'—')+(done?' ✅':'')+'</div>'
      +'<div style="font-size:.75rem;color:rgba(255,255,255,.85);margin-top:2px">'+(j.airstrip||'—')+' · '+aircraft+'</div>'
      +(j.schedule&&j.schedule.estStart?'<div style="font-size:.78rem;color:#fff;font-weight:800;margin-top:3px;background:rgba(0,0,0,.18);border-radius:6px;padding:2px 7px;display:inline-block">🕐 Est. '+j.schedule.estStart+'</div>':'')
      +'<div style="font-size:.72rem;color:rgba(255,255,255,.75);margin-top:2px">Pilot: '+pilot+'</div></div>'
      +'<div style="text-align:right">'
      +'<div style="font-size:.65rem;color:rgba(255,255,255,.7);text-transform:uppercase">'+(cls==='spread'?'🌾 Spread':'💧 Spray')+'</div>'
      +'<div style="font-size:.72rem;color:rgba(255,255,255,.85);margin-top:4px">'+ld.loads+' loads · '+ld.totalHa.toFixed(0)+' ha</div>'
      +(done?'<div style="background:rgba(255,255,255,.25);border-radius:10px;padding:2px 8px;font-size:.65rem;font-weight:800;color:#fff;margin-top:4px">DONE</div>':'')
      +'</div></div>'
      +'<div style="padding:10px 14px">'
      +'<div style="font-size:.72rem;color:var(--muted);margin-bottom:6px">'+prods+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">'
      +'<div style="text-align:center;background:#f8fafc;border-radius:8px;padding:6px"><div style="font-size:1rem;font-weight:800;color:var(--navy)">'+ld.totalHa.toFixed(0)+'</div><div style="font-size:.6rem;color:var(--muted)">ha</div></div>'
      +'<div style="text-align:center;background:#f8fafc;border-radius:8px;padding:6px"><div style="font-size:1rem;font-weight:800;color:var(--navy)">'+ld.loads+'</div><div style="font-size:.6rem;color:var(--muted)">loads</div></div>'
      +'<div style="text-align:center;background:#f8fafc;border-radius:8px;padding:6px"><div style="font-size:1rem;font-weight:800;color:var(--navy)">'+p.load+'</div><div style="font-size:.6rem;color:var(--muted)">done</div></div>'
      +'</div>'
      +'<div style="display:flex;align-items:center;gap:10px">'
      +'<div class="progress-bar" style="flex:1;margin-bottom:0"><div class="progress-fill" style="width:'+pct+'%;background:'+(cls==='spread'?'#b45309':cls==='misting'?'#7c3aed':'#2563eb')+'"></div></div>'
      +(done
        ?'<span style="background:#dcfce7;color:#166534;border-radius:10px;padding:3px 10px;font-size:.68rem;font-weight:800;white-space:nowrap">✅ Completed</span>'
        :(p.load>0
          ?'<span id="job-timer-'+j.id+'" style="background:#dbeafe;color:#1e40af;border-radius:10px;padding:3px 10px;font-size:.68rem;font-weight:800;white-space:nowrap;font-family:monospace">🔵 Active</span>'
          :'<span style="background:#f3f4f6;color:#6b7280;border-radius:10px;padding:3px 10px;font-size:.68rem;font-weight:800;white-space:nowrap">Pending</span>'))
      +'</div>'
      +'</div></div>';
  }).join('');
  startJobsTimers(list);
}
window.renderJobs = renderJobs;

var _jobsTimerInterval = null;
function startJobsTimers(list){
  if(_jobsTimerInterval) clearInterval(_jobsTimerInterval);
  _jobsTimerInterval = setInterval(function(){
    list.forEach(function(j){
      var p = getProg(j.id);
      var ld = calcLoads(j);
      var done = p.load >= ld.loads;
      if(done || !p.load || !p.lastLoadTime) return;
      var el = document.getElementById('job-timer-'+j.id);
      if(!el) return;
      var secs = Math.floor((Date.now() - p.lastLoadTime) / 1000);
      var mm = String(Math.floor(secs/60)).padStart(2,'0');
      var ss = String(secs%60).padStart(2,'0');
      var over = secs > 1800;
      if(over){
        el.textContent = '⚠️ '+mm+':'+ss;
        el.style.background = '#fee2e2';
        el.style.color = '#dc2626';
      } else {
        el.textContent = '⏱ '+mm+':'+ss;
        el.style.background = '#dbeafe';
        el.style.color = '#1e40af';
      }
    });
  }, 1000);
}


// ─── Navigation ───────────────────────────────────────────────

window.goJobOrMixing = function(id){
  var p = getProg(id);
  var j = jobs.find(function(x){return x.id===id;});
  var ld = j ? calcLoads(j) : null;
  var done = ld && p.load >= ld.loads;
  if(!done && p.load > 0){
    // Job has been started — go straight to mixing screen
    goMixing(id);
  } else {
    goDetail(id);
  }
};
window.goDetail = function(id){
  jobId = id;
  document.getElementById('s-mixing').style.background = '';
  show('s-detail');
  renderDetail();
};
window.goStock = function(id){
  jobId = id;
  show('s-stock');
  renderStock();
};
window.goMixing = function(id){
  jobId = id;
  if (activeJobIds.indexOf(id)<0) {
    if (activeJobIds.length>=3) activeJobIds.shift();
    activeJobIds.push(id);
  }
  show('s-mixing');
  document.getElementById('s-mixing').style.background = '#0f1421';
  renderMixing();
};
window.switchMixJob = function(id){ jobId=id; renderMixing(); };
window.resetJob = function(){
  localStorage.removeItem('mixer_progress_'+jobId);
  renderMixing();
};
window.pauseJob = function(){
  var p=getProg(jobId); p.paused=true; saveProg(jobId,p);
  if(_timerInterval){clearInterval(_timerInterval);_timerInterval=null;}
  show('s-jobs'); renderJobs();
};
window.resumeJob = function(){
  var p=getProg(jobId); p.paused=false; saveProg(jobId,p); renderMixing();
};

// ─── Detail ───────────────────────────────────────────────────
function renderDetail(){
  var j=jobs.find(function(x){return x.id===jobId;});
  if(!j){document.getElementById('detail-wrap').innerHTML='<p style="padding:20px">Not found.</p>';return;}
  var ld=calcLoads(j), p=getProg(jobId), prods=j.products||[];
  var pct=Math.min(100,Math.round((p.load/ld.loads)*100));
  var pilot=(j.schedule&&(j.schedule.pilotName||j.schedule.pilot))||j.pilotName||j.pilot||'—';
  var aircraft=(j.schedule&&(j.schedule.aircraft||j.schedule.aircraftReg))||j.aircraft||j.agentName||j.aircraftReg||'—';
  var cls=jobClass(j);
  var ac=cls==='spread'?'linear-gradient(135deg,#92400e,#b45309)':cls==='misting'?'linear-gradient(135deg,#5b21b6,#7c3aed)':'linear-gradient(135deg,#1e3a8a,#2563eb)';
  var html='<button class="back-btn" onclick="show(\'s-jobs\');renderJobs()">← Back to jobs</button>';
  // Orange job header
  html+='<div style="background:'+ac+';border-radius:14px;padding:14px 16px;margin-bottom:10px">'
    // Top row: client left, type+status right
    +'<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'
    +'<div><div style="font-size:1.05rem;font-weight:900;color:#fff">'+(j.clientName||'—')+'</div>'
    +'<div style="font-size:.78rem;color:rgba(255,255,255,.85);margin-top:3px">'+(j.airstrip||'—')+'</div></div>'
    +'<div style="text-align:right">'
    +'<div style="font-size:.65rem;color:rgba(255,255,255,.7);text-transform:uppercase">'+(cls==='spread'?'🌾 Spread':'💧 Spray')+'</div>'
    +(p.load>=ld.loads
      ?'<div style="background:rgba(255,255,255,.25);border-radius:10px;padding:3px 10px;font-size:.7rem;font-weight:800;color:#fff;margin-top:6px">✅ Complete</div>'
      :(p.load>0?'<div style="background:rgba(255,255,255,.2);border-radius:10px;padding:3px 10px;font-size:.7rem;font-weight:800;color:#fff;margin-top:6px">🔵 Active</div>':''))
    +'</div></div>'
    // Centre: aircraft registration — large and prominent
    +'<div style="text-align:center;border-top:1px solid rgba(255,255,255,.25);border-bottom:1px solid rgba(255,255,255,.25);padding:10px 0;margin-bottom:10px">'
    +'<div style="font-size:.6rem;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Aircraft</div>'
    +'<div style="font-size:1.8rem;font-weight:900;color:#fff;letter-spacing:2px;font-family:monospace">'+aircraft+'</div>'
    +'</div>'
    // Bottom row: pilot left, mixer right
    +'<div style="display:flex;justify-content:space-between">'
    +'<div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">Pilot</div>'
    +'<div style="font-size:.82rem;font-weight:800;color:#fff">'+pilot+'</div></div>'
    +'<div style="text-align:right"><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">Mixer</div>'
    +'<div style="font-size:.82rem;font-weight:800;color:#fff">'+mixerName+'</div></div>'
    +'</div></div>';
  // Blue load plan card
  html+='<div style="background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:14px;padding:14px 16px;margin-bottom:10px">'
    +'<div style="font-size:.6rem;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">🪣 Load Plan</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'
    +'<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.totalHa.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">ha total</div></div>'
    +'<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.appRate.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">'+ld.unit+'/ha</div></div>'
    +'<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.totalUnits.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">'+ld.unit+' total</div></div>'
    +'</div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.15)">'
    +'<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fbbf24">'+ld.loads+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">loads</div></div>'
    +'<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fff">'+ld.haPerLoad.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">ha/load</div></div>'
    +'<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fff">'+ld.perLoad.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase">'+ld.unit+'/load</div></div>'
    +'</div>'
    +'<div style="font-size:.68rem;color:rgba(255,255,255,.55);margin-top:8px">Hopper: '+(ld.hopper||0).toFixed(0)+' '+ld.unit+' · '+(ld.spread?'Spread':'Spray')+'</div>'
    +'</div>';
  // Progress
  html+='<div style="background:rgba(0,0,0,.06);border-radius:6px;height:6px;margin-bottom:4px;overflow:hidden">'
    +'<div style="height:100%;border-radius:6px;background:#2563eb;width:'+pct+'%;transition:.3s"></div></div>'
    +'<div style="font-size:.72rem;color:var(--muted);margin-bottom:12px">'+pct+'% complete · '+p.load+' of '+ld.loads+' loads done</div>';
  html+='<div class="card"><div class="sec-title">Products</div><table class="tbl">'+
    '<thead><tr><th>Product</th><th>Type</th><th>Rate</th><th>Per Load</th></tr></thead><tbody>'+
    prods.map(function(prod){
      var rate=parseFloat(prod.rate)||0, perLoad=rate*ld.haPerLoad;
      return '<tr><td><b>'+(prod.name||prod.type||'—')+'</b></td>'+
        '<td style="color:var(--muted)">'+(prod.type||'—')+'</td>'+
        '<td>'+rate+' '+ld.unit+'/ha</td>'+
        '<td><b>'+perLoad.toFixed(1)+' '+ld.unit+'</b></td></tr>';
    }).join('')+'</tbody></table></div>';
  if(p.loadTimes&&p.loadTimes.length){
    html+='<div class="card"><div class="sec-title">Load History</div>'+
      p.loadTimes.map(function(t,i){return '<div class="mx-history-row"><span>Load '+(i+1)+'</span><b>'+t+'</b></div>';}).join('')+'</div>';
  }
  html+='<button class="load-btn blue" onclick="goStock(\''+j.id+'\')">📦 Set Up Stock</button>';
  html+='<button class="load-btn ghost" style="margin-top:8px" onclick="goMixing(\''+j.id+'\')">'+
    (p.load>=ld.loads?'✅ View Completed Job':'🧪 Open Mixing Sheet')+'</button>';
  if(p.load>0) html+='<button class="load-btn ghost" style="margin-top:8px;color:var(--red)" onclick="resetJob()">↺ Reset</button>';
  document.getElementById('detail-wrap').innerHTML=html;
}

// ─── Stock ────────────────────────────────────────────────────
function renderStock(){
  var j=jobs.find(function(x){return x.id===jobId;}); if(!j) return;
  var ld=calcLoads(j), prods=j.products||[], stockData=getStock(jobId)||{};
  var html='<button class="back-btn" onclick="goDetail(\''+jobId+'\')">← Back</button>';
  html+='<div class="card"><div class="sec-title">Stock Setup</div>';
  prods.forEach(function(prod,pi){
    var rate=parseFloat(prod.rate)||0, totalNeeded=rate*ld.totalHa, unit=ld.unit;
    var sd=stockData[pi]||{entries:[{size:'',count:''}]};
    html+='<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #f0f2f5">'+
      '<div style="font-weight:800;font-size:.9rem;color:var(--navy);margin-bottom:8px">'+
      (prod.name||prod.type||'Product '+(pi+1))+' — need '+totalNeeded.toFixed(1)+' '+unit+'</div>'+
      '<div id="containers-'+pi+'">';
    sd.entries.forEach(function(e,ei){
      html+='<div class="stock-input-row">'+
        '<label>Size ('+unit+'):</label>'+
        '<input class="si" type="number" id="csize-'+pi+'-'+ei+'" value="'+(e.size||'')+'" placeholder="200" oninput="updateStockPreview('+pi+','+totalNeeded+',\''+unit+'\')">'+
        '<label>Count:</label>'+
        '<input class="si" type="number" id="ccount-'+pi+'-'+ei+'" value="'+(e.count||'')+'" placeholder="5" oninput="updateStockPreview('+pi+','+totalNeeded+',\''+unit+'\')">'+
        '</div>';
    });
    html+='</div>'+
      '<button class="load-btn ghost" style="padding:8px;margin-top:4px" onclick="addContainerRow('+pi+','+totalNeeded+',\''+unit+'\')">+ Add size</button>'+
      '<label style="display:flex;align-items:center;gap:8px;margin-top:10px;font-size:.85rem;font-weight:600;cursor:pointer">'+
      '<input type="checkbox" id="useall-'+pi+'" onchange="useAllStock('+pi+','+totalNeeded+',\''+unit+'\','+ld.totalHa+','+rate+')"> Use all available stock (adjusts rate)</label>'+
      '<div id="stock-preview-'+pi+'" style="margin-top:8px;font-size:.82rem"></div></div>';
  });
  html+='<button class="load-btn blue" onclick="saveStockSetup()">Save & Start Mixing</button></div>';
  document.getElementById('stock-setup-wrap').innerHTML=html;
  prods.forEach(function(prod,pi){
    var rate=parseFloat(prod.rate)||0;
    updateStockPreview(pi, rate*ld.totalHa, ld.unit);
  });
}
window.addContainerRow=function(pi,totalNeeded,unit){
  var stockData=getStock(jobId)||{};
  var sd=stockData[pi]||{entries:[]};
  sd.entries.push({size:'',count:''});
  stockData[pi]=sd; saveStock(jobId,stockData); renderStock();
};
window.updateStockPreview=function(pi,totalNeeded,unit){
  var entries=[], i=0;
  while(document.getElementById('csize-'+pi+'-'+i)){
    entries.push({size:document.getElementById('csize-'+pi+'-'+i).value,
                  count:document.getElementById('ccount-'+pi+'-'+i).value});
    i++;
  }
  var total=buildContainers(entries).reduce(function(s,c){return s+c;},0);
  var el=document.getElementById('stock-preview-'+pi); if(!el) return;
  if(!total){el.innerHTML='';return;}
  var diff=total-totalNeeded;
  if(diff>=0){
    el.innerHTML='<span class="s-ok">✅ '+total.toFixed(0)+' '+unit+' ('+diff.toFixed(0)+' extra)</span>';
  } else {
    el.innerHTML='<span class="s-low">⚠️ SHORT: have '+total.toFixed(0)+', need '+totalNeeded.toFixed(0)+' '+unit+
      ' — tick "Use all available stock" to adjust rate</span>';
  }
};
window.saveStockSetup=function(){
  var j=jobs.find(function(x){return x.id===jobId;}); if(!j) return;
  var prods=j.products||[], stockData=getStock(jobId)||{}, rateOverrides={};
  prods.forEach(function(prod,pi){
    var entries=[], i=0;
    while(document.getElementById('csize-'+pi+'-'+i)){
      entries.push({size:document.getElementById('csize-'+pi+'-'+i).value,
                    count:document.getElementById('ccount-'+pi+'-'+i).value});
      i++;
    }
    stockData[pi]={entries:entries,containers:buildContainers(entries)};
    var cb=document.getElementById('useall-'+pi);
    if(cb&&cb.checked&&cb.dataset.newRate) rateOverrides[pi]=parseFloat(cb.dataset.newRate);
  });
  saveStock(jobId,stockData);
  var allOvr=JSON.parse(localStorage.getItem('mixer_rate_overrides')||'{}');
  allOvr[jobId]=rateOverrides; localStorage.setItem('mixer_rate_overrides',JSON.stringify(allOvr));
  goMixing(jobId);
};

// ─── Mixing ───────────────────────────────────────────────────
var _mixHoldIv=null;
function renderMixing(){
  var j=jobs.find(function(x){return x.id===jobId;});
  var wrap=document.getElementById('mixing-wrap');
  if(!j){wrap.innerHTML='<div class="mx-bg"><p style="color:#94a3b8">Not found.</p></div>';return;}
  // Auto-refresh hold banner every 5s so pilot changes show without manual refresh
  if(_mixHoldIv) clearInterval(_mixHoldIv);
  _mixHoldIv=setInterval(function(){
    var fj=jobs.find(function(x){return x.id===jobId;});
    if(!fj) return;
    var b=document.getElementById('hold-banner');
    if(fj.pilotHold&&!b) renderMixing();
    else if(!fj.pilotHold&&b) renderMixing();
  },5000);
  var ld=calcLoads(j), cls=jobClass(j), p=getProg(jobId), prods=j.products||[];
  var stockData=getStock(jobId)||{};
  var pct=Math.min(100,Math.round((p.load/ld.loads)*100));
  var allDone=p.load>=ld.loads;

  var html='<div class="mx-bg">';
  // Multi-job toggle
  if(activeJobIds.length>1){
    html+='<div class="mx-toggle-bar">';
    activeJobIds.forEach(function(aid){
      var aj=jobs.find(function(x){return x.id===aid;}), acls=aj?jobClass(aj):'spray';
      var ap=getProg(aid), ald=aj?calcLoads(aj):null, adone=ald&&ap.load>=ald.loads;
      html+='<button class="mx-toggle-btn'+(aid===jobId?' active '+acls:'')+(adone?' done-job':'')+'" onclick="switchMixJob(\''+aid+'\')">'+
        (aj?aj.clientName||aid:aid)+(adone?' ✅':'')+'</button>';
    });
    html+='</div>';
  }
  html+='<button class="mx-back-btn" onclick="goDetail(\''+jobId+'\')">← Back</button>';

  // Orange job header (matches pilot app)
  var mxPilot=(j.schedule&&(j.schedule.pilotName||j.schedule.pilot))||j.pilotName||j.pilot||'—';
  var mxAircraft=(j.schedule&&(j.schedule.aircraft||j.schedule.aircraftReg))||j.aircraft||j.agentName||j.aircraftReg||'—';
  html+='<div style="background:linear-gradient(135deg,#d97706,#f59e0b);border-radius:14px;padding:14px 16px;margin-bottom:10px">'+
    // Top row: load number left, client+airstrip right
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">'+
    '<div style="font-size:2.5rem;font-weight:900;color:#fff;opacity:.9;line-height:1;min-width:48px">'+(p.load+1)+'</div>'+
    '<div style="text-align:right">'+
    '<div style="font-size:1.05rem;font-weight:900;color:#fff">'+(j.clientName||'—')+'</div>'+
    '<div style="font-size:.78rem;color:rgba(255,255,255,.85);margin-top:2px">'+(j.airstrip||'—')+'</div>'+
    '</div></div>'+
    // Centre: aircraft registration — large and prominent
    '<div style="text-align:center;border-top:1px solid rgba(255,255,255,.25);border-bottom:1px solid rgba(255,255,255,.25);padding:10px 0;margin-bottom:10px">'+
    '<div style="font-size:.6rem;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:1px;margin-bottom:4px">Aircraft</div>'+
    '<div style="font-size:1.8rem;font-weight:900;color:#fff;letter-spacing:2px;font-family:monospace">'+mxAircraft+'</div>'+
    '</div>'+
    // Bottom row: pilot left, mixer right
    '<div style="display:flex;justify-content:space-between">'+
    '<div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">Pilot</div>'+
    '<div style="font-size:.82rem;font-weight:800;color:#fff">'+mxPilot+'</div></div>'+
    '<div style="text-align:right"><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">Mixer</div>'+
    '<div style="font-size:.82rem;font-weight:800;color:#fff">'+mixerName+'</div></div>'+
    '</div></div>';

  // Blue load plan card
  html+='<div style="background:linear-gradient(135deg,#1e40af,#2563eb);border-radius:14px;padding:14px 16px;margin-bottom:10px">'+
    '<div style="font-size:.6rem;font-weight:800;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px">🪣 Load Plan</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">'+
    '<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.totalHa.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">ha total</div></div>'+
    '<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.appRate.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">'+ld.unit+'/ha</div></div>'+
    '<div style="text-align:center"><div style="font-size:1.3rem;font-weight:900;color:#fff">'+ld.totalUnits.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">'+ld.unit+' total</div></div>'+
    '</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding-top:10px;border-top:1px solid rgba(255,255,255,.15)">'+
    '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fbbf24">'+ld.loads+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">loads</div></div>'+
    '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fff">'+ld.haPerLoad.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">ha/load</div></div>'+
    '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:900;color:#fff">'+ld.perLoad.toFixed(0)+'</div><div style="font-size:.6rem;color:rgba(255,255,255,.6);text-transform:uppercase;letter-spacing:.5px">'+ld.unit+'/load</div></div>'+
    '</div>'+
    '<div style="font-size:.68rem;color:rgba(255,255,255,.55);margin-top:8px">Hopper: '+ld.hopper.toFixed(0)+' '+ld.unit+' · '+(ld.spread?'Spread':'Spray')+'</div>'+
    '</div>';

  // Progress
  html+='<div style="background:rgba(255,255,255,.08);border-radius:6px;height:6px;margin-bottom:4px;overflow:hidden">'+
    '<div style="height:100%;border-radius:6px;background:#fbbf24;width:'+pct+'%;transition:.3s"></div></div>'+
    '<div style="font-size:.68rem;color:#4b5a7a;margin-bottom:8px">'+pct+'% · '+p.load+' of '+ld.loads+' loads done</div>';

  // Load timestamps - crucial for SAR times
  if(p.loadTimes&&p.loadTimes.length){
    html+='<div class="mx-history">';
    html+='<div style="font-size:.6rem;font-weight:800;color:#4b5a7a;text-transform:uppercase;letter-spacing:.6px;margin-bottom:6px">Load Times</div>';
    p.loadTimes.forEach(function(t,i){
      html+='<div class="mx-history-row"><span>Load '+(i+1)+'</span><b>'+t+'</b></div>';
    });
    html+='</div>';
  }

  if(allDone){
    html+='<div style="background:linear-gradient(135deg,#166534,#16a34a);border-radius:14px;padding:24px 20px;text-align:center;color:#fff;margin-bottom:12px">'+
      '<div style="font-size:3rem">✅</div>'+
      '<div style="font-weight:900;font-size:1.2rem;margin-top:8px">Job Complete!</div>'+
      '<div style="font-size:.85rem;opacity:.85;margin-top:4px">All '+ld.loads+' loads mixed for '+(j.clientName||'job')+'</div>'+
      '<button onclick="goBackToJobs()" style="margin-top:16px;background:#fff;color:#166534;border:none;border-radius:10px;padding:12px 28px;font-weight:900;font-size:1rem;cursor:pointer;width:100%">← Back to Jobs</button>'+
      '</div>';
    html+='<button class="mx-pause-btn" onclick="resetJob()">↺ Reset Job</button></div>';
    wrap.innerHTML=html; return;
  }

  if(j.pilotHold){
    html+='<div id="hold-banner" style="background:#dc2626;border:2px solid #f87171;border-radius:12px;padding:16px;text-align:center;margin-bottom:10px"><div style="font-size:1.3rem;margin-bottom:6px">🛑</div><div style="font-weight:800;color:#fff;font-size:1rem">HOLD — Pilot Has Paused Loading</div><div style="font-size:.75rem;color:#fca5a5;margin-top:4px">Wait for pilot to clear hold before loading</div><button class="mx-load-btn" style="margin-top:10px;background:#fbbf24;color:#1c1917;font-weight:800" onclick="if(confirm(\'⚠️ Clear hold? Only do this if you have spoken to the pilot.\')){clearPilotHold()}">🚫 Clear Hold</button></div><button class="mx-load-btn" disabled style="opacity:.5;cursor:not-allowed;background:#64748b">✈️ Load Plane — Hold Active</button>';
  }
  } else if(p.paused){
    html+='<div class="mx-paused-banner"><div style="font-size:1.5rem">⏸️</div>'+
      '<div style="font-weight:800;color:#fbbf24;margin-top:6px">Job Paused</div>'+
      '<button class="load-btn blue" style="margin-top:12px" onclick="resumeJob()">▶ Resume</button></div>';
  } else {
    var loadNum=p.load+1, checks=p.checks||{};
    html+='<div class="mx-load-hdr '+cls+'">'+
      '<div><div class="mx-load-title">Load '+loadNum+' of '+ld.loads+'</div>'+
      '<div class="mx-load-sub">'+ld.haPerLoad.toFixed(1)+' ha · '+ld.perLoad.toFixed(1)+' '+ld.unit+'</div></div></div>';

    var jobRateOvr=(JSON.parse(localStorage.getItem('mixer_rate_overrides')||'{}')[jobId]||{});
    prods.forEach(function(prod,pi){
      var rate=parseFloat(prod.rate)||0;
      if(jobRateOvr[pi]) rate=jobRateOvr[pi]; // apply use-all-stock override
      var amt=rate*ld.haPerLoad, checked=checks[pi]===true;
      var sd=stockData[pi], containers=(sd&&sd.containers)||[];
      // Simulate container use across prior loads
      var contState=containers.slice(), usedPrior=amt*p.load;
      for(var ci=0;ci<contState.length&&usedPrior>0.001;ci++){
        var take=Math.min(contState[ci],usedPrior); contState[ci]-=take; usedPrior-=take;
      }
      var usage=calcContainerUsage(contState, amt);
      html+='<div class="mx-prod'+(checked?' done-prod':'')+'" id="prod-'+pi+'">'+
        '<div class="mx-prod-name">'+(prod.name||prod.type||'Product '+(pi+1))+'</div>'+
        '<span class="mx-prod-amt">'+amt.toFixed(1)+'</span><span class="mx-prod-unit">'+ld.unit+'</span>';
      if(usage.lines.length){
        html+='<div class="mx-containers">';
        usage.lines.forEach(function(ln){
          html+='• <span class="copen">Container '+(ln.idx+1)+'</span>: '+ln.used.toFixed(2)+' '+ld.unit+
            ' (<span class="cleft">'+ln.leftover.toFixed(2)+' left</span>)<br>';
        });
        if(usage.remaining>0.001) html+='<span class="cshort">⚠️ Short '+usage.remaining.toFixed(2)+' '+ld.unit+'</span>';
        html+='</div>';
      }
      html+='<button class="mx-add-btn '+(checked?'added':'add')+'" onclick="toggleCheck('+pi+')">'+
        (checked?'✅ Added':'Tap when added')+'</button></div>';
    });

    var allChecked=prods.every(function(_,pi){ return checks[pi]===true; });
    html+='<button class="mx-load-btn '+cls+'" onclick="loadPlane()" '+(allChecked?'':'disabled')+'>'+
      '✈️ Load '+loadNum+' — Plane Away</button>';
    html+='<div id="mx-timer" style="text-align:center;margin:10px 0;font-size:1.4rem;font-weight:900;font-family:monospace;color:#4ade80;letter-spacing:2px">⏱ 00:00</div>';
    html+='<button class="mx-pause-btn" onclick="pauseJob()">⏸ Pause Job</button>';
    // Remaining stock panel
    var remHtml='<div class="mx-remaining"><div class="mx-rem-title">Stock Remaining After This Load</div>';
    prods.forEach(function(prod,pi){
      var rate=parseFloat(prod.rate)||0;
      var allOvr=JSON.parse(localStorage.getItem('mixer_rate_overrides')||'{}');
      var jobOvr=(allOvr[jobId]||{});
      var useRate=jobOvr[pi]||rate;
      var amt=useRate*ld.haPerLoad;
      var sd=stockData[pi], containers=(sd&&sd.containers)||[];
      var contState=containers.slice(), usedPrior=useRate*ld.haPerLoad*p.load;
      for(var ci=0;ci<contState.length&&usedPrior>0.001;ci++){
        var take=Math.min(contState[ci],usedPrior); contState[ci]-=take; usedPrior-=take;
      }
      var usage=calcContainerUsage(contState,amt);
      var totalStock=containers.reduce(function(s,c){return s+c;},0);
      var totalUsed=useRate*ld.haPerLoad*(p.load+1);
      var rem=totalStock-totalUsed;
      var remCls=rem>amt*1.5?'mx-rem-ok':(rem>0?'mx-rem-warn':'mx-rem-low');
      remHtml+='<div class="mx-rem-row"><span class="mx-rem-name">'+(prod.name||prod.type||'Prod '+(pi+1))+'</span>'+
        '<span class="'+remCls+'">'+Math.max(0,rem).toFixed(1)+' '+ld.unit+' left</span></div>';
    });
    remHtml+='</div>';
    html+=remHtml;
  }
  html+='</div>';
  wrap.innerHTML=html;
  // Start/update SAR timer
  startMixTimer();
}

var _timerInterval=null;
function startMixTimer(){
  if(_timerInterval) clearInterval(_timerInterval);
  var p=getProg(jobId);
  if(!p.lastLoadTime || p.load===0) {
    var el=document.getElementById('mx-timer');
    if(el) el.style.display='none';
    return;
  }
  var el=document.getElementById('mx-timer');
  if(!el) return;
  el.style.display='block';
  var start=p.lastLoadTime;
  function tick(){
    var now=Date.now();
    var secs=Math.floor((now-start)/1000);
    var mm=String(Math.floor(secs/60)).padStart(2,'0');
    var ss=String(secs%60).padStart(2,'0');
    var el2=document.getElementById('mx-timer');
    if(!el2){clearInterval(_timerInterval);return;}
    var over30=secs>1800;
    el2.textContent='⏱ '+mm+':'+ss;
    el2.style.color=over30?'#f87171':'#4ade80';
    el2.style.background=over30?'rgba(248,113,113,.1)':'transparent';
    el2.style.borderRadius='10px';
    el2.style.padding=over30?'6px 12px':'0';
    if(over30&&!el2.dataset.warned){
      el2.dataset.warned='1';
      el2.textContent='⚠️ '+mm+':'+ss+' — 30 min exceeded!';
    }
  }
  tick();
  _timerInterval=setInterval(tick,1000);
}

window.goBackToJobs=function(){show('s-jobs');renderJobs();};
window.toggleCheck=function(pi){
  var p=getProg(jobId); p.checks=p.checks||{}; p.checks[pi]=!p.checks[pi]; saveProg(jobId,p); renderMixing();
};

window.loadPlane=function(){
  var p=getProg(jobId), j=jobs.find(function(x){return x.id===jobId;});
  if(!j) return;
  var ld=calcLoads(j);
  p.load=(p.load||0)+1;
  p.checks={};
  p.lastLoadTime=Date.now();
  if(!p.loadTimes) p.loadTimes=[];
  var _now=new Date(); p.loadTimes.push(_now.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit',hour12:true}));
  saveProg(jobId,p);
  // Push live progress to Firestore so AeroOps dashboard can track it
  var _progUpdate={
    mixProgress:{
      loadsComplete:p.load,
      loadsTotal:ld.loads,
      mixer:mixerName,
      lastLoadTime:new Date().toISOString(),
      loadTimes:p.loadTimes
    },
    status:'in_progress'
  };
  if(p.load>=ld.loads) _progUpdate.status='pilot_complete';
  fsUpdate(jobId,_progUpdate).catch(function(){});
  if(p.load>=ld.loads){
    fsUpdate(jobId,{mixerNotes:{mixer:mixerName,loadTimes:p.loadTimes,completedAt:new Date().toISOString()}}).catch(function(){});
    activeJobIds=activeJobIds.filter(function(id){return id!==jobId;});
  }
  renderMixing();
};

// ─── Use All Stock ────────────────────────────────────────────
window.useAllStock=function(pi,totalNeeded,unit,totalHa,origRate){
  var cb=document.getElementById('useall-'+pi); if(!cb) return;
  var entries=[], i=0;
  while(document.getElementById('csize-'+pi+'-'+i)){
    entries.push({size:document.getElementById('csize-'+pi+'-'+i).value,
                  count:document.getElementById('ccount-'+pi+'-'+i).value});
    i++;
  }
  var total=buildContainers(entries).reduce(function(s,c){return s+c;},0);
  var el=document.getElementById('stock-preview-'+pi); if(!el) return;
  if(cb.checked && total>0 && totalHa>0){
    var newRate=total/totalHa;
    cb.dataset.newRate=newRate.toFixed(4);
    el.innerHTML='<span style="background:#dcfce7;color:#166534;padding:6px 10px;border-radius:8px;display:block;font-weight:700">'+
      '✅ Using all '+total.toFixed(0)+' '+unit+' — rate adjusted to '+newRate.toFixed(3)+' '+unit+'/ha</span>';
  } else {
    cb.dataset.newRate='';
    window.updateStockPreview(pi,totalNeeded,unit);
  }
};
// Clear pilot hold — mixer override with confirmation
window.clearPilotHold=function(){
  var j=jobs.find(function(x){return x.id===jobId;});
  if(!j) return;
  fetch(FS_BASE+'/jobs/'+jobId+'?updateMask.fieldPaths=pilotHold&key='+FS_KEY,{
    signal:AbortSignal.timeout(20000),
    method:'PATCH',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:{pilotHold:{booleanValue:false}}})
  }).then(function(r){return r.json();}).then(function(d){
    j.pilotHold=false;
    renderMixing();
  }).catch(function(e){alert('Failed to clear hold: '+e);});
};

// Updated: mixer login fix deployed via workflow dispatch
