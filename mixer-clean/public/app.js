
(function(){
'use strict';

var MIXER_PINS={
  'Ben Simcock':'1111','Robert Proud':'2222','Amber Meyers':'3333',
  'Shaun Dempsey':'4444','Adam Sullivan':'5555','Will Piip':'6666','Craig Dawson':'7777'
};
var FS_KEY='AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI';
var FS_BASE='https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';

var _mixer='', jobs=[], curJob={};

function $(id){return document.getElementById(id);}
function showScr(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});$(id).classList.add('active');}
function setBadge(t){var b=$('sync-badge');if(b)b.textContent=t;}
function badgeLive(){setBadge('✓');}
function badgeErr(){setBadge('✕');}

function gv(v){return v?(v.stringValue||String(v.doubleValue||v.integerValue||0)):'';}
function gvn(v){return v?Number(v.doubleValue||v.integerValue||0):0;}

function fsDoc(doc){
  if(!doc||!doc.fields)return{};
  var f=doc.fields;
  var sched=(f.schedule&&f.schedule.mapValue)?f.schedule.mapValue.fields:{};
  var mp=(f.mixProgress&&f.mixProgress.mapValue)?f.mixProgress.mapValue.fields:null;
  var prods=(f.products&&f.products.arrayValue)?f.products.arrayValue.values:[];
  var pads=(f.paddocks&&f.paddocks.arrayValue)?f.paddocks.arrayValue.values:[];
  return{
    id:doc.name.split('/').pop(),
    mixerName:gv(sched.mixer),schedDate:gv(sched.scheduledDate),
    pilot:gv(sched.pilot),aircraft:gv(sched.aircraft),estStart:gv(sched.estStart),
    status:gv(f.status)||'new',clientName:gv(f.clientName),waterRate:gvn(f.waterRate),
    loadsTotal:mp?gvn(mp.loadsTotal):0,loadsDone:mp?gvn(mp.loadsComplete):0,
    jobNotes:gv(f.jobNotes),
    products:prods.map(function(p){var pf=(p.mapValue&&p.mapValue.fields)?p.mapValue.fields:{};return{name:gv(pf.name),type:gv(pf.type),rate:gvn(pf.rate),unit:gv(pf.unit),total:gvn(pf.totalRequired)};}),
    paddocks:pads.map(function(p){var pf=(p.mapValue&&p.mapValue.fields)?p.mapValue.fields:{};return{name:gv(pf.name),crop:gv(pf.cropType),ha:gvn(pf.ha)};})
  };
}

// Using XMLHttpRequest instead of fetch — more compatible with iPad Safari
function fetchJobs(){
  setBadge('⋯');
  var xhr=new XMLHttpRequest();
  xhr.open('GET',FS_BASE+'/jobs?pageSize=200&key='+FS_KEY,true);
  xhr.setRequestHeader('Accept','application/json');
  xhr.timeout=20000;
  xhr.ontimeout=function(){console.warn('[FJ] timeout');badgeErr();};
  xhr.onload=function(){
    if(xhr.status!==200){console.warn('[FJ] HTTP '+xhr.status);badgeErr();return;}
    try{
      var d=JSON.parse(xhr.responseText);
      if(d.error){console.warn('[FJ] Firestore err:',d.error);badgeErr();return;}
      jobs=(d.documents||[]).map(fsDoc);
      badgeLive();
      console.log('[FJ] ok, '+jobs.length+' jobs');
      if($('s-jobs').classList.contains('active'))renderJobs();
    }catch(e){console.warn('[FJ] parse err:',e.message);badgeErr();}
  };
  xhr.onerror=function(){console.warn('[FJ] network error');badgeErr();};
  xhr.send();
}

function today(){var d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}

