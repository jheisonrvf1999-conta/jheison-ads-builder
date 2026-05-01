import { redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RecentCampaigns } from '@/components/dashboard/recent-campaigns'
import type { CampaignSummary } from '@/types'

interface PageProps {
  searchParams: { page?: string; status?: string; q?: string }
}

export default async function CampaignsPage({ searchParams }: PageProps) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = createAdminClient()
  const page = Math.max(0, parseInt(searchParams.page ?? '0', 10) - 1)
  const PAGE_SIZE = 20
  const status = searchParams.status
  const q = searchParams.q?.trim()

  let query = supabase
    .from('campaigns')
    .select('id, product_name, category, status, keywords, ad_groups, google_ads_campaign_id, sync_status, estimated_cpc, real_cpc, created_at, updated_at')
    .eq('user_id', session.user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('product_name', `%${q}%`)

  const { data: rows } = await query

  const campaigns: CampaignSummary[] = (rows ?? []).map((r) => ({
    id: r.id,
    name: r.product_name,
    productName: r.product_name,
    category: r.category,
    status: r.status,
    adGroupCount: Array.isArray(r.ad_groups) ? r.ad_groups.length : 0,
    keywordCount: Array.isArray(r.keywords) ? r.keywords.length : 0,
    googleAdsCampaignId: r.google_ads_campaign_id ?? undefined,
    syncStatus: r.sync_status ?? undefined,
    estimatedCpc: r.estimated_cpc ?? undefined,
    realCpc: r.real_cpc ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campanhas</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todas as suas campanhas Google Ads
          </p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova campanha
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <form method="GET" className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="q"
              defaultValue={q}
              placeholder="Buscar campanha..."
              className="h-9 rounded-md border border-input bg-background pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 w-52"
            />
          </div>
          <select
            name="status"
            defaultValue={status ?? ''}
            onChange={(e) => {
              const f = new URLSearchParams(window.location.search)
              if (e.target.value) f.set('status', e.target.value)
              else f.delete('status')
              f.delete('page')
              window.location.search = f.toString()
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="">Todos os status</option>
            <option value="draft">Rascunho</option>
            <option value="active">Ativa</option>
            <option value="exported">Exportada</option>
            <option value="synced">Sincronizada</option>
          </select>
          <Button type="submit" variant="outline" size="sm">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <RecentCampaigns campaigns={campaigns} />

      {campaigns.length === 0 && !q && !status && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground mb-4">Nenhuma campanha encontrada.</p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              Criar primeira campanha
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
