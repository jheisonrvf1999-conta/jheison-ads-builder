import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('users')
    .update({
      google_oauth_token: null,
      google_ads_connected: false,
      updated_at: now,
    })
    .eq('id', session.user.id)

  if (error) {
    return NextResponse.json({ error: 'Erro ao desconectar conta Google Ads' }, { status: 500 })
  }

  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    action: 'google_ads.disconnected',
    status: 'success',
    created_at: now,
  })

  return NextResponse.json({ success: true })
}
