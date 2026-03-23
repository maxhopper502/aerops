# How to Deploy AeroOps to Firebase Hosting
### (Send this to whoever will run the deploy — takes about 5 minutes)

---

## What you need
- A Mac or PC with internet access
- Node.js installed (download free from nodejs.org if not already — LTS version)
- The Google account that owns the **aerotech-ops** Firebase project

---

## Step 1 — Download the project files

The files are at:
```
/workspace/aerotech-platform/
```
(Your developer will have these — they need to be on the machine running the deploy.)

---

## Step 2 — Open Terminal (Mac) or Command Prompt (Windows)

On Mac: press **Cmd+Space**, type "Terminal", press Enter.

---

## Step 3 — Run these 3 commands

```bash
# Navigate to the project folder (adjust path if needed)
cd /workspace/aerotech-platform

# Make the script executable (Mac only)
chmod +x FIREBASE_DEPLOY.sh

# Run the deploy
./FIREBASE_DEPLOY.sh
```

**On Windows**, run instead:
```
cd \workspace\aerotech-platform
npm install -g firebase-tools
firebase login
firebase deploy --only hosting --project aerotech-ops
```

---

## What happens
1. Firebase CLI installs (if not already)
2. A browser window opens — **sign in with the Google account that owns aerotech-ops**
3. The script creates 4 hosting sites and deploys all apps automatically
4. At the end it prints the live URLs

---

## After the deploy succeeds

Tell your developer the 5 URLs it printed, then:

1. Go to **console.firebase.google.com/project/aerotech-ops/hosting**
2. Click each site → **Add custom domain**
3. Enter the subdomain (e.g. `app.aerops.com.au`)
4. Firebase will show you DNS records to add in your domain registrar
5. Add those records → SSL activates automatically within ~24 hours

---

## Questions?
Contact: [your contact here]
