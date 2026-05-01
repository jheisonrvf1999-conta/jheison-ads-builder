'use client'

import { useState } from 'react'
import { Check, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Plan {
  key: string
  name: string
  price: number
  description: string
  campaigns: string
  features: string[]
  highlighted: boolean
  cta: string
}

const PLANS: Plan[] = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    description: 'Para testar a plataforma',
    campaigns: '5 campanhas/mês',
    features: [
      'Análise de páginas de vendas',
      'Geração de palavras-chave',
      'Exportação CSV',
      'Verificador de conformidade',
    ],
    highlighted: false,
    cta: 'Plano atual',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 97,
    description: 'Para afiliados ativos',
    campaigns: '50 campanhas/mês',
    features: [
      'Tudo do Free',
      'Criação via Google Ads API',
      'Performance tracking (CPC estimado vs real)',
      'UTMs automáticos',
      'Templates avançados',
      'Suporte por e-mail',
    ],
    highlighted: true,
    cta: 'Assinar Pro',
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 297,
    description: 'Para escala máxima',
    campaigns: 'Ilimitado',
    features: [
      'Tudo do Pro',
      'Webhooks bidirecionais',
      'Insights com IA',
      'Sincronização automática',
      'Suporte prioritário',
      'SLA garantido',
    ],
    highlighted: false,
    cta: 'Assinar Enterprise',
  },
]

interface PlanCardsProps {
  currentPlan: string
}

export function PlanCards({ currentPlan }: PlanCardsProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  async function handleCheckout(planKey: string) {
    if (planKey === 'free') return
    if (planKey === currentPlan) {
      // Open Stripe portal to manage existing subscription
      setLoadingPlan(planKey)
      try {
        const res = await fetch('/api/billing/portal', { method: 'POST' })
        const json = await res.json()
        if (!res.ok) { toast.error(json.error ?? 'Erro ao abrir portal.'); return }
        window.location.href = json.url
      } catch {
        toast.error('Erro de conexão.')
      } finally {
        setLoadingPlan(null)
      }
      return
    }

    setLoadingPlan(planKey)
    try {
      const res = await fetch('/api/billing/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao criar checkout.'); return }
      window.location.href = json.url
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {PLANS.map((plan) => {
        const isCurrent = plan.key === currentPlan
        const isLoading = loadingPlan === plan.key

        return (
          <Card
            key={plan.key}
            className={cn(
              'relative flex flex-col',
              plan.highlighted && 'border-indigo-500 shadow-lg shadow-indigo-500/10',
              isCurrent && !plan.highlighted && 'border-green-500/40'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-indigo-600 text-white border-transparent px-3">
                  <Zap className="mr-1 h-3 w-3" />
                  Mais popular
                </Badge>
              </div>
            )}
            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-600 text-white border-transparent">
                  Plano atual
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4 pt-6">
              <div className="space-y-1">
                <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              </div>
              <div className="mt-3 flex items-baseline gap-1">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-foreground">Grátis</span>
                ) : (
                  <>
                    <span className="text-sm text-muted-foreground">R$</span>
                    <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">/mês</span>
                  </>
                )}
              </div>
              <p className="text-xs text-indigo-400 font-medium mt-1">{plan.campaigns}</p>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 pt-0">
              <ul className="flex-1 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-400 shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={cn(
                  'w-full mt-2',
                  plan.highlighted ? '' : 'variant-outline',
                  isCurrent && plan.key !== 'free' && 'bg-green-600 hover:bg-green-700'
                )}
                variant={plan.highlighted ? 'default' : 'outline'}
                disabled={plan.key === 'free' && isCurrent || isLoading}
                onClick={() => handleCheckout(plan.key)}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {isCurrent && plan.key !== 'free' ? 'Gerenciar assinatura' : plan.cta}
              </Button>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
