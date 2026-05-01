import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório').max(100).optional(),
  email: z.string().email('Email inválido').optional(),
})

// ─── GET /api/user ────────────────────────────────────────────────────────────

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, two_fa_enabled, google_ads_connected, created_at, updated_at')
    .eq('id', session.user.id)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  return NextResponse.json({ data: user })
}

// ─── PUT /api/user ────────────────────────────────────────────────────────────

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = updateUserSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {}

  if (parsed.data.name !== undefined) {
    updates.name = parsed.data.name
  }

  if (parsed.data.email !== undefined) {
    const newEmail = parsed.data.email.toLowerCase()

    // Uniqueness check
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', newEmail)
      .neq('id', session.user.id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 })
    }

    updates.email = newEmail
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from('users')
    .update(updates)
    .eq('id', session.user.id)
    .select('id, email, name, two_fa_enabled, google_ads_connected, created_at, updated_at')
    .single()

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar perfil' }, { status: 500 })
  }

  return NextResponse.json({ data: updated, message: 'Perfil atualizado com sucesso' })
}
