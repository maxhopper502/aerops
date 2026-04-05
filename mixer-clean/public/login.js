// login.js - fetch() instead of XMLHttpRequest
var MIXER_PINS={'Ben Simcock':'1111','Robert Proud':'2222','Amber Meyers':'3333','Shaun Dempsey':'4444','Adam Sullivan':'5555','Will Piip':'6666','Craig Dawson':'7777'};
var _loginMixer='', _loginPin='';
var FS_KEY='AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI';
var FS_BASE='https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';

function showScr(id){document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.getElementById(id).classList.add('active');}

function fetchJobs(){
  var b=document.getElementById('sync-badge');
  if(b){b.textContent='Syncing...';}
  fetch(FS_BASE+'/jobs?pageSize=200&key='+FS_KEY,{headers:{'Accept':'application/json'}})
  .then(function(r){if(!r.ok)throw new Error('HTTP '+r.status);return r.json();})
  .then(function(d){
    if(d.error)throw new Error(d.error.message||'err');
    window.jobs=(d.documents||[]).map(fsDoc);
    var b=document.getElementById('sync-badge');
    if(b){b.textContent='Live';b.className='sync-badge';}
    if(document.getElementById('s-jobs').classList.contains('active'))renderJobs();
  })
  .catch(function(e){
    console.warn('[FJ]',e.message);
    var b=document.getElementById('sync-badge');
    if(b){b.textContent='Err';}
  });
}

function fsDoc(doc){
  if(!doc||!doc.fields)return{};
  var f=doc.fields;
  var sched=(f.schedule&&f.schedule.mapValue)?f.schedule.mapValue.fields:{};
  return{
    id:doc.name.split('/').pop(),
    mixerName:(sched.mixer?(sched.mixer.stringValue||''):''),
    schedDate:(sched.scheduledDate?(sched.scheduledDate.stringValue||''):''),
    pilot:(sched.pilot?(sched.pilot.stringValue||''):''),
    aircraft:(sched.aircraft?(sched.aircraft.stringValue||''):''),
    estStart:(sched.estStart?(sched.estStart.stringValue||''):''),
    status:(f.status?(f.status.stringValue||'active'):'active'),
    clientName:(f.clientName?(f.clientName.stringValue||''):''),
    loadsArr:(f.loads&&f.loads.arrayValue&&f.loads.arrayValue.values)?f.loads.arrayValue.values.map(function(l){
      var ff=(l.mapValue&&l.mapValue.fields)||{};
      return{loadId:(ff.loadId?(ff.loadId.stringValue||''):''),containerId:(ff.containerId?(ff.containerId.stringValue||''):''),chemName:(ff.chemName?(ff.chemName.stringValue||''):''),volL:(ff.volL?(ff.volL.doubleValue||ff.volL.integerValue||0):0),rate:(ff.rate?(ff.rate.doubleValue||ff.rate.integerValue||0):0),complete:!!(ff.complete&&ff.complete.booleanValue)};
    }):[],
    pilotHold:!!(f.pilotHold&&f.pilotHold.booleanValue),
    loadsDone:(f.loadsComplete?(f.loadsComplete.doubleValue||f.loadsComplete.integerValue||0):0),
    loadsTotal:(f.loadsTotal?(f.loadsTotal.doubleValue||f.loadsTotal.integerValue||0):0)
  };
}

function renderJobs(){
  var name=window.currentMixer||'';
  var today=new Date().toISOString().slice(0,10);
  var list=(window.jobs||[]).filter(function(j){
    if(j.schedDate&&j.schedDate!==today)return false;
    if(j.status==='invoiced')return false;
    if(name&&name!=='ALL'&&j.mixerName!==name)return false;
    return true;
  });
  list.sort(function(a,b){return(b.schedDate||'').localeCompare(a.schedDate||'');});
  var ul=document.getElementById('jobs-list');if(!ul)return;
  if(!list.length){ul.innerHTML='<div style="text-align:center;padding:60px 20px;color:#5a6a7a">No jobs for today</div>';return;}
  ul.innerHTML=list.map(function(j){
    var c={active:'#4a9eff',completed:'#4caf50',cancelled:'#f44336'}[j.status]||'#4a9eff';
    return'<div class="job-btn" style="border-color:'+c+'" onclick="showJob(\''+j.id+'\')">'+
      '<div style="font-weight:600">'+(j.clientName||'Unknown')+'</div>'+
      '<div style="font-size:12px;color:#7a8fa6;margin-top:4px">'+(j.pilot?j.pilot+' · ':'')+(j.estStart?j.estStart:'')+' &nbsp; '+(j.loadsDone||0)+'/'+(j.loadsTotal||0)+' loads</div>'+
      '</div>';
  }).join('');
}

