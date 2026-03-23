# Aerotech Operations Platform — System Design

## JotForm Job Request Fields (Form 230578555318867)

### Client Info (Section 1)
- Client Trading Name *
- Client's Agent / Agronomist Name

### Recommendation & Date (Section 2)
- Do you have a Recommendation? (Yes/No)
- Upload Recommendation & Map (file)
- Preferred Application Date *
- Recommendation has correct Paddock & Product details? (Yes/No)

### Job Details (Section 3)
- Preferred Application Date *
- Farm Address *
- Airstrip
- Wind Direction Required
- Water Rate (default 30 L/ha)
- **Paddock Details Table** (12 rows):
  - Farm/Paddock Name
  - Ha's
  - Crop Type (Wheat/Barley/Canola/Beans/Lentils/Lupins/Oats/Pasture/Cereals/Legumes+Pulses/Oilseeds)
- **Product Details Table** (8 rows):
  - Product Name
  - Product Type (Herbicide/Fungicide/Insecticide/Trace Element/Adjuvant-Wetter/Fertiliser/Snail Bait/Mouse Bait)
  - Application Rate
  - Measurement per Ha (KG/Ha or L/Ha)
  - Total Product Required for Job
- Upload Maps (with powerlines marked)

### Admin Section (Section 4) — internal
Table per load:
- Date, Aircraft, Pilot, Mixer, VDO Start, VDO Stop, Take off, Landing, # Starts, # Lands, Airstrip, Application Type

### Pilot Entry (Section 5) — per paddock
- Paddock Name, Swath, Wind, OAT, Humidity, DeltaT, Dispersal Eqpt, Droplets, Vol Rate, VDO Time, Price/ha

### Hazards (Section 6)
- Map Provided? (Y/N)
- Powerlines? (Y/N)
- Hazards? (Y/N) + describe
- Susceptible Crops? (Y/N) + describe
- Within 150m of dwelling? (Y/N) + approval
- Neighbours notified?
- Neighbours of concern? (Y/N) + describe
- Additional Comments

### Chemical Drop-off (Section 7)
- Who delivers chemical? (Client/Agent/Both/Other)
- Who is invoiced? (Client/Agent)
- Trading details same as last 12 months? (Y/N)
- Agent email for invoice

### Submitter Info (Section 8)
- Name, Email, Mobile
- T&C agreement checkbox

---

## System Architecture

### Technology Stack
- **Backend**: Firebase (Firestore + Auth + Hosting)
- **JotForm → Firebase**: JotForm Webhook → Firebase Cloud Function
- **Email**: EmailJS (free 200/mo) or Firebase + SendGrid
- **Weather**: Open-Meteo API (free, BOM data)
- **Frontend**: HTML/JS PWAs (consistent with existing tools)

### User Roles
1. **Admin/Dispatcher** — full dashboard, scheduling, billing
2. **Pilot** — sees own jobs, submits completions
3. **Mixer** — sees own jobs, runs mixer sheet
4. **Client** — (future) self-service job tracking (optional)

### Data Model (Firestore Collections)

```
/jobs/{jobId}
  - submissionId (JotForm)
  - status: 'new' | 'quoted' | 'scheduled' | 'in_progress' | 'pilot_complete' | 'mixer_complete' | 'complete' | 'invoiced'
  - clientName, agentName
  - preferredDate
  - farmAddress, airstrip
  - windDirectionRequired, waterRate
  - paddocks: [{name, ha, cropType}]
  - products: [{name, type, rate, unit, totalRequired}]
  - hasRecommendation, mapUploaded
  - hazards: {powerlines, describe, susceptibleCrops, ...}
  - chemical: {delivery, invoiceTo, agentEmail}
  - submitter: {name, email, mobile}
  - createdAt
  - estimatedHours (from pricing calculator)
  - quotedCost

/jobs/{jobId}/schedule
  - aircraft, pilot, mixerId
  - scheduledDate
  - assignedAt

/jobs/{jobId}/pilotCompletion
  - date, startTime, finishTime
  - aircraft, pilotName, airstrip
  - paddocks: [{name, swath, wind, OAT, humidity, deltaT, dispersalEqpt, droplets, volRate, VDOtime, priceHa}]
  - weather: {windSpeed, windDir, temp, humidity, deltaT}
  - VDOstart, VDOstop
  - submittedAt

/jobs/{jobId}/mixerCompletion
  - loads: [{loadNum, products, timestamp}]
  - totalLoads
  - submittedAt

/staff/{staffId}
  - name, role (pilot/mixer/admin), email, phone
  - aircraft (for pilots)

/billing/{jobId}
  - totalCost, costPerHa
  - invoiceNumber, invoiceDate
  - bonusPercent, bonusAmount
  - paid: bool

/records/{recordId}  (denormalized for fast search)
  - jobId, date, aircraft, pilot, mixer
  - applicationType, product, hectares
  - flightHours, totalCost, costPerHa
  - hourlyReturn
```

---

## Build Phases

### Phase 1 — Foundation (Week 1-2)
- [ ] Firebase project setup
- [ ] JotForm webhook → Firestore (auto-ingest new jobs)
- [ ] Admin dashboard: job list sorted by date / type / airstrip / status
- [ ] Pricing calculator integration (auto-estimate time + cost per job)

### Phase 2 — Scheduler (Week 2-3)
- [ ] Daily planner view (calendar + job blocks)
- [ ] Assign aircraft, pilot, mixer to each job
- [ ] Conflict detection (is plane/pilot double-booked?)

### Phase 3 — Pilot PWA (Week 3-4)
- [ ] Login → see day's jobs
- [ ] Job detail view (paddocks, products, hazards, map link)
- [ ] Completion form (auto-date/aircraft/pilot, weather, VDO, per-paddock data)
- [ ] Submit → status update in Firestore

### Phase 4 — Mixer PWA (Week 4-5)
- [ ] Login → see day's jobs
- [ ] Mixer Sheet integrated (existing app)
- [ ] Load tracking + completion submit

### Phase 5 — Completion & Comms (Week 5)
- [ ] Both complete → status = 'complete'
- [ ] Auto-email to client with summary PDF

### Phase 6 — Billing & Records (Week 6-8)
- [ ] Invoice generation (per job)
- [ ] Employee bonus tracking (% of job)
- [ ] Records search: by aircraft, pilot, type, date range
- [ ] Hourly return reports

---

## What's Needed to Start

1. Google account for Firebase project
2. JotForm API key (Settings → API in JotForm account)
3. List of staff: names, roles, aircraft regs, emails
4. Email address to send FROM for client notifications
5. Decision: do you want the job ORDER form to stay on JotForm, or build a custom one in the app?
