// Fixed login.js — Firestore REST only, no Firebase SDK CDN
// Does NOT import app.js — hands off via window._appLogin defined by app.js

var MIXER_PINS = {
  'Ben Simcock':'1111','Robert Proud':'2222','Amber Meyers':'3333',
  'Shaun Dempsey':'4444','Adam Sullivan':'5555','Will Piip':'6666','Craig Dawson':'7777'
};
var ALL_JOBS_PIN = '0000';
var _loginMixer = '', _loginPin = '';

var FS_KEY = 'AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI';
var FS_BASE = 'https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';

function fsGet(path) {
  return fetch(FS_BASE + path + '&key=' + FS_KEY, {
    signal: AbortSignal.timeout(8000)
  }).then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
}

(function initMixerLogin(){
  var errEl = document.getElementById('pin-err');
  var spinner = document.getElementById('login-spinner');
  if(errEl) errEl.textContent = 'Loading mixers...';
  if(spinner) spinner.style.display = 'block';

  fsGet('/config/settings').then(function(data){
    if(data.fields && data.fields.mixerObjs && data.fields.mixerObjs.arrayValue && data.fields.mixerObjs.arrayValue.values){
      var objs = data.fields.mixerObjs.arrayValue.values;
      Object.keys(MIXER_PINS).forEach(function(k){ delete MIXER_PINS[k]; });
      objs.forEach(function(m){
        if(m.mapValue && m.mapValue.fields){
          var name = m.mapValue.fields.name ? m.mapValue.fields.name.stringValue : '';
          var pin  = m.mapValue.fields.pin  ? String(m.mapValue.fields.pin.integerValue || m.mapValue.fields.pin.stringValue || '') : '';
          if(name && pin) MIXER_PINS[name] = pin;
        }
      });
    }
    if(errEl) errEl.textContent = '';
    if(spinner) spinner.style.display = 'none';
    buildMixerGrid();
  }).catch(function(e){
    console.warn('Firestore error:', e.message);
    if(errEl) errEl.textContent = '⚠️ Firestore unreachable — using offline PINs';
    if(spinner) spinner.style.display = 'none';
    buildMixerGrid();
  });
})();

function buildMixerGrid(){
  var grid = document.getElementById('mixer-grid');
  if(!grid) return;
  grid.innerHTML = Object.keys(MIXER_PINS).map(function(n){
    var parts = n.split(' ');
    var first = parts[0]||'';
    var rest  = parts.length > 1 ? ' '+parts.slice(1).join(' ') : '';
    return '<div class="mixer-btn" onclick="selMixer_(\''+n.replace(/'/g,"\\'")+'\')"><span>'+first+'</span>'+rest+'</div>';
  }).join('');
}

function selMixer_(name){
  _loginMixer = name; _loginPin = '';
  document.querySelectorAll('.mixer-btn').forEach(function(b){ b.classList.remove('sel'); });
  try { event.target.closest('.mixer-btn').classList.add('sel'); } catch(e){}
  document.getElementById('pin-section').style.display = 'block';
  document.getElementById('all-jobs-btn').style.display = 'none';
  drawDots();
  var errEl = document.getElementById('pin-err');
  if(errEl) errEl.textContent = '';
}

function selAllJobs(){
  _loginMixer = 'ALL'; _loginPin = '';
  document.querySelectorAll('.mixer-btn').forEach(function(b){ b.classList.remove('sel'); });
  var ab = document.getElementById('all-jobs-btn');
  if(ab) ab.classList.add('sel');
  document.getElementById('pin-section').style.display = 'none';
  localStorage.setItem('at_mixer', 'ALL');
  doLogin('ALL');
}

function numTap(k){
  if(!_loginMixer) return;
  if(k==='X'){ _loginPin = _loginPin.slice(0,-1); drawDots(); return; }
  if(_loginPin.length >= 4) return;
  _loginPin += k; drawDots();
  if(_loginPin.length === 4){
    if(MIXER_PINS[_loginMixer] === _loginPin){
      localStorage.setItem('at_mixer', _loginMixer);
      doLogin(_loginMixer);
    } else {
      var errEl = document.getElementById('pin-err');
      if(errEl) errEl.textContent = 'Wrong PIN — try again';
      _loginPin = ''; drawDots();
    }
  }
}

function drawDots(){
  for(var i=0;i<4;i++){
    var d = document.getElementById('pd'+i);
    if(d){ d.textContent = _loginPin[i] ? '●' : ''; d.className = 'pin-dot' + (_loginPin[i] ? ' filled' : ''); }
  }
}

function doLogin(name){
  var spinner = document.getElementById('login-spinner');
  if(spinner) spinner.style.display = 'none';
  var errEl = document.getElementById('pin-err');
  if(errEl) errEl.textContent = '';
  // Call window._appLogin if app.js has defined it (original app flow)
  if(typeof window._appLogin === 'function'){
    window._appLogin(name);
  } else {
    // Wait up to 8s for app.js to load, then show error
    var waited = 0;
    var iv = setInterval(function(){
      waited += 100;
      if(typeof window._appLogin === 'function'){
        clearInterval(iv);
        window._appLogin(name);
        return;
      }
      if(waited >= 8000){
        clearInterval(iv);
        if(errEl) errEl.textContent = '⚠️ Jobs unavailable — check connection';
        if(spinner) spinner.style.display = 'none';
      }
    }, 100);
  }
}

document.addEventListener('DOMContentLoaded', function(){
  // Build PIN dots
  var dd = document.getElementById('pin-display');
  if(dd){
    dd.innerHTML = '';
    for(var i=0;i<4;i++){
      var d = document.createElement('div'); d.id = 'pd'+i; d.className = 'pin-dot';
      dd.appendChild(d);
    }
  }
  // Auto-login if mixer saved
  var saved = localStorage.getItem('at_mixer');
  if(saved === 'ALL'){ doLogin('ALL'); return; }
  if(saved && MIXER_PINS[saved]){
    _loginMixer = saved;
    document.getElementById('pin-section').style.display = 'block';
    buildMixerGrid();
    document.querySelectorAll('.mixer-btn').forEach(function(b){
      if(b.textContent.trim().startsWith(saved.split(' ')[0])) b.classList.add('sel');
    });
    drawDots();
    // Trigger app.js login
    doLogin(saved);
  }
});
