'use client'

import { ArrowUpRight, ArrowDownRight, Minus, RefreshCw, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CampaignRow {
  id: string
  product_name: string
  estimated_cpc: number | null
  real_cpc: number | null
  cpc_deviation: number | null
  sync_status: string | null
  last_sync_at: string | null
  status: string
  created_at: string
}

interface CpcComparisonTableProps {
  campaigns: CampaignRow[]
}

function DeviationCell({ estimated, real, deviation }: {
  estimated: number | null
  real: number | null
  deviation: number | null
}) {
  if (estimated == null) return <span className="text-muted-foreground text-sm">–</span>
  if (real == null) {
    return (
      <span className="text-xs text-muted-foreground italic">Aguardando sync</span>
    )
  }

  const pct = deviation != null ? deviation * 100 : ((real - estimated) / estimated) * 100
  const abs = Math.abs(pct)
  const positive = pct >= 0 // positive = real higher than estimated (bad)

  return (
    <div className={cn(
      'flex items-center gap-1 text-sm font-medium',
      positive ? 'text-red-400' : 'text-green-400'
    )}>
      {abs < 1
        ? <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        : positive
        ? <ArrowUpRight className="h-3.5 w-3.5" />
        : <ArrowDownRight className="h-3.5 w-3.5" />}
      {abs < 1 ? '≈0%' : `${positive ? '+' : ''}${pct.toFixed(1)}%`}
    </div>
  )
}

function SyncBadge({ status }: { status: string | null }) {
  if (!status) return <Badge variant="outline" className="text-xs text-muted-foreground">Não sincronizado</Badge>
  const config = {
    synced:  { label: 'Sincronizado', className: 'border-green-500/30 bg-green-500/10 text-green-400' },
    diverged: { label: 'Divergência',  className: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-400' },
    pending:  { label: 'Pendente',     className: 'border-blue-500/30 bg-blue-500/10 text-blue-400' },
  }[status] ?? { label: status, className: '' }
  return <Badge variant="outline" className={cn('text-xs', config.className)}>{config.label}</Badge>
}

function formatCpc(val: number | null): string {
  if (val == null) return '–'
  return `R$ ${val.toFixed(2)}`
}

export function CpcComparisonTable({ campaigns }: CpcComparisonTableProps) {
  if (campaigns.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Campanha</TableHead>
            <TableHead className="text-right">CPC Estimado</TableHead>
            <TableHead className="text-right">CPC Real</TableHead>
            <TableHead className="text-right">Variação</TableHead>
            <TableHead>Sync</TableHead>
            <TableHead className="w-16" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((c) => (
            <TableRow key={c.id}>
              <TableCell className="font-medium max-w-[180px] truncate" title={c.product_name}>
                {c.product_name}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatCpc(c.estimated_cpc)}
              </TableCell>
              <TableCell className={cn(
                'text-right font-mono text-sm',
                c.real_cpc == null && 'text-muted-foreground'
              )}>
                {formatCpc(c.real_cpc)}
              </TableCell>
              <TableCell className="text-right">
                <DeviationCell
                  estimated={c.estimated_cpc}
                  real={c.real_cpc}
                  deviation={c.cpc_deviation}
                />
              </TableCell>
              <TableCell>
                <SyncBadge status={c.sync_status} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={`/campaigns/${c.id}`}>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  {c.sync_status !== 'synced' && (
                    <form action={`/api/google-ads/sync/${c.id}`} method="POST">
                      <Button type="submit" variant="ghost" size="icon" className="h-7 w-7"
                        title="Sincronizar agora">
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </form>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
