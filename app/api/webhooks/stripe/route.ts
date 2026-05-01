import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent } from '@/lib/stripe'
import {
  sendWelcomeEmail,
  sendPaymentFailedEmail,
} from '@/lib/email'
import type Stripe from 'stripe'

export const dynamic = 'force-dynamic'

async function getUserEmailById(userId: string): Promise<string | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single()
  return data?.email ?? null
}

async function getUserEmailByCustomerId(customerId: string): Promise<{ email: string | null; userId: string | null }> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .limit(1)
    .single()

  if (!data?.user_id) return { email: null, userId: null }

  const email = await getUserEmailById(data.user_id)
  return { email, userId: data.user_id }
}

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Assinatura Stripe ausente' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(rawBody, signature)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Assinatura inválida'
    return NextResponse.json({ error: `Webhook inválido: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  try {
    switch (event.type) {
      // ── checkout.session.completed ──────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        if (!userId) break

        const subscriptionId = session.subscription as string
        const customerId = session.customer as string

        // Fetch subscription details from Stripe to get plan info
        // We upsert with the data we have; plan will be updated by subscription events
        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            plan: 'pro', // default until subscription.updated event refines this
            status: 'active',
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'stripe_subscription_id' }
        )

        // Send welcome email
        const email = await getUserEmailById(userId)
        if (email) {
          await sendWelcomeEmail(email, 'Usuário').catch(() => null)
        }

        await supabase.from('audit_logs').insert({
          user_id: userId,
          action: 'subscription.checkout_completed',
          status: 'success',
          metadata: { subscription_id: subscriptionId, customer_id: customerId },
          created_at: now,
        })
        break
      }

      // ── customer.subscription.created ──────────────────────────────────────
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const plan = resolvePlanFromSubscription(subscription)

        await supabase.from('subscriptions').upsert(
          {
            user_id: userId,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            plan,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: now,
            updated_at: now,
          },
          { onConflict: 'stripe_subscription_id' }
        )
        break
      }

      // ── customer.subscription.updated ──────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const plan = resolvePlanFromSubscription(subscription)

        await supabase
          .from('subscriptions')
          .update({
            plan,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: now,
          })
          .eq('stripe_subscription_id', subscription.id)
        break
      }

      // ── customer.subscription.deleted ──────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { userId } = await getUserEmailByCustomerId(customerId)

        await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: now,
            updated_at: now,
          })
          .eq('stripe_subscription_id', subscription.id)

        // Downgrade user to free plan
        if (userId) {
          await supabase.from('audit_logs').insert({
            user_id: userId,
            action: 'subscription.canceled',
            status: 'success',
            metadata: { subscription_id: subscription.id },
            created_at: now,
          })
        }
        break
      }

      // ── invoice.payment_failed ──────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string

        const { email, userId } = await getUserEmailByCustomerId(customerId)

        // Increment retry count
        const { data: sub } = await supabase
          .from('subscriptions')
          .select('payment_retry_count, plan')
          .eq('stripe_subscription_id', subscriptionId)
          .single()

        const retryCount = ((sub?.payment_retry_count as number) ?? 0) + 1

        await supabase
          .from('subscriptions')
          .update({
            payment_retry_count: retryCount,
            status: 'past_due',
            updated_at: now,
          })
          .eq('stripe_subscription_id', subscriptionId)

        // Send payment failed email
        if (email && sub?.plan) {
          await sendPaymentFailedEmail(email, sub.plan, retryCount).catch(() => null)
        }

        // After 3 failures, cancel subscription
        if (retryCount >= 3 && subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled', canceled_at: now, updated_at: now })
            .eq('stripe_subscription_id', subscriptionId)

          if (userId) {
            await supabase.from('audit_logs').insert({
              user_id: userId,
              action: 'subscription.auto_canceled_payment_failed',
              status: 'success',
              metadata: { subscription_id: subscriptionId, retry_count: retryCount },
              created_at: now,
            })
          }
        }
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido'
    console.error(`[stripe-webhook] error handling ${event.type}:`, message)
    // Return 200 to prevent Stripe retries for handler bugs
    return NextResponse.json({ received: true, warning: message })
  }

  return NextResponse.json({ received: true })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePlanFromSubscription(subscription: Stripe.Subscription): string {
  const proPriceId = process.env.STRIPE_PRO_PRICE_ID
  const enterprisePriceId = process.env.STRIPE_ENTERPRISE_PRICE_ID

  for (const item of subscription.items.data) {
    if (enterprisePriceId && item.price.id === enterprisePriceId) return 'enterprise'
    if (proPriceId && item.price.id === proPriceId) return 'pro'
  }

  return 'pro'
}
