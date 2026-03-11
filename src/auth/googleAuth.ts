const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const REDIRECT_URI = `${window.location.origin}/`
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

function base64URLEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let str = ''
  bytes.forEach(b => (str += String.fromCharCode(b)))
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function generateCodeVerifier(): Promise<string> {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return base64URLEncode(array.buffer)
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return base64URLEncode(digest)
}

export async function startOAuthFlow(): Promise<void> {
  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = base64URLEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)

  localStorage.setItem('pkce_verifier', verifier)
  localStorage.setItem('pkce_state', state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  window.location.href = `${AUTH_ENDPOINT}?${params}`
}

export async function handleOAuthCallback(code: string, state: string): Promise<string> {
  const storedState = localStorage.getItem('pkce_state')
  const verifier = localStorage.getItem('pkce_verifier')

  if (state !== storedState) throw new Error('OAuth state mismatch')
  if (!verifier) throw new Error('No PKCE verifier found')

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
  })

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token exchange failed: ${err}`)
  }

  const data = await res.json()
  localStorage.removeItem('pkce_verifier')
  localStorage.removeItem('pkce_state')

  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token)
  }

  return data.access_token as string
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  })

  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.access_token as string
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('pkce_verifier')
  localStorage.removeItem('pkce_state')
}
