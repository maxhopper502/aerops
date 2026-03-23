size:.7rem;color:var(--muted);border-bottom:2px solid var(--border)\\">Rate</th></tr></thead><tbody>"+prRows+"</tbody></table></div>";

  body+="<div style=\\"height:80px\\"></div>";
  $("dbody").innerHTML=body;

  const done=j.status==="pilot_complete", going=j.status==="in_progress";
  $("dbar2").innerHTML=done
    ?"<button class=\\"btn btn-gh\\" style=\\"flex:none;padding:14px 20px\\" onclick=\\"goJobs()\\">Back</button><button class=\\"btn btn-n\\" onclick=\\"goComplete()\\">Edit Record</button>"
    :going
    ?"<button class=\\"btn btn-gh\\" style=\\"flex:none;padding:14px 20px\\" onclick=\\"goJobs()\\">Back</button><button class=\\"btn btn-g\\" onclick=\\"goComplete()\\">Complete Job</button>"
    :"<button class=\\"btn btn-gh\\" style=\\"flex:none;padding:14px 20px\\" onclick=\\"goJobs()\\">Back</button><button class=\\"btn btn-o\\" onclick=\\"startJob()\\">Start Job</button>";
}

async function startJob(){
  const j=jobs.find(j=>j.id===jid); if(!j)return;
  j.completion=j.completion||{};
  j.completion.date=today(); j.completion.pilot=pilot;
  j.completion.aircraft=j.schedule?.aircraft||""; j.completion.mixer=j.schedule?.mixer||"";
  j.status="in_progress";
  toast("Fetching weather...",3000);
  const c=COORDS[j.airstrip]||COORDS._default;
  wx=await fetchWx(c.lat,c.lon);
  if(wx){j.completion.weather=wx;toast("Weather loaded");}
  else toast("Weather unavailable - enter manually");
  try{await updateDoc(doc(db,"jobs",jid),{status:"in_progress",completion:j.completion});}catch(e){console.warn(e);}
  renderJobs(); goDetail();
}

async function fetchWx(lat,lon){
  try{
    const r=await fetch("https://api.open-meteo.com/v1/forecast?latitude="+lat+"&longitude="+lon+"&current=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&wind_speed_unit=kmh&timezone=auto");
    const d=await r.json(); const c=d.current;
    const t=Math.round(c.temperature_2m*10)/10, rh=Math.round(c.relative_humidity_2m);
    return{tempC:t,rh,windSpeed:Math.round(c.wind_speed_10m),windDir:d2c(c.wind_direction_10m),deltaT:dT(t,rh),at:new Date().toTimeString().slice(0,5)};
  }catch(e){console.warn(e);return null;}
}

