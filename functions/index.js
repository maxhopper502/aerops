const functions = require('firebase-functions');
const fetch = require('node-fetch');

/**
 * Xero token exchange proxy — handles CORS-blocked token requests from browser
 * POST /xeroToken with JSON body: { code, clientId, clientSecret, redirectUri, grantType, refreshToken }
 */
exports.xeroToken = functions.https.onRequest(async (req, res) => {
  // CORS headers — only allow our own dashboard
  res.set('Access-Control-Allow-Origin', 'https://app.aerops.com.au');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { code, clientId, clientSecret, redirectUri, grantType, refreshToken, codeVerifier } = req.body;

    if (!clientId || !clientSecret) {
      res.status(400).json({ error: 'clientId and clientSecret required' });
      return;
    }

    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);

    if (grantType === 'refresh_token') {
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', refreshToken);
    } else {
      // authorization_code
      params.set('grant_type', 'authorization_code');
      params.set('code', code);
      params.set('redirect_uri', redirectUri || 'https://app.aerops.com.au/');
      if (codeVerifier) params.set('code_verifier', codeVerifier);
    }

    const response = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();
    res.status(response.status).json(data);

  } catch (err) {
    console.error('xeroToken error:', err);
    res.status(500).json({ error: err.message });
  }
});
