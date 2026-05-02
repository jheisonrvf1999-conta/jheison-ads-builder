'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { CheckCircle2 } from 'lucide-react'
import { StepUrl } from './step-url'
import { StepSummary, type SummaryData } from './step-summary'
import { StepKeywords } from './step-keywords'
import type { PageAnalysisResult, ScoredKeyword, CampaignCategory, CampaignObjective } from '@/types'

type Step = 1 | 2 | 3

const STEPS = [
  { num: 1, label: 'Análise de Página' },
  { num: 2, label: 'Resumo do Produto' },
  { num: 3, label: 'Palavras-chave' },
]

function buildInitialSummary(analysis: PageAnalysisResult, url: string): SummaryData {
  return {
    productName: analysis.productName || '',
    category: 'outro' as CampaignCategory,
    objective: 'conversao' as CampaignObjective,
    benefits: analysis.benefits.slice(0, 5),
    differentials: [],
    offer: analysis.offers[0] ?? '',
    affiliateUrl: url,
  }
}

export function CampaignWizard() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [analysis, setAnalysis] = useState<PageAnalysisResult | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [saving, setSaving] = useState(false)

  // Step 1 → 2
  function handleAnalysisDone(
    result: PageAnalysisResult,
    destinationUrl: string,
    analysisUrl: string,
    _country: string,
    _language: string
  ) {
    setAnalysis(result)
    setSourceUrl(analysisUrl)
    setSummary(buildInitialSummary(result, destinationUrl))
    setStep(2)
  }

  // Step 2 → 3
  function handleSummaryDone(data: SummaryData) {
    setSummary(data)
    setStep(3)
  }

  // Step 3 → Save campaign
  async function handleKeywordsDone(keywords: ScoredKeyword[], negatives: string[]) {
    if (!summary) return
    setSaving(true)

    try {
      const payload = {
        productName: summary.productName,
        category: summary.category,
        objective: summary.objective,
        benefits: summary.benefits,
        differentials: summary.differentials,
        offer: summary.offer,
        affiliateUrl: summary.affiliateUrl,
        keywords: keywords.filter((k) => k.selected && !k.isNegative),
        negativeKeywords: negatives,
      }

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error ?? 'Erro ao criar campanha.')
        return
      }

      toast.success('Campanha criada com sucesso!')
      const campaignId = json.data?.id as string | undefined
      router.push(campaignId ? `/campaigns/${campaignId}` : '/campaigns')
    } catch {
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <nav aria-label="Etapas do wizard">
        <ol className="flex items-center gap-0">
          {STEPS.map((s, i) => {
            const done = step > s.num
            const active = step === s.num
            return (
              <li key={s.num} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                      done
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : active
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      active ? 'text-indigo-400' : done ? 'text-foreground' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-px flex-1 mx-2 mb-5 transition-colors ${
                      step > s.num ? 'bg-indigo-500' : 'bg-border'
                    }`}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </nav>

      {/* Step content */}
      {step === 1 && (
        <StepUrl onComplete={handleAnalysisDone} />
      )}

      {step === 2 && summary && (
        <StepSummary
          initialData={summary}
          onComplete={handleSummaryDone}
          onBack={() => setStep(1)}
        />
      )}

      {step === 3 && summary && (
        <StepKeywords
          summary={summary}
          affiliateUrl={summary.affiliateUrl}
          onComplete={handleKeywordsDone}
          onBack={() => setStep(2)}
        />
      )}

      {saving && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-background border border-border p-6 text-center shadow-2xl">
            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="text-sm font-medium text-foreground">Gerando sua campanha...</p>
            <p className="text-xs text-muted-foreground mt-1">Criando grupos de anúncios e palavras-chave</p>
          </div>
        </div>
      )}
    </div>
  )
}
