import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import { PlanCards } from '@/components/billing/plan-cards'
import { SubscriptionInfo } from '@/components/billing/subscription-info'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Planos' }

export default async function BillingPage({
  searchParams,
}: {
  searchParams: { success?: string; canceled?: string; session_id?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = createAdminClient()

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan, status, current_period_end, canceled_at, stripe_subscription_id, stripe_customer_id')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const currentPlan = subscription?.plan ?? 'free'
  const subStatus = subscription?.status ?? null

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Checkout feedback banners */}
      {searchParams.success === 'true' && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Assinatura ativada com sucesso! Seus benefícios já estão disponíveis.
        </div>
      )}
      {searchParams.canceled === 'true' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 text-sm text-yellow-400">
          Checkout cancelado. Seu plano atual permanece ativo.
        </div>
      )}

      {/* Current subscription info */}
      {subscription && subscription.plan !== 'free' && (
        <section>
          <h3 className="text-base font-semibold text-foreground">Assinatura Atual</h3>
          <Separator className="mt-3 mb-5" />
          <SubscriptionInfo
            plan={currentPlan}
            status={subStatus}
            currentPeriodEnd={subscription.current_period_end ?? null}
            canceledAt={subscription.canceled_at ?? null}
            hasStripeId={!!subscription.stripe_customer_id}
          />
        </section>
      )}

      {/* Plan cards */}
      <section>
        <h3 className="text-base font-semibold text-foreground">Planos disponíveis</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Escolha o plano ideal para o seu volume de campanhas.
        </p>
        <Separator className="mt-3 mb-5" />
        <PlanCards currentPlan={currentPlan} />
      </section>
    </div>
  )
}
