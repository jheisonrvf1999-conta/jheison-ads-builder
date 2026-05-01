import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { encryptToken } from '@/lib/encryption'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

interface GoogleTokenResponse {
  access_token: string
  refresh_token?: string
  token_type: string
  expires_in: number
  scope: string
}

// ─── GET /api/google-ads/callback ─────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const errorParam = searchParams.get('error')

  if (errorParam) {
    return NextResponse.redirect(`${APP_URL}/settings?error=${encodeURIComponent(errorParam)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${APP_URL}/settings?error=missing_code_or_state`)
  }

  // Decode userId from state
  let userId: string
  try {
    userId = Buffer.from(state, 'base64').toString('utf-8')
    if (!userId) throw new Error('Empty userId')
  } catch {
    return NextResponse.redirect(`${APP_URL}/settings?error=invalid_state`)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !clientSecret || !redirectUri) {
    return NextResponse.redirect(`${APP_URL}/settings?error=oauth_not_configured`)
  }

  // Exchange authorization code for tokens
  let tokens: GoogleTokenResponse
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
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

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('[google-ads/callback] token exchange failed:', errorBody)
      return NextResponse.redirect(`${APP_URL}/settings?error=token_exchange_failed`)
    }

    tokens = (await response.json()) as GoogleTokenResponse
  } catch (err) {
    console.error('[google-ads/callback] fetch error:', err)
    return NextResponse.redirect(`${APP_URL}/settings?error=token_exchange_error`)
  }

  // Encrypt tokens before storing
  const encryptedAccessToken = encryptToken(tokens.access_token)
  const encryptedRefreshToken = tokens.refresh_token ? encryptToken(tokens.refresh_token) : null

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('users')
    .update({
      google_oauth_token: JSON.stringify({
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_in: tokens.expires_in,
        token_type: tokens.token_type,
        scope: tokens.scope,
        obtained_at: now,
      }),
      google_ads_connected: true,
      updated_at: now,
    })
    .eq('id', userId)

  if (updateError) {
    console.error('[google-ads/callback] failed to save tokens:', updateError.message)
    return NextResponse.redirect(`${APP_URL}/settings?error=save_token_failed`)
  }

  return NextResponse.redirect(`${APP_URL}/settings?connected=true`)
}
