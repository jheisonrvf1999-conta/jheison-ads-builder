import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase'

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 })
    }

    const { name, email, password } = parsed.data
    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Este email já está em uso.' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { error } = await supabase.from('users').insert({
      name,
      email: email.toLowerCase(),
      password_hash,
    })

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: 'Erro ao criar conta. Tente novamente.' }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
