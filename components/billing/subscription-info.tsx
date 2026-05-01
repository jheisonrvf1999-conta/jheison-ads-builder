'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Loader2, ExternalLink, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG = {
  active:    { label: 'Ativa',           className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  trialing:  { label: 'Trial',           className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  past_due:  { label: 'Pagamento pendente', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  canceled:  { label: 'Cancelada',       className: 'bg-red-500/10 text-red-400 border-red-500/20' },
} as const

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', pro: 'Pro', enterprise: 'Enterprise',
}

interface SubscriptionInfoProps {
  plan: string
  status: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  hasStripeId: boolean
}

export function SubscriptionInfo({ plan, status, currentPeriodEnd, canceledAt, hasStripeId }: SubscriptionInfoProps) {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao abrir portal.'); return }
      window.location.href = json.url
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = STATUS_CONFIG[(status as keyof typeof STATUS_CONFIG) ?? 'active'] ?? STATUS_CONFIG.active

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '–'
    try { return format(new Date(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR }) }
    catch { return '–' }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl font-bold text-foreground">{PLAN_LABELS[plan] ?? plan}</span>
              <Badge variant="outline" className={statusConfig.className}>{statusConfig.label}</Badge>
            </div>

            {currentPeriodEnd && status !== 'canceled' && (
              <p className="text-sm text-muted-foreground">
                Próxima renovação: <span className="text-foreground">{formatDate(currentPeriodEnd)}</span>
              </p>
            )}

            {status === 'canceled' && canceledAt && (
              <p className="text-sm text-muted-foreground">
                Cancelada em: <span className="text-foreground">{formatDate(canceledAt)}</span>
              </p>
            )}

            {currentPeriodEnd && status === 'canceled' && (
              <p className="text-sm text-yellow-400">
                Acesso ativo até: {formatDate(currentPeriodEnd)}
              </p>
            )}

            {status === 'past_due' && (
              <div className="flex items-center gap-1.5 text-sm text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Pagamento pendente — atualize seu método de pagamento.
              </div>
            )}
          </div>

          {hasStripeId && (
            <Button variant="outline" size="sm" onClick={openPortal} disabled={loading}
              className="shrink-0">
              {loading
                ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                : <ExternalLink className="mr-2 h-3.5 w-3.5" />}
              Gerenciar assinatura
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
