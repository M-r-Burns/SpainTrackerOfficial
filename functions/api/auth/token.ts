interface Env {
  VITE_GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_CLIENT_SECRET?: string
}

interface TokenRequest {
  action: 'exchange' | 'refresh'
  code?: string
  refreshToken?: string
  codeVerifier?: string
  redirectUri?: string
}

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const clientId = env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || ''
  const clientSecret = env.GOOGLE_CLIENT_SECRET || ''

  if (!clientId || !clientSecret) {
    return jsonResponse({ error: 'server_misconfigured', message: 'Missing Google OAuth server configuration' }, 500)
  }

  let payload: TokenRequest
  try {
    payload = (await request.json()) as TokenRequest
  } catch {
    return jsonResponse({ error: 'invalid_request', message: 'Invalid JSON payload' }, 400)
  }

  const redirectUri = payload.redirectUri || `${new URL(request.url).origin}/`
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })

  if (payload.action === 'exchange') {
    if (!payload.code) return jsonResponse({ error: 'invalid_request', message: 'Missing authorization code' }, 400)
    body.set('grant_type', 'authorization_code')
    body.set('code', payload.code)
    if (payload.codeVerifier) body.set('code_verifier', payload.codeVerifier)
  } else if (payload.action === 'refresh') {
    if (!payload.refreshToken) return jsonResponse({ error: 'invalid_request', message: 'Missing refresh token' }, 400)
    body.set('grant_type', 'refresh_token')
    body.set('refresh_token', payload.refreshToken)
  } else {
    return jsonResponse({ error: 'invalid_request', message: 'Unknown action' }, 400)
  }

  const tokenRes = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await tokenRes.json()
  if (!tokenRes.ok) {
    return jsonResponse(data, tokenRes.status)
  }

  return jsonResponse(data)
}
