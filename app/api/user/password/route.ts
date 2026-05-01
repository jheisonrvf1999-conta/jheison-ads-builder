import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual obrigatória'),
  newPassword: z
    .string()
    .min(12, 'A nova senha deve ter pelo menos 12 caracteres'),
})

// ─── PUT /api/user/password ───────────────────────────────────────────────────

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

  const parsed = passwordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { currentPassword, newPassword } = parsed.data
  const supabase = createAdminClient()

  // Fetch current password hash
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('id, email, password_hash')
    .eq('id', session.user.id)
    .single()

  if (fetchError || !user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password_hash)
  if (!isValid) {
    return NextResponse.json({ error: 'Senha atual incorreta' }, { status: 400 })
  }

  // Hash new password
  const newHash = await bcrypt.hash(newPassword, 10)
  const now = new Date().toISOString()

  const { error: updateError } = await supabase
    .from('users')
    .update({ password_hash: newHash, updated_at: now })
    .eq('id', session.user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Erro ao atualizar senha' }, { status: 500 })
  }

  // Audit log
  await supabase.from('audit_logs').insert({
    user_id: session.user.id,
    action: 'user.password_changed',
    status: 'success',
    metadata: { email: user.email },
    created_at: now,
  })

  return NextResponse.json({ message: 'Senha atualizada com sucesso' })
}
