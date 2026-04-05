// Aerotech Mixer PWA — login.js (Firestore REST, no Firebase SDK CDN)
// Handles network failure gracefully + fallback in doLogin()

var MIXER_PINS = {'Ben Simcock':'1111','Robert Proud':'2222','Amber Meyers':'3333','Shaun Dempsey':'4444','Adam Sullivan':'5555','Will Piip':'6666','Craig Dawson':'7777'};
var ALL_JOBS_PIN = '0000';
var _loginMixer = '', _loginPin = '';

var FS_KEY = 'AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI';
var FS_BASE = 'https://firestore.googleapis.com/v1/projects/aerotech-ops/databases/(default)/documents';

function fsGet(path) {
  return fetch(FS_BASE + path + '?key=' + FS_KEY, {
    signal: AbortSignal.timeout(8000)
  }).then(function(r) { if(!r.ok) throw new Error('HTTP '+r.status); return r.json(); });
}

(function initMixerLogin(){
  var errEl = document.getElementById('pin-err');
  var spinner = document.getElementById('login-spinner');
  if(errEl) errEl.textContent = '⏳ Loading...';
  if(spinner) spinner.style.display = 'block';
  fsGet('/config/settings').then(function(data){
    if(data.fields && data.fields.mixerObjs && data.fields.mixerObjs.arrayValue && data.fields.mixerObjs.arrayValue.values){
      var objs = data.fields.mixerObjs.arrayValue.values;
      Object.keys(MIXER_PINS).forEach(function(k){ delete MIXER_PINS[k]; });
      objs.forEach(function(m){
        if(m.mapValue && m.mapValue.fields){
          var name = m.mapValue.fields.name ? m.mapValue.fields.name.stringValue : '';
          var pin  = m.mapValue.fields.pin  ? String(m.mapValue.fields.pin.integerValue  || m.mapValue.fields.pin.stringValue  || '') : '';
          if(name && pin) MIXER_PINS[name] = pin;
        }
      });
    }
    if(errEl) errEl.textContent = '';
    if(spinner) spinner.style.display = 'none';
  }).catch(function(e){
    console.warn('Firestore error:', e.message);
    if(errEl) errEl.textContent = '⚠️ Using offline PINs';
    if(spinner) spinner.style.display = 'none';
  });
})();

function buildMixerGrid(names){
  var grid = document.getElementById('mixer-grid');
  if(!grid || !names || !names.length) return;
  grid.innerHTML = names.map(function(n){
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
  drawDots();
}

function selAllJobs(){
  _loginMixer = 'ALL';
  document.querySelectorAll('.mixer-btn').forEach(function(b){ b.classList.remove('sel'); });
  var ab = document.getElementById('all-jobs-btn');
  if(ab) ab.classList.add('sel');
  document.getElementById('pin-section').style.display = 'none';
  localStorage.setItem('at_mixer','ALL');
  doLogin('ALL');
}

function numTap(k){
  if(!_loginMixer) return;
  if(k==='X') _loginPin = _loginPin.slice(0,-1);
  else if(_loginPin.length < 4) _loginPin += k;
  drawDots();
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
  // Always hide spinner immediately
  var spinner = document.getElementById('login-spinner');
  if(spinner) spinner.style.display = 'none';
  var errEl = document.getElementById('pin-err');
  if(errEl) errEl.textContent = '';
  // Primary: call window._appLogin (app.js)
  if(typeof window._appLogin === 'function'){
    window._appLogin(name);
    return;
  }
  // Fallback: wait up to 8s for app.js to define _appLogin, then close login screen
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
      // Close login overlay, show main app
      var lw = document.getElementById('login-wrap');
      if(lw) lw.classList.remove('show');
      var pa = document.getElementById('pwa-app');
      if(pa) pa.style.display = 'block';
      if(errEl) errEl.textContent = '⚠️ Jobs unavailable — check connection';
    }
  }, 100);
}

document.addEventListener('DOMContentLoaded', function(){
  var saved = localStorage.getItem('at_mixer');
  if(saved === 'ALL'){ doLogin('ALL'); return; }
  if(saved && MIXER_PINS[saved]) doLogin(saved);
});
