# AeroOps — Firebase Deploy (Mac/PC)
# Run these commands one at a time in Terminal

## Step 1 — Install Node.js (if you don't already have it)
Download from: https://nodejs.org  (click the LTS version, install it)
Then close and reopen Terminal.

## Step 2 — Install Firebase CLI
npm install -g firebase-tools

## Step 3 — Login to Firebase
firebase login
# A browser window will open — sign in with the Google account that owns aerotech-ops
# Click Allow, then come back to Terminal

## Step 4 — Create the extra hosting sites (run each line separately)
firebase hosting:sites:create aerops-pilot --project aerotech-ops
firebase hosting:sites:create aerops-mixer --project aerotech-ops
firebase hosting:sites:create aerops-jobs --project aerotech-ops
firebase hosting:sites:create aerops-landing --project aerotech-ops

## Step 5 — Deploy everything
cd /workspace/aerotech-platform
firebase deploy --only hosting --project aerotech-ops

## Step 6 — Tell me when done!
# I'll then give you the DNS records to point aerops.com.au at your new sites.