function goComplete(){
  const j=jobs.find(j=>j.id===jid); if(!j)return;
  const c=j.completion||{}, w=c.weather||wx||{};
  const ha=(j.paddocks||[]).reduce((s,p)=>s+(parseFloat(p.ha)||0),0);
  go("s-complete");
  const disp=["Micronair","Atomiser","Spreader","Fan Spreader"].map(v=>"<option"+(c.dispersal===v?" selected":"")+">"+v+"</option>").join("");
  const drop=["Very Fine","Fine","Medium","Coarse","Very Coarse"].map(v=>"<option"+(c.droplet===v?" selected":"")+">"+v+"</option>").join("");
  const wfetch=w.at?"Fetched at "+w.at+" - edit if needed":"Not fetched - <button onclick=\\"refetch()\\" style=\\"background:none;border:none;color:var(--blue);font-weight:600;cursor:pointer\\">Fetch now</button>";
  $("cbody").innerHTML=
    "<div class=\\"fsec\\" style=\\"background:var(--navy);color:#fff\\">"
    +"<div style=\\"font-size:1rem;font-weight:700;margin-bottom:4px\\">"+(j.clientName||"Job")+"</div>"
    +"<div style=\\"font-size:.8rem;opacity:.75\\">"+(j.airstrip||"")+" - "+(j.schedule?.aircraft||"")+" - "+(j.schedule?.mixer||"")+"</div>"
    +"<div style=\\"font-size:.75rem;opacity:.6;margin-top:4px\\">"+ha.toFixed(1)+" ha - "+((j.products||[]).map(p=>p.name).filter(Boolean).join(", "))+"</div>"
    +"</div>"
    +"<div class=\\"fsec\\"><h3>Flight Times</h3>"
    +"<div class=\\"fg\\"><label>Date</label><input type=\\"date\\" id=\\"fd\\" value=\\""+(c.date||today())+"\\" /></div>"
    +"<div class=\\"two\\"><div class=\\"fg\\"><label>VDO Start</label><input type=\\"text\\" id=\\"fvs\\" placeholder=\\"e.g. 1234.5\\" value=\\""+(c.vdoStart||"")+"\\"/></div>"
    +"<div class=\\"fg\\"><label>VDO Stop</label><input type=\\"text\\" id=\\"fve\\" placeholder=\\"e.g. 1237.2\\" value=\\""+(c.vdoStop||"")+"\\" /></div></div>"
    +"<div class=\\"two\\"><div class=\\"fg\\"><label>Takeoff</label><div class=\\"trow\\"><input type=\\"time\\" id=\\"fto\\" value=\\""+(c.takeoffTime||"")+"\\"/><button class=\\"tstamp\\" onclick=\\"stamp(\\'fto\\')\\">Now</button></div></div>"
    +"<div class=\\"fg\\"><label>Landing</label><div class=\\"trow\\"><input type=\\"time\\" id=\\"fld\\" value=\\""+(c.landingTime||"")+"\\"/><button class=\\"tstamp\\" onclick=\\"stamp(\\'fld\\')\\">Now</button></div></div></div>"
    +"<div class=\\"two\\"><div class=\\"fg\\"><label>Starts</label><input type=\\"number\\" id=\\"fst\\" min=\\"1\\" max=\\"20\\" value=\\""+(c.numStarts||1)+"\\" /></div>"
    +"<div class=\\"fg\\"><label>Landings</label><input type=\\"number\\" id=\\"fln\\" min=\\"1\\" max=\\"20\\" value=\\""+(c.numLandings||1)+"\\" /></div></div></div>"
    +"<div class=\\"fsec\\"><h3>Application</h3>"
    +"<div class=\\"two\\"><div class=\\"fg\\"><label>Swath Width (m)</label><input type=\\"number\\" id=\\"fsw\\" min=\\"10\\" max=\\"60\\" step=\\"1\\" value=\\""+(c.swath||j.swathOverride||"")+"\\" placeholder=\\"metres\\"/></div>"
    +"<div class=\\"fg\\"><label>Vol Rate Actual (L/ha)</label><input type=\\"number\\" id=\\"fvr\\" step=\\"0.1\\" value=\\""+(c.volRateActual||j.waterRate||"")+"\\" /></div></div>"
    +"<div class=\\"two\\"><div class=\\"fg\\"><label>Dispersal Equipment</label><select id=\\"fde\\"><option value=\\"\\">- Select -</option>"+disp+"</select></div>"
    +"<div class=\\"fg\\"><label>Droplet Spectrum</label><select id=\\"fdr\\"><option value=\\"\\">- Select -</option>"+drop+"</select></div></div></div>"
    +"<div class=\\"fsec\\"><h3>Weather <span class=\\"abadge\\">AUTO</span></h3>"
    +"<div class=\\"wxbar\\">"+wfetch+"</div>"
    +"<div class=\\"wxgrid\\">"
    +"<div class=\\"fg\\"><label>Temp (C)</label><input type=\\"number\\" id=\\"wt\\" step=\\"0.1\\" value=\\""+(w.tempC||"")+"\\" oninput=\\"calcDT()\\"/></div>"
    +"<div class=\\"fg\\"><label>Humidity (%)</label><input type=\\"number\\" id=\\"wr\\" min=\\"0\\" max=\\"100\\" value=\\""+(w.rh||"")+"\\" oninput=\\"calcDT()\\"/></div>"
    +"<div class=\\"fg\\"><label>Wind Speed (km/h)</label><input type=\\"number\\" id=\\"wws\\" min=\\"0\\" step=\\"1\\" value=\\""+(w.windSpeed||"")+"\\" /></div>"
    +"<div class=\\"fg\\"><label>Wind Direction</label><input type=\\"text\\" id=\\"wwd\\" placeholder=\\"e.g. NW\\" maxlength=\\"4\\" value=\\""+(w.windDir||"")+"\\" /></div>"
    +"<div class=\\"fg\\" style=\\"grid-column:1/-1\\"><label>Delta T <span class=\\"abadge\\">CALC</span></label><input type=\\"number\\" id=\\"wdt\\" step=\\"0.1\\" value=\\""+(w.deltaT||"")+"\\" placeholder=\\"Auto\\"/></div>"
    +"</div></div><div style=\\"height:80px\\"></div>";
}

