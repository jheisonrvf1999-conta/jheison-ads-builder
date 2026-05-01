'use client'

import { TrendingUp, TrendingDown, BarChart2, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface Summary {
  totalTracked: number
  withRealCpc: number
  avgCpcDeviation: number | null
}

interface CpcSummaryCardsProps {
  summary: Summary
}

export function CpcSummaryCards({ summary }: CpcSummaryCardsProps) {
  const coveragePct =
    summary.totalTracked > 0
      ? Math.round((summary.withRealCpc / summary.totalTracked) * 100)
      : 0

  const deviation = summary.avgCpcDeviation
  const deviationLabel =
    deviation === null
      ? '–'
      : `${deviation > 0 ? '+' : ''}${deviation.toFixed(1)}%`

  const deviationPositive = deviation !== null && deviation <= 0 // negative deviation = real < estimated = good

  const cards = [
    {
      label: 'Campanhas Monitoradas',
      value: summary.totalTracked,
      icon: BarChart2,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
    },
    {
      label: 'Com CPC Real',
      value: `${summary.withRealCpc} (${coveragePct}%)`,
      icon: Target,
      iconColor: 'text-blue-400',
      iconBg: 'bg-blue-500/10',
    },
    {
      label: 'Desvio Médio CPC',
      value: deviationLabel,
      icon: deviation !== null && deviation <= 0 ? TrendingDown : TrendingUp,
      iconColor: deviationPositive ? 'text-green-400' : 'text-yellow-400',
      iconBg: deviationPositive ? 'bg-green-500/10' : 'bg-yellow-500/10',
      hint:
        deviation === null
          ? undefined
          : deviation <= 0
          ? 'Real abaixo do estimado — suas estimativas estão conservadoras'
          : 'Real acima do estimado — revise suas estimativas de lance',
    },
    {
      label: 'Precisão das Estimativas',
      value: deviation === null ? '–' : `${Math.max(0, 100 - Math.abs(deviation)).toFixed(0)}%`,
      icon: TrendingUp,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      hint: 'Quão próximas as estimativas estão da realidade',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} title={card.hint}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', card.iconBg)}>
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl font-bold text-foreground leading-tight">{card.value}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{card.label}</p>
                  {card.hint && (
                    <p className="text-xs text-muted-foreground/70 mt-1 leading-snug">{card.hint}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
