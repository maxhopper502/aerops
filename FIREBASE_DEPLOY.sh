#!/bin/bash
# AeroOps — Firebase Deploy Script
# Run this script once on any Mac/PC with Node.js installed.
# It will: install Firebase CLI, log you in, create hosting sites, and deploy everything.

set -e

echo "================================================"
echo "  AeroOps — Firebase Hosting Setup & Deploy"
echo "================================================"
echo ""

# 1. Install Firebase CLI if not present
if ! command -v firebase &> /dev/null; then
  echo "Installing Firebase CLI..."
  npm install -g firebase-tools
fi

echo "Firebase CLI version: $(firebase --version)"
echo ""

# 2. Login to Firebase (opens browser)
echo "Step 1: Logging into Firebase..."
echo "A browser window will open — sign in with the Google account that owns the aerotech-ops Firebase project."
echo ""
firebase login

# 3. Navigate to project
cd "$(dirname "$0")"
echo ""
echo "Step 2: Creating Firebase Hosting sites..."

# Create the additional hosting sites (the default aerotech-ops site already exists)
firebase hosting:sites:create aerops-pilot --project aerotech-ops || echo "aerops-pilot may already exist, continuing..."
firebase hosting:sites:create aerops-mixer --project aerotech-ops || echo "aerops-mixer may already exist, continuing..."
firebase hosting:sites:create aerops-jobs --project aerotech-ops || echo "aerops-jobs may already exist, continuing..."
firebase hosting:sites:create aerops-landing --project aerotech-ops || echo "aerops-landing may already exist, continuing..."

echo ""
echo "Step 3: Running PREDEPLOY for Pilot PWA..."
python3 pilot-pwa/PREDEPLOY.py

echo ""
echo "Step 4: Deploying all sites to Firebase Hosting..."
firebase deploy --only hosting --project aerotech-ops

echo ""
echo "================================================"
echo "  ✅ DEPLOY COMPLETE!"
echo "================================================"
echo ""
echo "Your apps are now live at:"
echo "  Dashboard:   https://aerotech-ops.web.app"
echo "  Pilot PWA:   https://aerops-pilot.web.app"
echo "  Mixer PWA:   https://aerops-mixer.web.app"
echo "  Client Form: https://aerops-jobs.web.app"
echo "  Landing:     https://aerops-landing.web.app"
echo ""
echo "Next: Add custom domain DNS records in Firebase Console"
echo "  https://console.firebase.google.com/project/aerotech-ops/hosting"
echo ""
