#!/bin/bash
# AeroTech Portal Deploy Script
# Run: bash deploy.sh

set -e

PROJECT="aerotech-ops"

echo "🔧 Installing Firebase CLI..."
npm install -g firebase-tools

echo ""
echo "📦 Deploying Client Portal (aerotech-clients)..."
cd client-portal && firebase deploy --project $PROJECT --site aerotech-clients && cd ..

echo ""
echo "📦 Deploying Admin Portal (aerotech-admin)..."
cd admin-portal && firebase deploy --project $PROJECT --site aerotech-admin && cd ..

echo ""
echo "📦 Deploying Agronomist Portal (aerotech-agro)..."
cd agronomist-portal && firebase deploy --project $PROJECT --site aerotech-agro && cd ..

echo ""
echo "✅ All three portals deployed!"
echo "Client:    https://clients.aerotech.com.au"
echo "Admin:     https://admin.aerotech.com.au"
echo "Agronomist: https://aero-agro.com.au"