function renderJobs(){
  var td=today(),mixer=window._curMixer||'';
  var list=jobs.filter(function(j){
    if(j.schedDate&&j.schedDate!==td)return false;
    if(j.status==='invoiced')return false;
    if(mixer&&mixer!=='ALL'&&j.mixerName!==mixer)return false;
    return true;
  });
  list.sort(function(a,b){if(a.status!==b.status)return a.status==='completed'?1:-1;return(a.estStart||'').localeCompare(b.estStart||'');});
  var dj=$('jobs-date'),ul=$('jobs-list');
  if(dj){var d=new Date(td+'T00:00:00');dj.textContent=d.toLocaleDateString('en-AU',{weekday:'long',day:'numeric',month:'long'});}
  if(!ul)return;
  if(!list.length){ul.innerHTML='<div style="text-align:center;padding:60px 20px;color:#94a3b8;font-size:15px">No jobs for today</div>';return;}
  ul.innerHTML=list.map(function(j){
    var pct=Math.round(100*(j.loadsTotal>0?j.loadsDone/j.loadsTotal:0));
    var bc={in_progress:'#3b82f6',completed:'#22c55e',new:'#64748b',cancelled:'#94a3b8',pilot_complete:'#f59e0b'}[j.status]||'#3b82f6';
    return'<div class="job-btn'+(j.status==='completed'?' done':'')+'" style="border-left-color:'+bc+'" data-jid="'+j.id+'">'+
      '<div class="jb-top"><span class="jb-client">'+(j.clientName||'Unknown')+'</span><span class="jb-status" style="color:'+bc+'">'+(j.status||'new')+'</span></div>'+
      '<div class="jb-meta">'+(j.pilot?'✈️ '+j.pilot+' · ':'')+(j.estStart?'🕐 '+j.estStart:'')+' &nbsp; '+j.loadsDone+'/'+j.loadsTotal+' loads</div>'+
      (pct>0?'<div class="prog-bar"><div class="prog-fill'+(j.status==='completed'?' done':'')+'" style="width:'+pct+'%;background:'+bc+'"></div></div>':'')+
    '</div>';
  }).join('');
  ul.querySelectorAll('[data-jid]').forEach(function(el){el.addEventListener('click',function(){showJob(el.getAttribute('data-jid'));},true);});
}

function showJob(id){
  var j=jobs.filter(function(x){return x.id===id;})[0];
  if(!j)return;
  curJob=j;
  showScr('s-detail');
  var w=$('detail-wrap');
  if(!w)return;
  var pct=Math.round(100*(j.loadsTotal>0?j.loadsDone/j.loadsTotal:0));
  var done=j.status==='completed';
  var hc=function(t){if(!t)return'#3b82f6';t=t.toLowerCase();if(t.indexOf('herbicide')>-1||t.indexOf('rup')>-1)return'#dc2626';if(t.indexOf('adjuvant')>-1||t.indexOf('wetter')>-1||t.indexOf('surfactant')>-1)return'#f59e0b';return'#3b82f6';};
  w.innerHTML=
    '<button class="back-btn" id="btn-jobs">← Back to Jobs</button>'+
    '<button class="back-btn" id="btn-menu" style="margin-left:8px;background:#f1f5f9">Menu</button>'+
    '<div class="detail-card" style="margin-top:12px">'+
      '<div class="detail-title">'+(j.clientName||'Unknown')+'</div>'+
      '<div class="detail-meta">📅 '+(j.schedDate||'—')+' &nbsp; 🕐 '+(j.estStart||'—')+' &nbsp; <strong>'+(j.status||'new')+'</strong></div>'+
      '<div class="detail-meta">✈️ '+(j.aircraft||'—')+' &nbsp; 👤 '+(j.pilot||'—')+' &nbsp; 💧 '+j.waterRate+' L/ha</div>'+
      '<div class="detail-meta">🧪 '+j.mixerName+' &nbsp; Loads: '+j.loadsDone+'/'+j.loadsTotal+'</div>'+
      (pct>0?'<div class="prog-bar" style="margin-top:10px"><div class="prog-fill'+(done?' done':'')+'" style="width:'+pct+'%;background:'+(done?'#22c55e':'#3b82f6')+'"></div></div><div class="detail-meta" style="margin-top:4px">'+pct+'% complete</div>':'')+
      (j.jobNotes?'<div style="margin-top:8px;font-size:13px;color:#b45309">📝 '+j.jobNotes+'</div>':'')+
    '</div>'+
    (j.paddocks&&j.paddocks.length?'<div class="detail-section">Paddocks</div><div>'+j.paddocks.map(function(p){return'<span class="pad-chip">'+p.name+' '+p.ha+'ha '+p.crop+'</span>';}).join('')+'</div>':'')+
    '<div class="detail-section">Products ('+j.products.length+')</div>'+
    (j.products.length?j.products.map(function(p){return'<div class="detail-card" style="border-left:4px solid '+hc(p.type)+'"><div style="font-weight:600">'+p.name+' <span style="font-size:12px;color:#64748b">('+p.type+')</span></div><div class="detail-meta" style="margin-top:4px">Rate: '+p.rate+' '+(p.unit||'L/ha')+' &nbsp; Total: '+p.total+'L</div></div>';}).join(''):'<div class="detail-card" style="color:#94a3b8">No products</div>');
  $('btn-jobs').addEventListener('click',function(){showScr('s-jobs');});
  $('btn-menu').addEventListener('click',function(){showScr('s-login');});
}

