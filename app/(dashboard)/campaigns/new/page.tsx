import type { Metadata } from 'next'
import { CampaignWizard } from '@/components/campaign/wizard/wizard'

export const metadata: Metadata = { title: 'Nova Campanha' }

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Nova Campanha</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Analise uma página de vendas e gere sua campanha Google Ads em minutos.
        </p>
      </div>
      <CampaignWizard />
    </div>
  )
}
