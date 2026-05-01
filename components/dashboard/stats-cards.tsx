'use client'

import { Megaphone, FileEdit, CheckCircle2, Zap } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats?: DashboardStats | null
  loading?: boolean
}

interface StatCard {
  label: string
  value: string | number
  icon: React.ElementType
  iconColor: string
  iconBg: string
  badge?: string
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

function buildCards(stats: DashboardStats): StatCard[] {
  const usagePercent =
    stats.campaignsLimit > 0
      ? Math.round((stats.campaignsUsed / stats.campaignsLimit) * 100)
      : 0

  return [
    {
      label: 'Total de Campanhas',
      value: stats.totalCampaigns,
      icon: Megaphone,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-500/10',
    },
    {
      label: 'Rascunhos',
      value: stats.draftCampaigns,
      icon: FileEdit,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-500/10',
    },
    {
      label: 'Ativas / Exportadas',
      value: stats.activeCampaigns + stats.exportedCampaigns,
      icon: CheckCircle2,
      iconColor: 'text-green-400',
      iconBg: 'bg-green-500/10',
    },
    {
      label: 'Plano Atual',
      value: stats.planName,
      icon: Zap,
      iconColor: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      badge: `${stats.campaignsUsed}/${stats.campaignsLimit < 0 ? '∞' : stats.campaignsLimit} campanhas`,
      badgeVariant: usagePercent >= 90 ? 'destructive' : 'secondary',
    },
  ]
}

function CardSkeleton() {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="mt-4 space-y-1.5">
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
      </CardContent>
    </Card>
  )
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    )
  }

  const cards = buildCards(stats)

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon
        return (
          <Card key={card.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', card.iconBg)}>
                  <Icon className={cn('h-5 w-5', card.iconColor)} />
                </div>
                {card.badge && (
                  <Badge variant={card.badgeVariant ?? 'secondary'} className="text-xs">
                    {card.badge}
                  </Badge>
                )}
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
