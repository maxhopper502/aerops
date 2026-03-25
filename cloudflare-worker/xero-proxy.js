addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://app.aerops.com.au',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { grantType, code, clientId, clientSecret, redirectUri, refreshToken, codeVerifier } = body;

    const params = new URLSearchParams();
    params.set('client_id', clientId);
    params.set('client_secret', clientSecret);

    if (grantType === 'refresh_token') {
      params.set('grant_type', 'refresh_token');
      params.set('refresh_token', refreshToken);
    } else {
      params.set('grant_type', 'authorization_code');
      params.set('code', code);
      params.set('redirect_uri', redirectUri || 'https://app.aerops.com.au/');
      if (codeVerifier) params.set('code_verifier', codeVerifier);
    }

    const xeroResp = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    const data = await xeroResp.json();
    return new Response(JSON.stringify(data), {
      status: xeroResp.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
