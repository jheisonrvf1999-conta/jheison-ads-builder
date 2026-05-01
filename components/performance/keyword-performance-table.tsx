'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface KeywordPerfRow {
  id: string
  campaign_id: string
  keyword: string
  estimated_cpc: number
  real_cpc: number | null
  impressions: number | null
  clicks: number | null
  recorded_at: string
}

interface CampaignRow {
  id: string
  product_name: string
}

interface KeywordPerformanceTableProps {
  rows: KeywordPerfRow[]
  campaigns: CampaignRow[]
}

function DeviationIndicator({ estimated, real }: { estimated: number; real: number | null }) {
  if (real == null) return <span className="text-muted-foreground text-xs">–</span>
  const pct = ((real - estimated) / estimated) * 100
  const abs = Math.abs(pct)
  const positive = pct >= 0
  return (
    <span className={cn(
      'flex items-center gap-0.5 text-xs font-medium',
      abs < 1 ? 'text-muted-foreground' : positive ? 'text-red-400' : 'text-green-400'
    )}>
      {abs < 1
        ? <Minus className="h-3 w-3" />
        : positive
        ? <ArrowUpRight className="h-3 w-3" />
        : <ArrowDownRight className="h-3 w-3" />}
      {abs < 1 ? '≈' : `${positive ? '+' : ''}${pct.toFixed(1)}%`}
    </span>
  )
}

const PAGE_SIZE = 15

export function KeywordPerformanceTable({ rows, campaigns }: KeywordPerformanceTableProps) {
  const [page, setPage] = useState(0)
  const [filterCampaign, setFilterCampaign] = useState<string>('all')

  const campaignMap = Object.fromEntries(campaigns.map((c) => [c.id, c.product_name]))

  const filtered = filterCampaign === 'all'
    ? rows
    : rows.filter((r) => r.campaign_id === filterCampaign)

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function formatCpc(val: number | null) {
    return val == null ? '–' : `R$ ${val.toFixed(2)}`
  }

  function formatNumber(val: number | null) {
    if (val == null) return '–'
    return val >= 1000 ? `${(val / 1000).toFixed(1)}k` : String(val)
  }

  function formatDate(d: string) {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true, locale: ptBR }) }
    catch { return '–' }
  }

  return (
    <div className="space-y-3">
      {/* Campaign filter */}
      {campaigns.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filterCampaign === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => { setFilterCampaign('all'); setPage(0) }}
          >
            Todas ({rows.length})
          </Badge>
          {campaigns.map((c) => (
            <Badge
              key={c.id}
              variant={filterCampaign === c.id ? 'default' : 'outline'}
              className="cursor-pointer max-w-[160px] truncate"
              onClick={() => { setFilterCampaign(c.id); setPage(0) }}
            >
              {c.product_name}
            </Badge>
          ))}
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Palavra-chave</TableHead>
              {campaigns.length > 1 && <TableHead>Campanha</TableHead>}
              <TableHead className="text-right">Est.</TableHead>
              <TableHead className="text-right">Real</TableHead>
              <TableHead className="text-right">Δ</TableHead>
              <TableHead className="text-right">Impressões</TableHead>
              <TableHead className="text-right">Cliques</TableHead>
              <TableHead>Registrado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            ) : (
              paged.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs max-w-[160px] truncate" title={row.keyword}>
                    {row.keyword}
                  </TableCell>
                  {campaigns.length > 1 && (
                    <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">
                      {campaignMap[row.campaign_id] ?? '–'}
                    </TableCell>
                  )}
                  <TableCell className="text-right font-mono text-xs">
                    {formatCpc(row.estimated_cpc)}
                  </TableCell>
                  <TableCell className={cn(
                    'text-right font-mono text-xs',
                    row.real_cpc == null && 'text-muted-foreground'
                  )}>
                    {formatCpc(row.real_cpc)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeviationIndicator estimated={row.estimated_cpc} real={row.real_cpc} />
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatNumber(row.impressions)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatNumber(row.clicks)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(row.recorded_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}>Anterior</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </div>
        </div>
      )}
    </div>
  )
}
