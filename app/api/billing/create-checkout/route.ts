import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOrRetrieveCustomer, createCheckoutSession, STRIPE_PLANS } from '@/lib/stripe'

const checkoutSchema = z.object({
  plan: z.enum(['pro', 'enterprise']),
})

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// ─── POST /api/billing/create-checkout ───────────────────────────────────────

export async function POST(request: NextRequest) {
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

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Plano inválido. Use "pro" ou "enterprise".' },
      { status: 400 }
    )
  }

  const { plan } = parsed.data
  const planConfig = STRIPE_PLANS[plan]

  if (!planConfig.priceId) {
    return NextResponse.json(
      { error: `Price ID não configurado para o plano ${plan}` },
      { status: 500 }
    )
  }

  const supabase = createAdminClient()

  // Fetch user email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .eq('id', session.user.id)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }

  try {
    const customerId = await createOrRetrieveCustomer(user.email, user.id)

    const successUrl = `${APP_URL}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`
    const cancelUrl = `${APP_URL}/billing?canceled=true`

    const checkoutUrl = await createCheckoutSession(
      customerId,
      planConfig.priceId,
      successUrl,
      cancelUrl,
      user.id
    )

    return NextResponse.json({ url: checkoutUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    return NextResponse.json(
      { error: `Erro ao criar sessão de checkout: ${message}` },
      { status: 500 }
    )
  }
}
