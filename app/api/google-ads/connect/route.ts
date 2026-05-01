import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/userinfo.email',
]

// ─── GET /api/google-ads/connect ──────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    return NextResponse.json(
      { error: 'Google OAuth não configurado (GOOGLE_CLIENT_ID / GOOGLE_REDIRECT_URI)' },
      { status: 500 }
    )
  }

  // Encode userId as state for CSRF protection and user identification in callback
  const state = Buffer.from(session.user.id).toString('base64')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return NextResponse.redirect(`${GOOGLE_OAUTH_URL}?${params.toString()}`)
}
