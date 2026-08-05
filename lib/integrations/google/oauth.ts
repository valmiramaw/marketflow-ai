import { prisma } from '@/lib/prisma'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

// Alle benötigten Scopes in einem Flow
const SCOPES = [
  'https://www.googleapis.com/auth/webmasters.readonly',     // Search Console
  'https://www.googleapis.com/auth/analytics.readonly',       // GA4
  'https://www.googleapis.com/auth/adwords',                  // Google Ads (Phase 4)
  'openid',
  'email',
  'profile',
]

export function getGoogleAuthUrl(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`

  if (!clientId) throw new Error('GOOGLE_CLIENT_ID nicht konfiguriert')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state: 'google_oauth',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/integrations/google/callback`

  if (!clientId || !clientSecret) throw new Error('Google OAuth nicht konfiguriert')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Token-Exchange fehlgeschlagen: ${error}`)
  }

  return res.json() as Promise<{
    access_token: string
    refresh_token: string
    expires_in: number
    token_type: string
    scope: string
  }>
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) throw new Error('Google OAuth nicht konfiguriert')

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) throw new Error('Token-Refresh fehlgeschlagen')

  const data = await res.json()
  return data.access_token
}

export async function getGoogleAccessToken(): Promise<string | null> {
  const token = await prisma.oAuthToken.findFirst({
    where: { provider: 'google' },
    orderBy: { updatedAt: 'desc' },
  })

  if (!token) return null

  // Prüfen ob Token abgelaufen
  if (token.expiresAt < new Date()) {
    if (!token.refreshToken) return null

    try {
      const newAccessToken = await refreshAccessToken(token.refreshToken)
      await prisma.oAuthToken.update({
        where: { id: token.id },
        data: {
          accessToken: newAccessToken,
          expiresAt: new Date(Date.now() + 3600 * 1000),
        },
      })
      return newAccessToken
    } catch {
      return null
    }
  }

  return token.accessToken
}

export async function getGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return null
  return res.json() as Promise<{ id: string; email: string; name: string }>
}
