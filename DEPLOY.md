# AeroOps — Firebase Hosting Deploy Guide

## Overview
Five Firebase Hosting sites, each mapped to a subdomain of aerops.com.au:

| Site Target | Local Folder | Final URL |
|-------------|-------------|-----------|
| `office`    | `dashboard/` | `app.aerops.com.au` |
| `pilot`     | `pilot-pwa/` | `pilot.aerops.com.au` |
| `mixer`     | `mixer-clean/` | `mixer.aerops.com.au` |
| `jobs`      | `client-form/` | `jobs.aerops.com.au` |
| `landing`   | `aerops-landing/` | `aerops.com.au` |

---

## One-Time Setup (done once by a developer)

### 1. Install Firebase CLI
```
npm install -g firebase-tools
firebase login
```

### 2. Create Firebase Hosting sites
Go to Firebase Console → aerotech-ops → Hosting → Add custom site, create:
- `aerops-pilot`
- `aerops-mixer`  
- `aerops-jobs`
- `aerops-landing`
(The default `aerotech-ops` site maps to `office`)

### 3. Run first deploy (from /workspace/aerotech-platform/)
```
cd /workspace/aerotech-platform
firebase deploy --only hosting
```

---

## DNS Records to Add (in your domain registrar for aerops.com.au)

After Firebase assigns verification tokens (shown in Firebase Console → Hosting → each site):

| Type  | Name             | Value (Firebase will provide) |
|-------|------------------|-------------------------------|
| A     | @                | 151.101.1.195                 |
| A     | @                | 151.101.65.195                |
| CNAME | app              | aerotech-ops.web.app          |
| CNAME | pilot            | aerops-pilot.web.app          |
| CNAME | mixer            | aerops-mixer.web.app          |
| CNAME | jobs             | aerops-jobs.web.app           |
| TXT   | (verification)   | (Firebase Console will give)  |

---

## Xero Redirect URI (PERMANENT — save this in Xero)
```
https://app.aerops.com.au/
```

---

## Ongoing Updates
After any code change:
```
cd /workspace/aerotech-platform
# For pilot PWA — run PREDEPLOY first:
python3 pilot-pwa/PREDEPLOY.py
# Then deploy:
firebase deploy --only hosting:office    # dashboard only
firebase deploy --only hosting:pilot     # pilot PWA only
firebase deploy --only hosting           # all sites
```

---

## Current Temporary URLs (while DNS propagates)
- Dashboard: https://aolddyuk2932.space.minimax.io
- Pilot PWA:  https://mh02e68om96l.space.minimax.io
- Mixer PWA:  https://dwx98wbapl01.space.minimax.io
- Client Form: https://4rhqzwbfxy2j.space.minimax.io