function buildGrid(){
  var g=$('mixer-grid');
  if(!g)return;
  g.innerHTML='';
  Object.keys(MIXER_PINS).forEach(function(n){
    var parts=n.split(' '),first=parts[0]||'',rest=parts.length>1?' '+parts.slice(1).join(''):'';
    var btn=document.createElement('div');
    btn.className='mixer-btn';
    btn.setAttribute('data-name',n);
    btn.innerHTML='<span style="font-size:17px">'+first+'</span>'+rest;
    btn.addEventListener('click',function(){
      document.querySelectorAll('.mixer-btn').forEach(function(b){b.classList.remove('sel');});
      btn.classList.add('sel');
      _mixer=n;
      $('pin-section').style.display='block';
      $('all-jobs-btn').style.display='none';
      $('pin-err').textContent='';
      $('pin-msg').textContent=first+', enter PIN';
      var dd=$('pin-display');
      if(dd){dd.innerHTML='';for(var i=0;i<4;i++){var d=document.createElement('span');d.className='pin-dot';dd.appendChild(d);}}
    });
    g.appendChild(btn);
  });
}

function initPinPad(){
  document.querySelectorAll('.pk').forEach(function(btn){
    btn.addEventListener('click',function(){
      var k=btn.getAttribute('data-key');
      if(!_mixer)return;
      var dd=$('pin-display');
      if(k==='X'){_mixer='';if(dd){dd.innerHTML='';for(var i=0;i<4;i++){var d=document.createElement('span');d.className='pin-dot';dd.appendChild(d);}}$('pin-err').textContent='';$('pin-section').style.display='none';return;}
      if(k==='OK'){
        var entered='';
        if(dd)dd.querySelectorAll('.pin-dot.filled').forEach(function(dot){entered+=dot.textContent;});
        if(entered===MIXER_PINS[_mixer]){
          try{localStorage.setItem('at_mixer',_mixer);}catch(e){}
          doLogin(_mixer);
        }else{$('pin-err').textContent='Incorrect PIN';if(dd){dd.innerHTML='';for(var i=0;i<4;i++){var d=document.createElement('span');d.className='pin-dot';dd.appendChild(d);}}}
        return;
      }
      if(!dd)return;
      var dots=dd.querySelectorAll('.pin-dot:not(.filled)');
      if(dots.length>0){dots[0].textContent='●';dots[0].className='pin-dot filled';}
    });
  });
}

function doLogin(name){
  window._curMixer=name;
  $('s-login').classList.remove('active');
  $('hdr-title').textContent='🧪 AeroTech Mixer';
  $('hdr-sub').textContent=name==='ALL'?'All Jobs — Supervisor':'Signed in';
  showScr('s-jobs');
  fetchJobs();
}

$('all-jobs-btn').addEventListener('click',function(){
  _mixer='ALL';
  try{localStorage.setItem('at_mixer','ALL');}catch(e){}
  doLogin('ALL');
});

document.addEventListener('DOMContentLoaded',function(){
  var dd=$('pin-display');
  if(dd){dd.innerHTML='';for(var i=0;i<4;i++){var d=document.createElement('span');d.className='pin-dot';dd.appendChild(d);}}
  buildGrid();
  initPinPad();
  setBadge('⋯');
  setTimeout(fetchJobs,500);
  var saved=null;
  try{saved=localStorage.getItem('at_mixer');}catch(e){}
  if(saved&&MIXER_PINS[saved]){
    _mixer=saved;
    $('pin-section').style.display='block';
    buildGrid();
    document.querySelectorAll('.mixer-btn').forEach(function(b){if(b.getAttribute('data-name')===saved)b.classList.add('sel');});
    var first=saved.split(' ')[0];
    $('pin-msg').textContent=first+', enter PIN';
    setTimeout(function(){doLogin(saved);},300);
  }
});

})();