function showJob(id){
  var j=(window.jobs||[]).filter(function(x){return x.id===id;})[0];if(!j)return;
  window.currentJob=j;showScr('s-detail');
  var w=document.getElementById('detail-wrap');if(!w)return;
  var loads=j.loadsArr||[];
  w.innerHTML=
    '<button class="back-btn" onclick="showScr(\'s-jobs\')">&#8592; Back</button>'+
    '<div class="card" style="margin-top:12px"><div style="font-size:20px;font-weight:700;margin-bottom:8px">'+(j.clientName||'Unknown')+'</div>'+
    '<div style="color:#7a8fa6;font-size:13px">&#128197; '+(j.schedDate||'No date')+' &nbsp; Status: <span style="color:#4a9eff">'+(j.status||'active')+'</span></div>'+
    '<div style="margin-top:8px;font-size:14px"><b>Mixer:</b> '+(j.mixerName||'&#8212;')+' &nbsp; <b>Pilot:</b> '+(j.pilot||'&#8212;')+' &nbsp; <b>Aircraft:</b> '+(j.aircraft||'&#8212;')+'</div></div>'+
    '<div style="margin-top:16px"><div class="sec-title">Loads</div>'+
    (loads.length?loads.map(function(l,i){return'<div class="card" style="border-left:4px solid '+(l.complete?'#4caf50':'#ff9800')+'"><div style="font-weight:600">Load '+(i+1)+' &#8212; '+(l.chemName||'Unknown')+'</div><div style="font-size:13px;color:#7a8fa6;margin-top:4px">Container: '+(l.containerId||'?')+' &nbsp; Vol: '+(l.volL||0)+'L &nbsp; Rate: '+(l.rate||0)+'L/min</div><div style="margin-top:8px;font-size:13px">Status: '+(l.complete?'&#9989; Complete':'&#9203; Pending')+'</div></div>';}).join(''):'<div style="color:#5a6a7a;text-align:center;padding:20px">No loads</div>')+
    '</div>';
}

function buildMixerGrid(){var g=document.getElementById('mixer-grid');if(!g)return;g.innerHTML=Object.keys(MIXER_PINS).map(function(n){var p=n.split(' ');return'<div class="mixer-btn" onclick="selMixer(\''+n.replace(/'/g,"\\'")+'\')"><span>'+p[0]+'</span>'+(p.length>1?' '+p.slice(1).join(''):'')+'</div>';}).join('');}
function selMixer(n){_loginMixer=n;_loginPin='';document.querySelectorAll('.mixer-btn').forEach(function(b){b.classList.remove('sel');});try{event.target.closest('.mixer-btn').classList.add('sel');}catch(e){}document.getElementById('pin-section').style.display='block';document.getElementById('all-jobs-btn').style.display='none';drawDots();document.getElementById('pin-err').textContent='';}
function selAllJobs(){_loginMixer='ALL';try{localStorage.setItem('at_mixer','ALL');}catch(e){}document.getElementById('pin-section').style.display='none';doLogin('ALL');}
function numTap(k){if(!_loginMixer)return;if(k==='X'){_loginPin=_loginPin.slice(0,-1);drawDots();return;}if(_loginPin.length>=4)return;_loginPin+=k;drawDots();if(_loginPin.length===4){if(MIXER_PINS[_loginMixer]===_loginPin){try{localStorage.setItem('at_mixer',_loginMixer);}catch(e){}doLogin(_loginMixer);}else{document.getElementById('pin-err').textContent='Wrong PIN';_loginPin='';drawDots();}}}
function drawDots(){for(var i=0;i<4;i++){var d=document.getElementById('pd'+i);if(d){d.textContent=_loginPin[i]?'&#9679;':'';d.className='pin-dot'+(_loginPin[i]?' filled':'');}}}
function doLogin(name){window.currentMixer=name;document.getElementById('login-screen').classList.remove('active');showScr('s-jobs');document.getElementById('hdr-sub').textContent='Signed in'+(name!=='ALL'?' \u2014 '+name:'');fetchJobs();}

document.addEventListener('DOMContentLoaded',function(){
  var dd=document.getElementById('pin-display');if(dd){dd.innerHTML='';for(var i=0;i<4;i++){var d=document.createElement('div');d.id='pd'+i;d.className='pin-dot';dd.appendChild(d);}}
  buildMixerGrid();
  fetchJobs(); // THE KEY FIX: sync on page load
  var saved=null;try{saved=localStorage.getItem('at_mixer');}catch(e){}
  if(saved==='ALL'){doLogin('ALL');return;}
  if(saved&&MIXER_PINS[saved]){_loginMixer=saved;document.getElementById('pin-section').style.display='block';buildMixerGrid();document.querySelectorAll('.mixer-btn').forEach(function(b){if(b.textContent.trim().startsWith(saved.split(' ')[0]))b.classList.add('sel');});drawDots();doLogin(saved);}
});