function stamp(id){$(id).value=nowT();}
function calcDT(){const t=parseFloat($("wt")?.value),r=parseFloat($("wr")?.value);if(!isNaN(t)&&!isNaN(r))$("wdt").value=dT(t,r);}
async function refetch(){
  const j=jobs.find(j=>j.id===jid); if(!j)return;
  toast("Fetching...",3000);
  const c=COORDS[j.airstrip]||COORDS._default;
  const w=await fetchWx(c.lat,c.lon);
  if(w){$("wt").value=w.tempC;$("wr").value=w.rh;$("wws").value=w.windSpeed;$("wwd").value=w.windDir;$("wdt").value=w.deltaT;toast("Updated");}
  else toast("Could not fetch weather");
}

async function submitJob(){
  const j=jobs.find(j=>j.id===jid); if(!j)return;
  const c={date:$("fd").value,vdoStart:$("fvs").value,vdoStop:$("fve").value,takeoffTime:$("fto").value,landingTime:$("fld").value,numStarts:parseInt($("fst").value)||1,numLandings:parseInt($("fln").value)||1,swath:parseFloat($("fsw").value)||null,volRateActual:parseFloat($("fvr").value)||null,dispersal:$("fde").value,droplet:$("fdr").value,pilot,aircraft:j.schedule?.aircraft||"",mixer:j.schedule?.mixer||"",weather:{tempC:parseFloat($("wt").value)||null,rh:parseFloat($("wr").value)||null,windSpeed:parseFloat($("wws").value)||null,windDir:$("wwd").value,deltaT:parseFloat($("wdt").value)||null},submittedAt:new Date().toISOString()};
  j.completion=c; j.status="pilot_complete";
  try{await updateDoc(doc(db,"jobs",jid),{status:"pilot_complete",completion:c});toast("Job submitted!");renderJobs();goJobs();}
  catch(e){console.warn(e);toast("Saved locally - will sync when online");renderJobs();goJobs();}
}

function goJobs(){go("s-jobs");}

buildGrid();
if(pilot&&PINS[pilot]){onLogin();}else{go("s-login");}

window.selPilot=selPilot;window.pt=pt;window.pc=pc;window.signOut=signOut;
window.goJobs=goJobs;window.goDetail=goDetail;window.goComplete=goComplete;
window.startJob=startJob;window.stamp=stamp;window.calcDT=calcDT;
window.refetch=refetch;window.submitJob=submitJob;
"""

lines.append('<script type="module">')
lines.append(js)
lines.append('</script>')
lines.append('</body>')
lines.append('</html>')

html = '\n'.join(lines)
with open('/workspace/aerotech-platform/pilot-pwa/index.html','w') as f:
    f.write(html)
print(f"Written: {len(html)} chars, {html.count(chr(10))} lines")
print(f"DOCTYPE: {html.startswith('<!DOCTYPE')}")
print(f"firebase: {'firebase-app' in html}")
print(f"</html>: {html.strip().endswith('</html>')}")
print(f"script tags: {html.count('</script>')}")
print(f"selPilot: {html.count('selPilot')}")
print(f"chkPin: {html.count('chkPin')}")
