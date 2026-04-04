// Aerotech Mixer PWA — login.js  (self-contained, no dependencies)
var MIXER_PINS = {'Ben Simcock':'1111','Robert Proud':'2222','Amber Meyers':'3333','Shaun Dempsey':'4444','Adam Sullivan':'5555','Will Piip':'6666','Craig Dawson':'7777'};
var ALL_JOBS_PIN = '0000'; // supervisor PIN to see all jobs
var _loginMixer = '', _loginPin = '';

// Load live mixer list + PINs from Firestore at startup
// Show loading state immediately
(function(){
  var spinner = document.getElementById('login-spinner');
  if(spinner) spinner.style.display = 'block';
  var errEl = document.getElementById('pin-err');
  if(errEl) errEl.textContent = '⏳ Loading...';
})();

(async function loadMixerSettings(){
  try{
    // Race Firebase SDK load against a 10s timeout — prevents infinite hang on slow CDN
    const {initializeApp} = await Promise.race([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 3000))
    ]);
    const {getFirestore,doc,getDoc} = await Promise.race([
      import('https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 3000))
    ]);
    const db = getFirestore(initializeApp({apiKey:"AIzaSyC5Aw3OjP3Fmh1OeveOwSqlMgJyTfufzVI",projectId:"aerotech-ops",appId:"1:645848371961:web:4415c4d7623219fd31c828"}));
    const snap = await getDoc(doc(db,'config','settings')).catch(e => { throw new Error('Firestore: '+e.message) });
    if(snap.exists()){
      const d=snap.data();
      if(d.mixerObjs&&d.mixerObjs.length){
        Object.keys(MIXER_PINS).forEach(k=>delete MIXER_PINS[k]);
        d.mixerObjs.forEach(m=>{if(m.name&&m.pin)MIXER_PINS[m.name]=String(m.pin);});
        buildMixerGrid(d.mixerObjs.map(m=>m.name).filter(Boolean));
      }
    }
  }catch(e){
    console.warn('loadMixerSettings:', e.message||e);
    var errEl = document.getElementById('pin-err');
    if(errEl) errEl.textContent = '⚠️ Firebase unavailable — using offline mode';
    var spinner = document.getElementById('login-spinner');
    if(spinner) spinner.style.display='none';
  }
})();

function buildMixerGrid(names){
  const grid=document.getElementById('mixer-grid');
  if(!grid) return;
  grid.innerHTML=names.map(n=>{
    const parts=n.split(' ');
    return '<button class="mixer-btn" onclick="selMixer_(\''+n+'\')"><span style="display:block;font-size:.95rem;font-weight:800">'+parts[0]+'</span><span style="display:block;font-size:.75rem;font-weight:500;color:#6b7280;margin-top:2px">'+parts.slice(1).join(' ')+'</span></button>';
  }).join('');
}

function selMixer_(name){
  _loginMixer = name; _loginPin = '';
  document.querySelectorAll('.mixer-btn').forEach(function(b){
    var first = b.querySelector('span') ? b.querySelector('span').textContent.trim() : '';
    b.classList.toggle('sel', name.indexOf(first)===0 && first.length>0);
  });
  // Hide pin section for ALL (no PIN needed — or add one below)
  document.getElementById('pin-section').style.display = 'block';
  drawDots();
}

// Called when "All Jobs" button tapped — skip PIN, login directly
function selAllJobs(){
  _loginMixer = 'ALL'; _loginPin = '';
  document.querySelectorAll('.mixer-btn').forEach(function(b){ b.classList.remove('sel'); });
  var ab = document.getElementById('all-jobs-btn');
  if(ab) ab.classList.add('sel');
  document.getElementById('pin-section').style.display = 'none';
  localStorage.setItem('at_mixer','ALL');
  doLogin('ALL');
}

function numTap(k){
  if (!_loginMixer) return;
  if (k==='X') _loginPin = _loginPin.slice(0,-1);
  else if (_loginPin.length < 4) _loginPin += k;
  drawDots();
  document.getElementById('pin-err').textContent = '';
  if (_loginPin.length === 4){
    if (MIXER_PINS[_loginMixer] === _loginPin){
      localStorage.setItem('at_mixer', _loginMixer);
      doLogin(_loginMixer);
    } else {
      document.getElementById('pin-err').textContent = 'Wrong PIN — try again';
      _loginPin = ''; drawDots();
    }
  }
}

function drawDots(){
  for (var i=0; i<4; i++){
    var d = document.getElementById('pd'+i);
    if (!d) continue;
    d.textContent = _loginPin[i] ? '●' : '';
    d.className = 'pin-dot' + (_loginPin[i] ? ' filled' : '');
  }
}

function doLogin(name){
  var spinner = document.getElementById('login-spinner');
  if(spinner) spinner.style.display='none';
  var errEl = document.getElementById('pin-err');
  if(errEl) errEl.textContent = '';

  if (typeof window._appLogin === 'function'){
    window._appLogin(name);
  } else {
    var t = setInterval(function(){
      if (typeof window._appLogin === 'function'){
        clearInterval(t);
        window._appLogin(name);
      }
    }, 50);
    setTimeout(function(){ clearInterval(t); }, 5000);
  }
}

// Auto-login on load if saved
document.addEventListener('DOMContentLoaded', function(){
  var saved = localStorage.getItem('at_mixer');
  if (saved === 'ALL') { doLogin('ALL'); return; }
  if (saved && MIXER_PINS[saved]) doLogin(saved);
});
