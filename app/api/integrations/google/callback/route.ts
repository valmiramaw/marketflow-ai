import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens, getGoogleUserInfo } from '@/lib/integrations/google/oauth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=Kein%20Auth-Code', request.url)
    )
  }

  try {
    const tokens = await exchangeCodeForTokens(code)
    const userInfo = await getGoogleUserInfo(tokens.access_token)

    // Token in DB speichern (oder aktualisieren)
    await prisma.oAuthToken.upsert({
      where: {
        provider_accountId: {
          provider: 'google',
          accountId: userInfo?.id || 'default',
        },
      },
      create: {
        provider: 'google',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope.split(' '),
        accountId: userInfo?.id || 'default',
        accountName: userInfo?.email || 'Google Account',
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || undefined,
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        scopes: tokens.scope.split(' '),
        accountName: userInfo?.email || 'Google Account',
      },
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_connected', request.url)
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Fehler'
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=${encodeURIComponent(message)}`, request.url)
    )
  }
}
