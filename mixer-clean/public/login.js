<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<title>AeroTech Mixer</title>
<style>
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html,body{height:100%;margin:0;overflow:hidden}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8f9fa;color:#1a365d}
button{font-family:inherit}
.hdr{position:fixed;top:0;left:0;right:0;height:56px;background:#1a365d;display:flex;align-items:center;padding:0 20px;gap:10px;z-index:200;box-shadow:0 2px 8px rgba(0,0,0,0.3)}
.hdr h1{font-size:19px;font-weight:700;margin:0;color:#fff}
.hdr span{font-size:13px;color:rgba(255,255,255,0.65)}
.sb{position:fixed;top:14px;right:14px;font-size:11px;padding:5px 11px;border-radius:20px;font-weight:700;z-index:9999;background:rgba(255,255,255,0.15);color:#fff;min-width:54px;text-align:center}
.screen{position:fixed;inset:0;top:56px;overflow-y:auto;background:#f8f9fa;display:none;padding:20px 16px}
.screen.active{display:block}
#s-login{background:#f8f9fa;display:none;flex-direction:column;align-items:center;justify-content:flex-start;padding:32px 20px 20px}
#s-login.active{display:flex}
.login-logo{font-size:52px;margin-bottom:8px}
.login-title{font-size:26px;font-weight:700;color:#1a365d;margin:0 0 4px;text-align:center}
.login-sub{font-size:14px;color:#64748b;margin:0 0 28px;text-align:center}
.mixer-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:100%;max-width:480px;margin:0 0 16px}
.mixer-btn{background:#fff;border:none;border-radius:12px;padding:18px 12px;text-align:center;cursor:pointer;font-size:16px;font-weight:600;color:#1a365d;box-shadow:0 2px 8px rgba(0,0,0,0.1);border:2px solid transparent;-webkit-appearance:none;touch-action:manipulation}
.mixer-btn.sel{border-color:#1a365d}
.alljobs-btn{background:#f0fdf4;border:2px solid #22c55e;border-radius:12px;padding:16px;text-align:center;cursor:pointer;font-size:15px;font-weight:700;color:#16a34a;width:100%;max-width:480px;margin-bottom:24px;-webkit-appearance:none;touch-action:manipulation}
#pin-section{display:none;width:100%;max-width:400px;text-align:center}
.pin-msg{font-size:14px;color:#64748b;margin-bottom:16px}
.pin-display{margin-bottom:20px}
.pin-dot{width:18px;height:18px;border-radius:5px;border:2px solid #cbd5e1;display:inline-block;margin:0 7px;background:#fff}
.pin-dot.filled{border-color:#1a365d;background:#1a365d}
#pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;max-width:280px;margin:0 auto}
.pk{background:#fff;border:2px solid #e2e8f0;border-radius:12px;padding:18px;font-size:22px;font-weight:700;color:#1a365d;cursor:pointer;-webkit-appearance:none;touch-action:manipulation;box-shadow:0 2px 4px rgba(0,0,0,0.06)}
.pk.ok{background:#f0fdf4;border-color:#22c55e;color:#16a34a}
.pk.cl{background:#fef2f2;border-color:#f87171;color:#dc2626}
#pin-err{color:#dc2626;text-align:center;margin-top:14px;font-size:14px;min-height:20px}
.jobs-date{font-size:14px;color:#64748b;font-weight:600;margin-bottom:14px;padding-top:4px}
.job-btn{background:#fff;border-radius:12px;padding:14px 16px;cursor:pointer;border-left:5px solid #3b82f6;margin-bottom:10px;display:block;box-shadow:0 2px 6px rgba(0,0,0,0.07)}
.job-btn.done{border-left-color:#22c55e;opacity:0.85}
.jb-top{display:flex;justify-content:space-between;align-items:center}
.jb-client{font-size:16px;font-weight:600;color:#1a365d}
.jb-status{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:#3b82f6}
.jb-meta{font-size:13px;color:#64748b;margin-top:5px}
.prog-bar{height:5px;border-radius:3px;background:#e2e8f0;margin-top:8px}
.prog-fill{height:100%;border-radius:3px;background:#3b82f6}
.prog-fill.done{background:#22c55e}
.back-btn{background:#fff;border:2px solid #e2e8f0;color:#1a365d;border-radius:10px;padding:10px 16px;cursor:pointer;font-size:14px;font-weight:600;display:inline-block;box-shadow:0 2px 4px rgba(0,0,0,0.06)}
.detail-card{background:#fff;border-radius:12px;padding:16px;margin:12px 0;box-shadow:0 2px 6px rgba(0,0,0,0.07)}
.detail-title{font-size:20px;font-weight:700;color:#1a365d;margin-bottom:8px}
.detail-meta{font-size:13px;color:#64748b;margin-top:4px}
.detail-section{font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin:18px 0 8px}
.pad-chip{background:#f1f5f9;border-radius:8px;padding:5px 10px;font-size:12px;color:#475569;display:inline-block;margin:3px 3px 3px 0}
</style>
</head>
<body>

<header class="hdr">
  <h1 id="hdr-title">🧪 AeroTech Mixer</h1>
  <span id="hdr-sub">Sign in to continue</span>
  <div id="sync-badge" class="sb">⋯</div>
</header>

<div id="s-login" class="screen active">
  <div class="login-logo">🌾</div>
  <div class="login-title">AeroTech Mixer</div>
  <div class="login-sub">Select your name to sign in</div>
  <div id="mixer-grid" class="mixer-grid"></div>
  <button id="all-jobs-btn" class="alljobs-btn">All Jobs — Supervisor</button>
  <div id="pin-section">
    <div class="pin-msg" id="pin-msg">Enter your PIN</div>
    <div class="pin-display" id="pin-display"></div>
    <div id="pin-pad">
      <button class="pk" data-key="1">1</button><button class="pk" data-key="2">2</button><button class="pk" data-key="3">3</button>
      <button class="pk" data-key="4">4</button><button class="pk" data-key="5">5</button><button class="pk" data-key="6">6</button>
      <button class="pk" data-key="7">7</button><button class="pk" data-key="8">8</button><button class="pk" data-key="9">9</button>
      <button class="pk cl" data-key="X">✕</button>
      <button class="pk" data-key="0">0</button>
      <button class="pk ok" data-key="OK">✓</button>
    </div>
    <div id="pin-err"></div>
  </div>
</div>

<div id="s-jobs" class="screen">
  <div id="jobs-date" class="jobs-date"></div>
  <div id="jobs-list"></div>
</div>

<div id="s-detail" class="screen">
  <div id="detail-wrap"></div>
</div>

<script>
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
</script>

<script>
/**
 * Iframe 元素高亮注入脚本
 * 需要在目标网站中引入此脚本来支持跨域 iframe 高亮功能
 *
 * 使用方法：
 * 1. 将此脚本添加到目标网站的 HTML 中
 * 2. 或通过浏览器扩展、用户脚本等方式注入
 */

(function () {
  "use strict";

  // 检查是否在 iframe 中
  if (window.self === window.top) {
    return; // 不在 iframe 中，不执行
  }

  // 检查是否已经初始化过
  if (window.__iframeHighlightInitialized) {
    return;
  }
  window.__iframeHighlightInitialized = true;
  console.log("Iframe 高亮脚本已加载");

  // 创建高亮覆盖层
  var overlay = document.createElement("div");
  overlay.id = "iframe-highlight-overlay";
  overlay.style.cssText = "\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100vw;\n    height: 100vh;\n    pointer-events: none;\n    z-index: 999999;\n    overflow: hidden;\n  ";

  // 创建悬停高亮框（虚线边框）
  var highlightBox = document.createElement("div");
  highlightBox.id = "iframe-highlight-box";
  highlightBox.style.cssText = "\n    position: absolute;\n    border: 2px dashed #007AFF;\n    background: rgba(0, 122, 255, 0.08);\n    pointer-events: none;\n    display: none;\n    transition: all 0.1s ease;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);\n    border-radius: 2px;\n  ";

  // 创建选中节点的常驻高亮框（实线边框）
  var selectedBox = document.createElement("div");
  selectedBox.id = "iframe-selected-box";
  selectedBox.style.cssText = "\n    position: absolute;\n    border: 2px solid #007AFF;\n    pointer-events: none;\n    display: none;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 107, 53, 0.4);\n    border-radius: 2px;\n    z-index: 1000000;\n  ";

  // 创建悬停标签显示
  var tagLabel = document.createElement("div");
  tagLabel.id = "iframe-tag-label";
  tagLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 2px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000001;\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n    font-weight: 500;\n  ";

  // 创建选中节点标签
  var selectedLabel = document.createElement("div");
  selectedLabel.id = "iframe-selected-label";
  selectedLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 3px 8px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 3px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000002;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n    font-weight: 600;\n  ";
  overlay.appendChild(highlightBox);
  overlay.appendChild(selectedBox);
  overlay.appendChild(tagLabel);
  overlay.appendChild(selectedLabel);
  document.body.appendChild(overlay);

  // 存储当前选中的元素
  var selectedElement = null;
  var highlightEnabled = false;

  // 更新选中元素的高亮显示
  function updateSelectedHighlight(element) {
    console.log("updateSelectedHighlight called with:", element);
    if (!element) {
      selectedBox.style.display = "none";
      selectedLabel.style.display = "none";
      selectedElement = null;
      console.log("Cleared selected highlight");
      return;
    }
    selectedElement = element;
    var rect = element.getBoundingClientRect();
    console.log("Selected element rect:", rect);

    // 更新选中高亮框位置
    selectedBox.style.display = "block";
    selectedBox.style.left = "".concat(rect.left - 2, "px");
    selectedBox.style.top = "".concat(rect.top - 2, "px");
    selectedBox.style.width = "".concat(rect.width + 4, "px");
    selectedBox.style.height = "".concat(rect.height + 4, "px");

    // 更新选中标签位置和内容
    selectedLabel.style.display = "block";
    selectedLabel.textContent = "\u2713 <".concat(element.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 28;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 5) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    var labelWidth = selectedLabel.offsetWidth || 100; // 预估宽度
    if (labelLeft + labelWidth > window.innerWidth - 10) {
      labelLeft = window.innerWidth - labelWidth - 10;
    }
    selectedLabel.style.left = "".concat(Math.max(5, labelLeft), "px");
    selectedLabel.style.top = "".concat(labelTop, "px");
    console.log("Selected highlight positioned at:", {
      left: selectedBox.style.left,
      top: selectedBox.style.top,
      width: selectedBox.style.width,
      height: selectedBox.style.height
    });
  }
  function getElementSelector(element) {
    if (!(element instanceof Element)) throw new Error('Argument must be a DOM element');
    var segments = [];
    var current = element;
    while (current !== document.documentElement) {
      var selector = '';
      // 优先检查唯一ID
      if (current.id && document.querySelectorAll("#".concat(current.id)).length === 1) {
        segments.unshift("#".concat(current.id));
        break; // ID唯一，无需继续向上
      }

      // 生成类名选择器（取第一个有效类名）
      var classes = Array.from(current.classList).filter(function (c) {
        return !c.startsWith('js-');
      });
      var className = classes.length > 0 ? ".".concat(classes[0]) : '';

      // 生成位置索引（nth-child）
      var tag = current.tagName.toLowerCase();
      if (!className) {
        var siblings = Array.from(current.parentNode.children);
        var index = siblings.findIndex(function (el) {
          return el === current;
        }) + 1;
        selector = "".concat(tag, ":nth-child(").concat(index, ")");
      } else {
        selector = className;
      }
      segments.unshift(selector);
      current = current.parentElement;
    }

    // 处理根元素
    if (current === document.documentElement) {
      segments.unshift('html');
    }
    return segments.join(' > ');
  }

  // 获取元素文本内容
  function getElementText(element) {
    var _element$textContent;
    if (element.tagName === "INPUT") {
      return element.value || element.placeholder || "";
    }
    if (element.tagName === "TEXTAREA") {
      return element.value || element.placeholder || "";
    }
    var text = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim()) || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  // 获取元素属性信息
  function getElementAttributes(element) {
    var attrs = {};
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // 鼠标悬停事件处理
  function handleMouseOver(e) {
    if (!highlightEnabled) return;
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免高亮 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 如果是已选中的元素，不显示悬停高亮
    if (target === selectedElement) {
      highlightBox.style.display = "none";
      tagLabel.style.display = "none";
      return;
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);

    // 更新悬停高亮框位置
    highlightBox.style.display = "block";
    highlightBox.style.left = "".concat(rect.left - 2, "px");
    highlightBox.style.top = "".concat(rect.top - 2, "px");
    highlightBox.style.width = "".concat(rect.width + 4, "px");
    highlightBox.style.height = "".concat(rect.height + 4, "px");

    // 更新标签位置和内容
    tagLabel.style.display = "block";
    tagLabel.textContent = "<".concat(target.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 22;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 0) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    if (labelLeft + tagLabel.offsetWidth > window.innerWidth) {
      labelLeft = window.innerWidth - tagLabel.offsetWidth - 5;
    }
    tagLabel.style.left = "".concat(Math.max(0, labelLeft), "px");
    tagLabel.style.top = "".concat(labelTop, "px");

    // 发送消息到父窗口
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 鼠标离开事件处理
  function handleMouseOut(e) {
    if (!highlightEnabled) return;
    var relatedTarget = e.relatedTarget;

    // 如果鼠标移动到高亮相关元素上，不隐藏高亮
    if (relatedTarget && (relatedTarget === highlightBox || relatedTarget === tagLabel || relatedTarget === overlay || relatedTarget === selectedBox || relatedTarget === selectedLabel)) {
      return;
    }
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: null,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 点击事件处理
  function handleClick(e) {
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免处理 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 检查是否是交互元素，这些元素需要保留默认行为
    var isInteractiveElement = ['input', 'textarea', 'select', 'button', 'a'].includes(target.tagName.toLowerCase());

    // 如果高亮功能启用，对于非交互元素阻止默认行为和事件传播
    if (highlightEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);
    console.log("Element clicked:", {
      tagName: target.tagName,
      selector: selector,
      rect: rect
    });

    // 立即更新选中高亮
    updateSelectedHighlight(target);

    // 隐藏悬停高亮，因为现在是选中状态
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-click",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 监听来自父窗口的消息
  function handleParentMessage(event) {
    console.log("Received message from parent:", event.data);
    if (event.data.type === "iframe-highlight-toggle") {
      var enabled = event.data.enabled;
      console.log("Highlight toggle:", enabled);
      if (enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "enable-iframe-highlight") {
      console.log("Enable iframe highlight");
      enableHighlight();
    } else if (event.data.type === "disable-iframe-highlight") {
      console.log("Disable iframe highlight");
      disableHighlight();
    } else if (event.data.type === "toggle-iframe-highlight") {
      var _enabled = event.data.enabled !== undefined ? event.data.enabled : !highlightEnabled;
      console.log("Toggle iframe highlight to:", _enabled);
      if (_enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "update-selected-element") {
      var selector = event.data.selector;
      console.log("Update selected element with selector:", selector);
      if (selector) {
        try {
          var element = document.querySelector(selector);
          console.log("Found element by selector:", element);
          updateSelectedHighlight(element);
        } catch (error) {
          console.warn("Failed to select element:", error);
          updateSelectedHighlight(null);
        }
      } else {
        updateSelectedHighlight(null);
      }
    } else if (event.data.type === "clear-selected-element") {
      console.log("Clear selected element");
      updateSelectedHighlight(null);
    }
  }

  // 启用高亮功能
  function enableHighlight() {
    console.log("Enabling highlight");
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    highlightEnabled = true;
    overlay.style.display = "block";
  }

  // 禁用高亮功能
  function disableHighlight() {
    console.log("Disabling highlight");
    highlightEnabled = false;
    // 保持事件监听器，但通过 highlightEnabled 变量控制行为
    // 这样可以保留选中状态的显示
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    // 不隐藏 selectedBox 和 selectedLabel，保留选中状态
  }

  // 完全禁用高亮功能（移除所有监听器）
  function fullyDisableHighlight() {
    console.log("Fully disabling highlight");
    highlightEnabled = false;
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    overlay.style.display = "none";
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    selectedBox.style.display = "none";
    selectedLabel.style.display = "none";
  }

  // 添加事件监听
  enableHighlight();
  window.addEventListener("message", handleParentMessage);

  // 暴露全局函数供外部调用
  window.__iframeHighlightControl = {
    enable: enableHighlight,
    disable: disableHighlight,
    fullyDisable: fullyDisableHighlight,
    isEnabled: function isEnabled() {
      return highlightEnabled;
    },
    getSelectedElement: function getSelectedElement() {
      return selectedElement;
    },
    updateSelected: updateSelectedHighlight,
    // 通过消息发送开关控制
    sendToggleMessage: function sendToggleMessage(enabled) {
      window.parent.postMessage({
        type: 'iframe-highlight-status',
        enabled: enabled || highlightEnabled,
        source: 'iframe-highlight-injector'
      }, '*');
    }
  };

  // 通知父窗口脚本已加载
  try {
    window.parent.postMessage({
      type: "iframe-highlight-ready",
      data: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      source: "iframe-highlight-injector"
    }, "*");
  } catch (error) {
    console.warn("无法发送就绪消息到父窗口:", error);
  }

  // 清理函数
  window.__iframeHighlightCleanup = function () {
    fullyDisableHighlight();
    window.removeEventListener("message", handleParentMessage);
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    delete window.__iframeHighlightInitialized;
    delete window.__iframeHighlightCleanup;
  };
})();

</script>

<script>
/**
 * Iframe 元素高亮注入脚本
 * 需要在目标网站中引入此脚本来支持跨域 iframe 高亮功能
 *
 * 使用方法：
 * 1. 将此脚本添加到目标网站的 HTML 中
 * 2. 或通过浏览器扩展、用户脚本等方式注入
 */

(function () {
  "use strict";

  // 检查是否在 iframe 中
  if (window.self === window.top) {
    return; // 不在 iframe 中，不执行
  }

  // 检查是否已经初始化过
  if (window.__iframeHighlightInitialized) {
    return;
  }
  window.__iframeHighlightInitialized = true;
  console.log("Iframe 高亮脚本已加载");

  // 创建高亮覆盖层
  var overlay = document.createElement("div");
  overlay.id = "iframe-highlight-overlay";
  overlay.style.cssText = "\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100vw;\n    height: 100vh;\n    pointer-events: none;\n    z-index: 999999;\n    overflow: hidden;\n  ";

  // 创建悬停高亮框（虚线边框）
  var highlightBox = document.createElement("div");
  highlightBox.id = "iframe-highlight-box";
  highlightBox.style.cssText = "\n    position: absolute;\n    border: 2px dashed #007AFF;\n    background: rgba(0, 122, 255, 0.08);\n    pointer-events: none;\n    display: none;\n    transition: all 0.1s ease;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);\n    border-radius: 2px;\n  ";

  // 创建选中节点的常驻高亮框（实线边框）
  var selectedBox = document.createElement("div");
  selectedBox.id = "iframe-selected-box";
  selectedBox.style.cssText = "\n    position: absolute;\n    border: 2px solid #007AFF;\n    pointer-events: none;\n    display: none;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 107, 53, 0.4);\n    border-radius: 2px;\n    z-index: 1000000;\n  ";

  // 创建悬停标签显示
  var tagLabel = document.createElement("div");
  tagLabel.id = "iframe-tag-label";
  tagLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 2px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000001;\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n    font-weight: 500;\n  ";

  // 创建选中节点标签
  var selectedLabel = document.createElement("div");
  selectedLabel.id = "iframe-selected-label";
  selectedLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 3px 8px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 3px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000002;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n    font-weight: 600;\n  ";
  overlay.appendChild(highlightBox);
  overlay.appendChild(selectedBox);
  overlay.appendChild(tagLabel);
  overlay.appendChild(selectedLabel);
  document.body.appendChild(overlay);

  // 存储当前选中的元素
  var selectedElement = null;
  var highlightEnabled = false;

  // 更新选中元素的高亮显示
  function updateSelectedHighlight(element) {
    console.log("updateSelectedHighlight called with:", element);
    if (!element) {
      selectedBox.style.display = "none";
      selectedLabel.style.display = "none";
      selectedElement = null;
      console.log("Cleared selected highlight");
      return;
    }
    selectedElement = element;
    var rect = element.getBoundingClientRect();
    console.log("Selected element rect:", rect);

    // 更新选中高亮框位置
    selectedBox.style.display = "block";
    selectedBox.style.left = "".concat(rect.left - 2, "px");
    selectedBox.style.top = "".concat(rect.top - 2, "px");
    selectedBox.style.width = "".concat(rect.width + 4, "px");
    selectedBox.style.height = "".concat(rect.height + 4, "px");

    // 更新选中标签位置和内容
    selectedLabel.style.display = "block";
    selectedLabel.textContent = "\u2713 <".concat(element.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 28;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 5) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    var labelWidth = selectedLabel.offsetWidth || 100; // 预估宽度
    if (labelLeft + labelWidth > window.innerWidth - 10) {
      labelLeft = window.innerWidth - labelWidth - 10;
    }
    selectedLabel.style.left = "".concat(Math.max(5, labelLeft), "px");
    selectedLabel.style.top = "".concat(labelTop, "px");
    console.log("Selected highlight positioned at:", {
      left: selectedBox.style.left,
      top: selectedBox.style.top,
      width: selectedBox.style.width,
      height: selectedBox.style.height
    });
  }
  function getElementSelector(element) {
    if (!(element instanceof Element)) throw new Error('Argument must be a DOM element');
    var segments = [];
    var current = element;
    while (current !== document.documentElement) {
      var selector = '';
      // 优先检查唯一ID
      if (current.id && document.querySelectorAll("#".concat(current.id)).length === 1) {
        segments.unshift("#".concat(current.id));
        break; // ID唯一，无需继续向上
      }

      // 生成类名选择器（取第一个有效类名）
      var classes = Array.from(current.classList).filter(function (c) {
        return !c.startsWith('js-');
      });
      var className = classes.length > 0 ? ".".concat(classes[0]) : '';

      // 生成位置索引（nth-child）
      var tag = current.tagName.toLowerCase();
      if (!className) {
        var siblings = Array.from(current.parentNode.children);
        var index = siblings.findIndex(function (el) {
          return el === current;
        }) + 1;
        selector = "".concat(tag, ":nth-child(").concat(index, ")");
      } else {
        selector = className;
      }
      segments.unshift(selector);
      current = current.parentElement;
    }

    // 处理根元素
    if (current === document.documentElement) {
      segments.unshift('html');
    }
    return segments.join(' > ');
  }

  // 获取元素文本内容
  function getElementText(element) {
    var _element$textContent;
    if (element.tagName === "INPUT") {
      return element.value || element.placeholder || "";
    }
    if (element.tagName === "TEXTAREA") {
      return element.value || element.placeholder || "";
    }
    var text = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim()) || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  // 获取元素属性信息
  function getElementAttributes(element) {
    var attrs = {};
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // 鼠标悬停事件处理
  function handleMouseOver(e) {
    if (!highlightEnabled) return;
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免高亮 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 如果是已选中的元素，不显示悬停高亮
    if (target === selectedElement) {
      highlightBox.style.display = "none";
      tagLabel.style.display = "none";
      return;
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);

    // 更新悬停高亮框位置
    highlightBox.style.display = "block";
    highlightBox.style.left = "".concat(rect.left - 2, "px");
    highlightBox.style.top = "".concat(rect.top - 2, "px");
    highlightBox.style.width = "".concat(rect.width + 4, "px");
    highlightBox.style.height = "".concat(rect.height + 4, "px");

    // 更新标签位置和内容
    tagLabel.style.display = "block";
    tagLabel.textContent = "<".concat(target.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 22;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 0) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    if (labelLeft + tagLabel.offsetWidth > window.innerWidth) {
      labelLeft = window.innerWidth - tagLabel.offsetWidth - 5;
    }
    tagLabel.style.left = "".concat(Math.max(0, labelLeft), "px");
    tagLabel.style.top = "".concat(labelTop, "px");

    // 发送消息到父窗口
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 鼠标离开事件处理
  function handleMouseOut(e) {
    if (!highlightEnabled) return;
    var relatedTarget = e.relatedTarget;

    // 如果鼠标移动到高亮相关元素上，不隐藏高亮
    if (relatedTarget && (relatedTarget === highlightBox || relatedTarget === tagLabel || relatedTarget === overlay || relatedTarget === selectedBox || relatedTarget === selectedLabel)) {
      return;
    }
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: null,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 点击事件处理
  function handleClick(e) {
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免处理 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 检查是否是交互元素，这些元素需要保留默认行为
    var isInteractiveElement = ['input', 'textarea', 'select', 'button', 'a'].includes(target.tagName.toLowerCase());

    // 如果高亮功能启用，对于非交互元素阻止默认行为和事件传播
    if (highlightEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);
    console.log("Element clicked:", {
      tagName: target.tagName,
      selector: selector,
      rect: rect
    });

    // 立即更新选中高亮
    updateSelectedHighlight(target);

    // 隐藏悬停高亮，因为现在是选中状态
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-click",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 监听来自父窗口的消息
  function handleParentMessage(event) {
    console.log("Received message from parent:", event.data);
    if (event.data.type === "iframe-highlight-toggle") {
      var enabled = event.data.enabled;
      console.log("Highlight toggle:", enabled);
      if (enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "enable-iframe-highlight") {
      console.log("Enable iframe highlight");
      enableHighlight();
    } else if (event.data.type === "disable-iframe-highlight") {
      console.log("Disable iframe highlight");
      disableHighlight();
    } else if (event.data.type === "toggle-iframe-highlight") {
      var _enabled = event.data.enabled !== undefined ? event.data.enabled : !highlightEnabled;
      console.log("Toggle iframe highlight to:", _enabled);
      if (_enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "update-selected-element") {
      var selector = event.data.selector;
      console.log("Update selected element with selector:", selector);
      if (selector) {
        try {
          var element = document.querySelector(selector);
          console.log("Found element by selector:", element);
          updateSelectedHighlight(element);
        } catch (error) {
          console.warn("Failed to select element:", error);
          updateSelectedHighlight(null);
        }
      } else {
        updateSelectedHighlight(null);
      }
    } else if (event.data.type === "clear-selected-element") {
      console.log("Clear selected element");
      updateSelectedHighlight(null);
    }
  }

  // 启用高亮功能
  function enableHighlight() {
    console.log("Enabling highlight");
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    highlightEnabled = true;
    overlay.style.display = "block";
  }

  // 禁用高亮功能
  function disableHighlight() {
    console.log("Disabling highlight");
    highlightEnabled = false;
    // 保持事件监听器，但通过 highlightEnabled 变量控制行为
    // 这样可以保留选中状态的显示
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    // 不隐藏 selectedBox 和 selectedLabel，保留选中状态
  }

  // 完全禁用高亮功能（移除所有监听器）
  function fullyDisableHighlight() {
    console.log("Fully disabling highlight");
    highlightEnabled = false;
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    overlay.style.display = "none";
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    selectedBox.style.display = "none";
    selectedLabel.style.display = "none";
  }

  // 添加事件监听
  enableHighlight();
  window.addEventListener("message", handleParentMessage);

  // 暴露全局函数供外部调用
  window.__iframeHighlightControl = {
    enable: enableHighlight,
    disable: disableHighlight,
    fullyDisable: fullyDisableHighlight,
    isEnabled: function isEnabled() {
      return highlightEnabled;
    },
    getSelectedElement: function getSelectedElement() {
      return selectedElement;
    },
    updateSelected: updateSelectedHighlight,
    // 通过消息发送开关控制
    sendToggleMessage: function sendToggleMessage(enabled) {
      window.parent.postMessage({
        type: 'iframe-highlight-status',
        enabled: enabled || highlightEnabled,
        source: 'iframe-highlight-injector'
      }, '*');
    }
  };

  // 通知父窗口脚本已加载
  try {
    window.parent.postMessage({
      type: "iframe-highlight-ready",
      data: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      source: "iframe-highlight-injector"
    }, "*");
  } catch (error) {
    console.warn("无法发送就绪消息到父窗口:", error);
  }

  // 清理函数
  window.__iframeHighlightCleanup = function () {
    fullyDisableHighlight();
    window.removeEventListener("message", handleParentMessage);
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    delete window.__iframeHighlightInitialized;
    delete window.__iframeHighlightCleanup;
  };
})();

</script>

<script>
/**
 * Iframe 元素高亮注入脚本
 * 需要在目标网站中引入此脚本来支持跨域 iframe 高亮功能
 *
 * 使用方法：
 * 1. 将此脚本添加到目标网站的 HTML 中
 * 2. 或通过浏览器扩展、用户脚本等方式注入
 */

(function () {
  "use strict";

  // 检查是否在 iframe 中
  if (window.self === window.top) {
    return; // 不在 iframe 中，不执行
  }

  // 检查是否已经初始化过
  if (window.__iframeHighlightInitialized) {
    return;
  }
  window.__iframeHighlightInitialized = true;
  console.log("Iframe 高亮脚本已加载");

  // 创建高亮覆盖层
  var overlay = document.createElement("div");
  overlay.id = "iframe-highlight-overlay";
  overlay.style.cssText = "\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100vw;\n    height: 100vh;\n    pointer-events: none;\n    z-index: 999999;\n    overflow: hidden;\n  ";

  // 创建悬停高亮框（虚线边框）
  var highlightBox = document.createElement("div");
  highlightBox.id = "iframe-highlight-box";
  highlightBox.style.cssText = "\n    position: absolute;\n    border: 2px dashed #007AFF;\n    background: rgba(0, 122, 255, 0.08);\n    pointer-events: none;\n    display: none;\n    transition: all 0.1s ease;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);\n    border-radius: 2px;\n  ";

  // 创建选中节点的常驻高亮框（实线边框）
  var selectedBox = document.createElement("div");
  selectedBox.id = "iframe-selected-box";
  selectedBox.style.cssText = "\n    position: absolute;\n    border: 2px solid #007AFF;\n    pointer-events: none;\n    display: none;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 107, 53, 0.4);\n    border-radius: 2px;\n    z-index: 1000000;\n  ";

  // 创建悬停标签显示
  var tagLabel = document.createElement("div");
  tagLabel.id = "iframe-tag-label";
  tagLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 2px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000001;\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n    font-weight: 500;\n  ";

  // 创建选中节点标签
  var selectedLabel = document.createElement("div");
  selectedLabel.id = "iframe-selected-label";
  selectedLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 3px 8px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 3px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000002;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n    font-weight: 600;\n  ";
  overlay.appendChild(highlightBox);
  overlay.appendChild(selectedBox);
  overlay.appendChild(tagLabel);
  overlay.appendChild(selectedLabel);
  document.body.appendChild(overlay);

  // 存储当前选中的元素
  var selectedElement = null;
  var highlightEnabled = false;

  // 更新选中元素的高亮显示
  function updateSelectedHighlight(element) {
    console.log("updateSelectedHighlight called with:", element);
    if (!element) {
      selectedBox.style.display = "none";
      selectedLabel.style.display = "none";
      selectedElement = null;
      console.log("Cleared selected highlight");
      return;
    }
    selectedElement = element;
    var rect = element.getBoundingClientRect();
    console.log("Selected element rect:", rect);

    // 更新选中高亮框位置
    selectedBox.style.display = "block";
    selectedBox.style.left = "".concat(rect.left - 2, "px");
    selectedBox.style.top = "".concat(rect.top - 2, "px");
    selectedBox.style.width = "".concat(rect.width + 4, "px");
    selectedBox.style.height = "".concat(rect.height + 4, "px");

    // 更新选中标签位置和内容
    selectedLabel.style.display = "block";
    selectedLabel.textContent = "\u2713 <".concat(element.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 28;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 5) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    var labelWidth = selectedLabel.offsetWidth || 100; // 预估宽度
    if (labelLeft + labelWidth > window.innerWidth - 10) {
      labelLeft = window.innerWidth - labelWidth - 10;
    }
    selectedLabel.style.left = "".concat(Math.max(5, labelLeft), "px");
    selectedLabel.style.top = "".concat(labelTop, "px");
    console.log("Selected highlight positioned at:", {
      left: selectedBox.style.left,
      top: selectedBox.style.top,
      width: selectedBox.style.width,
      height: selectedBox.style.height
    });
  }
  function getElementSelector(element) {
    if (!(element instanceof Element)) throw new Error('Argument must be a DOM element');
    var segments = [];
    var current = element;
    while (current !== document.documentElement) {
      var selector = '';
      // 优先检查唯一ID
      if (current.id && document.querySelectorAll("#".concat(current.id)).length === 1) {
        segments.unshift("#".concat(current.id));
        break; // ID唯一，无需继续向上
      }

      // 生成类名选择器（取第一个有效类名）
      var classes = Array.from(current.classList).filter(function (c) {
        return !c.startsWith('js-');
      });
      var className = classes.length > 0 ? ".".concat(classes[0]) : '';

      // 生成位置索引（nth-child）
      var tag = current.tagName.toLowerCase();
      if (!className) {
        var siblings = Array.from(current.parentNode.children);
        var index = siblings.findIndex(function (el) {
          return el === current;
        }) + 1;
        selector = "".concat(tag, ":nth-child(").concat(index, ")");
      } else {
        selector = className;
      }
      segments.unshift(selector);
      current = current.parentElement;
    }

    // 处理根元素
    if (current === document.documentElement) {
      segments.unshift('html');
    }
    return segments.join(' > ');
  }

  // 获取元素文本内容
  function getElementText(element) {
    var _element$textContent;
    if (element.tagName === "INPUT") {
      return element.value || element.placeholder || "";
    }
    if (element.tagName === "TEXTAREA") {
      return element.value || element.placeholder || "";
    }
    var text = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim()) || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  // 获取元素属性信息
  function getElementAttributes(element) {
    var attrs = {};
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // 鼠标悬停事件处理
  function handleMouseOver(e) {
    if (!highlightEnabled) return;
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免高亮 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 如果是已选中的元素，不显示悬停高亮
    if (target === selectedElement) {
      highlightBox.style.display = "none";
      tagLabel.style.display = "none";
      return;
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);

    // 更新悬停高亮框位置
    highlightBox.style.display = "block";
    highlightBox.style.left = "".concat(rect.left - 2, "px");
    highlightBox.style.top = "".concat(rect.top - 2, "px");
    highlightBox.style.width = "".concat(rect.width + 4, "px");
    highlightBox.style.height = "".concat(rect.height + 4, "px");

    // 更新标签位置和内容
    tagLabel.style.display = "block";
    tagLabel.textContent = "<".concat(target.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 22;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 0) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    if (labelLeft + tagLabel.offsetWidth > window.innerWidth) {
      labelLeft = window.innerWidth - tagLabel.offsetWidth - 5;
    }
    tagLabel.style.left = "".concat(Math.max(0, labelLeft), "px");
    tagLabel.style.top = "".concat(labelTop, "px");

    // 发送消息到父窗口
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 鼠标离开事件处理
  function handleMouseOut(e) {
    if (!highlightEnabled) return;
    var relatedTarget = e.relatedTarget;

    // 如果鼠标移动到高亮相关元素上，不隐藏高亮
    if (relatedTarget && (relatedTarget === highlightBox || relatedTarget === tagLabel || relatedTarget === overlay || relatedTarget === selectedBox || relatedTarget === selectedLabel)) {
      return;
    }
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: null,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 点击事件处理
  function handleClick(e) {
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免处理 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 检查是否是交互元素，这些元素需要保留默认行为
    var isInteractiveElement = ['input', 'textarea', 'select', 'button', 'a'].includes(target.tagName.toLowerCase());

    // 如果高亮功能启用，对于非交互元素阻止默认行为和事件传播
    if (highlightEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);
    console.log("Element clicked:", {
      tagName: target.tagName,
      selector: selector,
      rect: rect
    });

    // 立即更新选中高亮
    updateSelectedHighlight(target);

    // 隐藏悬停高亮，因为现在是选中状态
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-click",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 监听来自父窗口的消息
  function handleParentMessage(event) {
    console.log("Received message from parent:", event.data);
    if (event.data.type === "iframe-highlight-toggle") {
      var enabled = event.data.enabled;
      console.log("Highlight toggle:", enabled);
      if (enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "enable-iframe-highlight") {
      console.log("Enable iframe highlight");
      enableHighlight();
    } else if (event.data.type === "disable-iframe-highlight") {
      console.log("Disable iframe highlight");
      disableHighlight();
    } else if (event.data.type === "toggle-iframe-highlight") {
      var _enabled = event.data.enabled !== undefined ? event.data.enabled : !highlightEnabled;
      console.log("Toggle iframe highlight to:", _enabled);
      if (_enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "update-selected-element") {
      var selector = event.data.selector;
      console.log("Update selected element with selector:", selector);
      if (selector) {
        try {
          var element = document.querySelector(selector);
          console.log("Found element by selector:", element);
          updateSelectedHighlight(element);
        } catch (error) {
          console.warn("Failed to select element:", error);
          updateSelectedHighlight(null);
        }
      } else {
        updateSelectedHighlight(null);
      }
    } else if (event.data.type === "clear-selected-element") {
      console.log("Clear selected element");
      updateSelectedHighlight(null);
    }
  }

  // 启用高亮功能
  function enableHighlight() {
    console.log("Enabling highlight");
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    highlightEnabled = true;
    overlay.style.display = "block";
  }

  // 禁用高亮功能
  function disableHighlight() {
    console.log("Disabling highlight");
    highlightEnabled = false;
    // 保持事件监听器，但通过 highlightEnabled 变量控制行为
    // 这样可以保留选中状态的显示
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    // 不隐藏 selectedBox 和 selectedLabel，保留选中状态
  }

  // 完全禁用高亮功能（移除所有监听器）
  function fullyDisableHighlight() {
    console.log("Fully disabling highlight");
    highlightEnabled = false;
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    overlay.style.display = "none";
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    selectedBox.style.display = "none";
    selectedLabel.style.display = "none";
  }

  // 添加事件监听
  enableHighlight();
  window.addEventListener("message", handleParentMessage);

  // 暴露全局函数供外部调用
  window.__iframeHighlightControl = {
    enable: enableHighlight,
    disable: disableHighlight,
    fullyDisable: fullyDisableHighlight,
    isEnabled: function isEnabled() {
      return highlightEnabled;
    },
    getSelectedElement: function getSelectedElement() {
      return selectedElement;
    },
    updateSelected: updateSelectedHighlight,
    // 通过消息发送开关控制
    sendToggleMessage: function sendToggleMessage(enabled) {
      window.parent.postMessage({
        type: 'iframe-highlight-status',
        enabled: enabled || highlightEnabled,
        source: 'iframe-highlight-injector'
      }, '*');
    }
  };

  // 通知父窗口脚本已加载
  try {
    window.parent.postMessage({
      type: "iframe-highlight-ready",
      data: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      source: "iframe-highlight-injector"
    }, "*");
  } catch (error) {
    console.warn("无法发送就绪消息到父窗口:", error);
  }

  // 清理函数
  window.__iframeHighlightCleanup = function () {
    fullyDisableHighlight();
    window.removeEventListener("message", handleParentMessage);
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    delete window.__iframeHighlightInitialized;
    delete window.__iframeHighlightCleanup;
  };
})();

</script>

<script>
/**
 * Iframe 元素高亮注入脚本
 * 需要在目标网站中引入此脚本来支持跨域 iframe 高亮功能
 *
 * 使用方法：
 * 1. 将此脚本添加到目标网站的 HTML 中
 * 2. 或通过浏览器扩展、用户脚本等方式注入
 */

(function () {
  "use strict";

  // 检查是否在 iframe 中
  if (window.self === window.top) {
    return; // 不在 iframe 中，不执行
  }

  // 检查是否已经初始化过
  if (window.__iframeHighlightInitialized) {
    return;
  }
  window.__iframeHighlightInitialized = true;
  console.log("Iframe 高亮脚本已加载");

  // 创建高亮覆盖层
  var overlay = document.createElement("div");
  overlay.id = "iframe-highlight-overlay";
  overlay.style.cssText = "\n    position: fixed;\n    top: 0;\n    left: 0;\n    width: 100vw;\n    height: 100vh;\n    pointer-events: none;\n    z-index: 999999;\n    overflow: hidden;\n  ";

  // 创建悬停高亮框（虚线边框）
  var highlightBox = document.createElement("div");
  highlightBox.id = "iframe-highlight-box";
  highlightBox.style.cssText = "\n    position: absolute;\n    border: 2px dashed #007AFF;\n    background: rgba(0, 122, 255, 0.08);\n    pointer-events: none;\n    display: none;\n    transition: all 0.1s ease;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.8);\n    border-radius: 2px;\n  ";

  // 创建选中节点的常驻高亮框（实线边框）
  var selectedBox = document.createElement("div");
  selectedBox.id = "iframe-selected-box";
  selectedBox.style.cssText = "\n    position: absolute;\n    border: 2px solid #007AFF;\n    pointer-events: none;\n    display: none;\n    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.9), 0 0 8px rgba(255, 107, 53, 0.4);\n    border-radius: 2px;\n    z-index: 1000000;\n  ";

  // 创建悬停标签显示
  var tagLabel = document.createElement("div");
  tagLabel.id = "iframe-tag-label";
  tagLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 2px 6px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 2px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000001;\n    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n    font-weight: 500;\n  ";

  // 创建选中节点标签
  var selectedLabel = document.createElement("div");
  selectedLabel.id = "iframe-selected-label";
  selectedLabel.style.cssText = "\n    position: absolute;\n    background: #007AFF;\n    color: white;\n    padding: 3px 8px;\n    font-size: 11px;\n    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\n    border-radius: 3px;\n    pointer-events: none;\n    display: none;\n    white-space: nowrap;\n    z-index: 1000002;\n    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);\n    font-weight: 600;\n  ";
  overlay.appendChild(highlightBox);
  overlay.appendChild(selectedBox);
  overlay.appendChild(tagLabel);
  overlay.appendChild(selectedLabel);
  document.body.appendChild(overlay);

  // 存储当前选中的元素
  var selectedElement = null;
  var highlightEnabled = false;

  // 更新选中元素的高亮显示
  function updateSelectedHighlight(element) {
    console.log("updateSelectedHighlight called with:", element);
    if (!element) {
      selectedBox.style.display = "none";
      selectedLabel.style.display = "none";
      selectedElement = null;
      console.log("Cleared selected highlight");
      return;
    }
    selectedElement = element;
    var rect = element.getBoundingClientRect();
    console.log("Selected element rect:", rect);

    // 更新选中高亮框位置
    selectedBox.style.display = "block";
    selectedBox.style.left = "".concat(rect.left - 2, "px");
    selectedBox.style.top = "".concat(rect.top - 2, "px");
    selectedBox.style.width = "".concat(rect.width + 4, "px");
    selectedBox.style.height = "".concat(rect.height + 4, "px");

    // 更新选中标签位置和内容
    selectedLabel.style.display = "block";
    selectedLabel.textContent = "\u2713 <".concat(element.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 28;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 5) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    var labelWidth = selectedLabel.offsetWidth || 100; // 预估宽度
    if (labelLeft + labelWidth > window.innerWidth - 10) {
      labelLeft = window.innerWidth - labelWidth - 10;
    }
    selectedLabel.style.left = "".concat(Math.max(5, labelLeft), "px");
    selectedLabel.style.top = "".concat(labelTop, "px");
    console.log("Selected highlight positioned at:", {
      left: selectedBox.style.left,
      top: selectedBox.style.top,
      width: selectedBox.style.width,
      height: selectedBox.style.height
    });
  }
  function getElementSelector(element) {
    if (!(element instanceof Element)) throw new Error('Argument must be a DOM element');
    var segments = [];
    var current = element;
    while (current !== document.documentElement) {
      var selector = '';
      // 优先检查唯一ID
      if (current.id && document.querySelectorAll("#".concat(current.id)).length === 1) {
        segments.unshift("#".concat(current.id));
        break; // ID唯一，无需继续向上
      }

      // 生成类名选择器（取第一个有效类名）
      var classes = Array.from(current.classList).filter(function (c) {
        return !c.startsWith('js-');
      });
      var className = classes.length > 0 ? ".".concat(classes[0]) : '';

      // 生成位置索引（nth-child）
      var tag = current.tagName.toLowerCase();
      if (!className) {
        var siblings = Array.from(current.parentNode.children);
        var index = siblings.findIndex(function (el) {
          return el === current;
        }) + 1;
        selector = "".concat(tag, ":nth-child(").concat(index, ")");
      } else {
        selector = className;
      }
      segments.unshift(selector);
      current = current.parentElement;
    }

    // 处理根元素
    if (current === document.documentElement) {
      segments.unshift('html');
    }
    return segments.join(' > ');
  }

  // 获取元素文本内容
  function getElementText(element) {
    var _element$textContent;
    if (element.tagName === "INPUT") {
      return element.value || element.placeholder || "";
    }
    if (element.tagName === "TEXTAREA") {
      return element.value || element.placeholder || "";
    }
    var text = ((_element$textContent = element.textContent) === null || _element$textContent === void 0 ? void 0 : _element$textContent.trim()) || "";
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  }

  // 获取元素属性信息
  function getElementAttributes(element) {
    var attrs = {};
    for (var i = 0; i < element.attributes.length; i++) {
      var attr = element.attributes[i];
      attrs[attr.name] = attr.value;
    }
    return attrs;
  }

  // 鼠标悬停事件处理
  function handleMouseOver(e) {
    if (!highlightEnabled) return;
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免高亮 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 如果是已选中的元素，不显示悬停高亮
    if (target === selectedElement) {
      highlightBox.style.display = "none";
      tagLabel.style.display = "none";
      return;
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);

    // 更新悬停高亮框位置
    highlightBox.style.display = "block";
    highlightBox.style.left = "".concat(rect.left - 2, "px");
    highlightBox.style.top = "".concat(rect.top - 2, "px");
    highlightBox.style.width = "".concat(rect.width + 4, "px");
    highlightBox.style.height = "".concat(rect.height + 4, "px");

    // 更新标签位置和内容
    tagLabel.style.display = "block";
    tagLabel.textContent = "<".concat(target.tagName.toLowerCase(), ">");

    // 计算标签位置，确保不超出视窗
    var labelTop = rect.top - 22;
    var labelLeft = rect.left;

    // 如果标签会超出顶部，显示在元素下方
    if (labelTop < 0) {
      labelTop = rect.bottom + 5;
    }

    // 如果标签会超出右侧，向左调整
    if (labelLeft + tagLabel.offsetWidth > window.innerWidth) {
      labelLeft = window.innerWidth - tagLabel.offsetWidth - 5;
    }
    tagLabel.style.left = "".concat(Math.max(0, labelLeft), "px");
    tagLabel.style.top = "".concat(labelTop, "px");

    // 发送消息到父窗口
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 鼠标离开事件处理
  function handleMouseOut(e) {
    if (!highlightEnabled) return;
    var relatedTarget = e.relatedTarget;

    // 如果鼠标移动到高亮相关元素上，不隐藏高亮
    if (relatedTarget && (relatedTarget === highlightBox || relatedTarget === tagLabel || relatedTarget === overlay || relatedTarget === selectedBox || relatedTarget === selectedLabel)) {
      return;
    }
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    try {
      window.parent.postMessage({
        type: "iframe-element-hover",
        data: null,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 点击事件处理
  function handleClick(e) {
    var target = e.target;
    if (!target || target === overlay || target === highlightBox || target === tagLabel || target === selectedBox || target === selectedLabel) {
      return;
    }

    // 避免处理 html 和 body 元素
    if (target === document.documentElement || target === document.body) {
      return;
    }

    // 检查是否是交互元素，这些元素需要保留默认行为
    var isInteractiveElement = ['input', 'textarea', 'select', 'button', 'a'].includes(target.tagName.toLowerCase());

    // 如果高亮功能启用，对于非交互元素阻止默认行为和事件传播
    if (highlightEnabled) {
      e.preventDefault();
      e.stopPropagation();
    }
    var rect = target.getBoundingClientRect();
    var selector = getElementSelector(target);
    var text = getElementText(target);
    var attributes = getElementAttributes(target);
    console.log("Element clicked:", {
      tagName: target.tagName,
      selector: selector,
      rect: rect
    });

    // 立即更新选中高亮
    updateSelectedHighlight(target);

    // 隐藏悬停高亮，因为现在是选中状态
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    var elementInfo = {
      tagName: target.tagName.toLowerCase(),
      rect: {
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y
      },
      selector: selector,
      text: text,
      attributes: attributes,
      url: window.location.href,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    try {
      window.parent.postMessage({
        type: "iframe-element-click",
        data: elementInfo,
        source: "iframe-highlight-injector"
      }, "*");
    } catch (error) {
      console.warn("无法发送消息到父窗口:", error);
    }
  }

  // 监听来自父窗口的消息
  function handleParentMessage(event) {
    console.log("Received message from parent:", event.data);
    if (event.data.type === "iframe-highlight-toggle") {
      var enabled = event.data.enabled;
      console.log("Highlight toggle:", enabled);
      if (enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "enable-iframe-highlight") {
      console.log("Enable iframe highlight");
      enableHighlight();
    } else if (event.data.type === "disable-iframe-highlight") {
      console.log("Disable iframe highlight");
      disableHighlight();
    } else if (event.data.type === "toggle-iframe-highlight") {
      var _enabled = event.data.enabled !== undefined ? event.data.enabled : !highlightEnabled;
      console.log("Toggle iframe highlight to:", _enabled);
      if (_enabled) {
        enableHighlight();
      } else {
        disableHighlight();
      }
    } else if (event.data.type === "update-selected-element") {
      var selector = event.data.selector;
      console.log("Update selected element with selector:", selector);
      if (selector) {
        try {
          var element = document.querySelector(selector);
          console.log("Found element by selector:", element);
          updateSelectedHighlight(element);
        } catch (error) {
          console.warn("Failed to select element:", error);
          updateSelectedHighlight(null);
        }
      } else {
        updateSelectedHighlight(null);
      }
    } else if (event.data.type === "clear-selected-element") {
      console.log("Clear selected element");
      updateSelectedHighlight(null);
    }
  }

  // 启用高亮功能
  function enableHighlight() {
    console.log("Enabling highlight");
    document.addEventListener("mouseover", handleMouseOver, true);
    document.addEventListener("mouseout", handleMouseOut, true);
    document.addEventListener("click", handleClick, true);
    highlightEnabled = true;
    overlay.style.display = "block";
  }

  // 禁用高亮功能
  function disableHighlight() {
    console.log("Disabling highlight");
    highlightEnabled = false;
    // 保持事件监听器，但通过 highlightEnabled 变量控制行为
    // 这样可以保留选中状态的显示
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    // 不隐藏 selectedBox 和 selectedLabel，保留选中状态
  }

  // 完全禁用高亮功能（移除所有监听器）
  function fullyDisableHighlight() {
    console.log("Fully disabling highlight");
    highlightEnabled = false;
    document.removeEventListener("mouseover", handleMouseOver, true);
    document.removeEventListener("mouseout", handleMouseOut, true);
    document.removeEventListener("click", handleClick, true);
    overlay.style.display = "none";
    highlightBox.style.display = "none";
    tagLabel.style.display = "none";
    selectedBox.style.display = "none";
    selectedLabel.style.display = "none";
  }

  // 添加事件监听
  enableHighlight();
  window.addEventListener("message", handleParentMessage);

  // 暴露全局函数供外部调用
  window.__iframeHighlightControl = {
    enable: enableHighlight,
    disable: disableHighlight,
    fullyDisable: fullyDisableHighlight,
    isEnabled: function isEnabled() {
      return highlightEnabled;
    },
    getSelectedElement: function getSelectedElement() {
      return selectedElement;
    },
    updateSelected: updateSelectedHighlight,
    // 通过消息发送开关控制
    sendToggleMessage: function sendToggleMessage(enabled) {
      window.parent.postMessage({
        type: 'iframe-highlight-status',
        enabled: enabled || highlightEnabled,
        source: 'iframe-highlight-injector'
      }, '*');
    }
  };

  // 通知父窗口脚本已加载
  try {
    window.parent.postMessage({
      type: "iframe-highlight-ready",
      data: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      },
      source: "iframe-highlight-injector"
    }, "*");
  } catch (error) {
    console.warn("无法发送就绪消息到父窗口:", error);
  }

  // 清理函数
  window.__iframeHighlightCleanup = function () {
    fullyDisableHighlight();
    window.removeEventListener("message", handleParentMessage);
    if (overlay.parentElement) {
      overlay.parentElement.removeChild(overlay);
    }
    delete window.__iframeHighlightInitialized;
    delete window.__iframeHighlightCleanup;
  };
})();

</script>
</body>
</html>
