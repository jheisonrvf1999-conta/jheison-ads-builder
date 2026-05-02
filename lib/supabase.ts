import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Support both legacy (eyJ...) and new (sb_publishable_...) anon key formats
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Missing Supabase environment variables')
  return createSupabaseClient(url, anon, { auth: { persistSession: false } })
}

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Missing Supabase environment variables')
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type SupabaseClient = ReturnType<typeof createClient>
export type SupabaseAdminClient = ReturnType<typeof createAdminClient>
