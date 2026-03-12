import { getRuntimeConfig } from '../config/runtimeConfig'

const REDIRECT_URI = `${window.location.origin}/`
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

interface TokenRequest {
  action: 'exchange' | 'refresh'
  code?: string
  refreshToken?: string
  codeVerifier?: string
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  error?: string
  error_description?: string
}

interface OAuthFlowOptions {
  prompt?: 'consent' | 'none'
  accessType?: 'offline' | 'online'
}

async function requestTokenDirect(payload: TokenRequest): Promise<TokenResponse> {
  const { googleClientId } = await getRuntimeConfig()
  if (!googleClientId) throw new Error('Missing Google Client ID configuration')

  const body = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: REDIRECT_URI,
  })

  if (payload.action === 'exchange') {
    if (!payload.code || !payload.codeVerifier) throw new Error('Missing authorization code parameters')
    body.set('grant_type', 'authorization_code')
    body.set('code', payload.code)
    body.set('code_verifier', payload.codeVerifier)
  } else {
    if (!payload.refreshToken) throw new Error('Missing refresh token')
    body.set('grant_type', 'refresh_token')
    body.set('refresh_token', payload.refreshToken)
  }

  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = (await res.json()) as TokenResponse
  if (!res.ok) throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)
  return data
}

async function requestToken(payload: TokenRequest): Promise<TokenResponse> {
  try {
    const res = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, redirectUri: REDIRECT_URI }),
    })

    const data = (await res.json()) as TokenResponse
    if (res.ok) return data

    if (res.status === 404 || res.status === 405) {
      return requestTokenDirect(payload)
    }

    throw new Error(`Token exchange failed: ${JSON.stringify(data)}`)
  } catch (e) {
    // local dev fallback only when the Pages Function route is unavailable
    if (e instanceof TypeError || (e instanceof Error && /Failed to fetch/i.test(e.message))) {
      return requestTokenDirect(payload)
    }

    if (e instanceof Error) throw e
    return requestTokenDirect(payload)
  }
}

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

export async function startOAuthFlow(options?: OAuthFlowOptions): Promise<void> {
  const { googleClientId } = await getRuntimeConfig()
  if (!googleClientId) throw new Error('Missing Google Client ID configuration')

  const verifier = await generateCodeVerifier()
  const challenge = await generateCodeChallenge(verifier)
  const state = base64URLEncode(crypto.getRandomValues(new Uint8Array(16)).buffer)

  localStorage.removeItem('manual_logout')

  localStorage.setItem('pkce_verifier', verifier)
  localStorage.setItem('pkce_state', state)

  const params = new URLSearchParams({
    client_id: googleClientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
    access_type: options?.accessType ?? 'offline',
    prompt: options?.prompt ?? 'consent',
  })

  window.location.href = `${AUTH_ENDPOINT}?${params}`
}

export async function startSilentOAuthFlow(): Promise<void> {
  return startOAuthFlow({ prompt: 'none', accessType: 'online' })
}

export async function handleOAuthCallback(code: string, state: string): Promise<string> {
  const storedState = localStorage.getItem('pkce_state')
  const verifier = localStorage.getItem('pkce_verifier')

  if (state !== storedState) throw new Error('OAuth state mismatch')
  if (!verifier) throw new Error('No PKCE verifier found')

  const data = await requestToken({
    action: 'exchange',
    code,
    codeVerifier: verifier,
  })

  localStorage.removeItem('pkce_verifier')
  localStorage.removeItem('pkce_state')

  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token)
  }
  localStorage.setItem('ever_authenticated', '1')

  return data.access_token as string
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refresh_token')
  if (!refreshToken) return null

  try {
    const data = await requestToken({
      action: 'refresh',
      refreshToken,
    })
    localStorage.setItem('ever_authenticated', '1')
    return (data.access_token as string) || null
  } catch {
    return null
  }
}

export function logout(): void {
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('pkce_verifier')
  localStorage.removeItem('pkce_state')
  localStorage.removeItem('ever_authenticated')
  localStorage.setItem('manual_logout', '1')
  sessionStorage.removeItem('silent_oauth_attempted')
}
