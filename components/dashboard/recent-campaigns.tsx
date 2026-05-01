'use client'

import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ExternalLink, FileEdit } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { CampaignSummary } from '@/types'

interface RecentCampaignsProps {
  campaigns?: CampaignSummary[]
  loading?: boolean
}

const STATUS_CONFIG = {
  draft: { label: 'Rascunho', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  active: { label: 'Ativa', className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  exported: { label: 'Exportada', className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  synced: { label: 'Sincronizada', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
} as const

const CATEGORY_LABELS: Record<string, string> = {
  suplemento: 'Suplemento',
  software: 'Software',
  curso: 'Curso',
  ecommerce: 'E-commerce',
  servico: 'Serviço',
  ebook: 'E-book',
  consultoria: 'Consultoria',
  outro: 'Outro',
}

function RowSkeleton() {
  return (
    <TableRow>
      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
      <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
      <TableCell><Skeleton className="h-8 w-20" /></TableCell>
    </TableRow>
  )
}

function formatRelativeDate(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR })
  } catch {
    return '-'
  }
}

export function RecentCampaigns({ campaigns, loading }: RecentCampaignsProps) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Campanha</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Palavras-chave</TableHead>
            <TableHead>Criada</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)
          ) : !campaigns || campaigns.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                Nenhuma campanha criada ainda.{' '}
                <Link href="/campaigns/new" className="text-indigo-400 hover:underline">
                  Criar primeira campanha
                </Link>
              </TableCell>
            </TableRow>
          ) : (
            campaigns.map((campaign) => {
              const status = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft
              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium max-w-[200px] truncate" title={campaign.productName}>
                    {campaign.productName}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {CATEGORY_LABELS[campaign.category] ?? campaign.category}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {campaign.keywordCount}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatRelativeDate(campaign.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/campaigns/${campaign.id}`} aria-label="Editar campanha">
                          <FileEdit className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      {campaign.googleAdsCampaignId && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                          <a
                            href={`https://ads.google.com/aw/campaigns?campaignId=${campaign.googleAdsCampaignId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label="Ver no Google Ads"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
