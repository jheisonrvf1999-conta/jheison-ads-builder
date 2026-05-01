import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { ArrowLeft, Download, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdBuilder } from '@/components/campaign/ad-builder'
import { ExtensionsEditor } from '@/components/campaign/extensions-editor'
import type { Campaign } from '@/types'

interface PageProps {
  params: { id: string }
}

const STATUS_CONFIG = {
  draft:    { label: 'Rascunho',     className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  active:   { label: 'Ativa',        className: 'bg-green-500/10 text-green-400 border-green-500/20' },
  exported: { label: 'Exportada',    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  synced:   { label: 'Sincronizada', className: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
} as const

export default async function CampaignDetailPage({ params }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = createAdminClient()
  const { data: row } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .single()

  if (!row) notFound()

  const campaign = row as unknown as Campaign & {
    user_id: string
    product_name: string
    affiliate_url: string
    ad_groups: Campaign['adGroups']
    negative_keywords: string[]
    google_ads_campaign_id?: string
    estimated_cpc?: number
    real_cpc?: number
    sync_status?: string
    last_sync_at?: string
    created_at: string
    updated_at: string
  }

  const firstAdGroup = campaign.ad_groups?.[0]
  const firstAd = firstAdGroup?.ads?.[0]
  const status = STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.draft

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5" asChild>
            <Link href="/campaigns">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-foreground">{campaign.product_name}</h1>
              <Badge variant="outline" className={status.className}>{status.label}</Badge>
              {campaign.sync_status === 'synced' && (
                <Badge variant="outline" className="border-green-500/30 bg-green-500/10 text-green-400 text-xs">
                  Sincronizado
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {campaign.category} · Criada {new Date(campaign.created_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 pl-11 sm:pl-0">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/export/${campaign.id}?format=csv`}>
              <Download className="mr-2 h-3.5 w-3.5" />
              CSV
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/export/${campaign.id}?format=xml`}>
              <Download className="mr-2 h-3.5 w-3.5" />
              XML
            </a>
          </Button>
          {campaign.google_ads_campaign_id && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://ads.google.com/aw/campaigns?campaignId=${campaign.google_ads_campaign_id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" />
                Google Ads
              </a>
            </Button>
          )}
          {campaign.sync_status !== 'synced' && (
            <form action={`/api/google-ads/sync/${campaign.id}`} method="POST">
              <Button type="submit" variant="outline" size="sm">
                <RefreshCw className="mr-2 h-3.5 w-3.5" />
                Sincronizar
              </Button>
            </form>
          )}
        </div>
      </div>

      {/* CPC summary row */}
      {(campaign.estimated_cpc != null || campaign.real_cpc != null) && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {campaign.estimated_cpc != null && (
            <Card className="py-3">
              <CardHeader className="pb-0 pt-0 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">CPC Estimado</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-1 pb-0">
                <p className="text-lg font-semibold">R$ {campaign.estimated_cpc.toFixed(2)}</p>
              </CardContent>
            </Card>
          )}
          {campaign.real_cpc != null && (
            <Card className="py-3">
              <CardHeader className="pb-0 pt-0 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">CPC Real</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-1 pb-0">
                <p className="text-lg font-semibold">R$ {campaign.real_cpc.toFixed(2)}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tabs: Ad Groups + Extensions */}
      <Tabs defaultValue={firstAdGroup?.id ?? 'ext'}>
        <TabsList className="flex-wrap h-auto gap-1">
          {(campaign.ad_groups ?? []).map((ag) => (
            <TabsTrigger key={ag.id} value={ag.id} className="text-xs">
              {ag.name}
            </TabsTrigger>
          ))}
          <TabsTrigger value="ext" className="text-xs">Extensões</TabsTrigger>
        </TabsList>

        {(campaign.ad_groups ?? []).map((ag) => (
          <TabsContent key={ag.id} value={ag.id} className="mt-4 space-y-4">
            {/* Keywords summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">
                  Palavras-chave ({ag.keywords?.length ?? 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-1.5">
                  {(ag.keywords ?? []).slice(0, 30).map((kw, i) => (
                    <Badge key={i} variant="outline" className="font-mono text-xs">
                      [{kw.matchType === 'Exact' ? 'E' : kw.matchType === 'Phrase' ? 'P' : 'B'}] {kw.keyword}
                    </Badge>
                  ))}
                  {(ag.keywords?.length ?? 0) > 30 && (
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      +{(ag.keywords?.length ?? 0) - 30} mais
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Ad builder for first ad in this group */}
            {ag.ads?.map((ad, adIdx) => (
              <div key={ad.id} className="space-y-2">
                {ag.ads.length > 1 && (
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    Anúncio {adIdx + 1}
                  </p>
                )}
                <AdBuilder
                  adGroupName={ag.name}
                  initialHeadlines={ad.headlines}
                  initialDescriptions={ad.descriptions}
                  readOnly={false}
                />
              </div>
            ))}
          </TabsContent>
        ))}

        <TabsContent value="ext" className="mt-4">
          <ExtensionsEditor
            extensions={campaign.extensions ?? { sitelinks: [], callouts: [], structuredSnippets: [] }}
            onChange={() => {}}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
