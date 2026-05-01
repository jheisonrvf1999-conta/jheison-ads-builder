'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Trash2, Star, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { generateKeywords, addCustomKeyword, STANDARD_NEGATIVE_KEYWORDS } from '@/lib/keyword-scorer'
import { cn } from '@/lib/utils'
import type { ScoredKeyword } from '@/types'
import type { SummaryData } from './step-summary'

interface StepKeywordsProps {
  summary: SummaryData
  affiliateUrl: string
  initialKeywords?: ScoredKeyword[]
  onComplete: (keywords: ScoredKeyword[], negatives: string[]) => void
  onBack: () => void
}

const MATCH_TYPE_COLORS = {
  Exact:  'bg-green-500/10 text-green-400 border-green-500/20',
  Phrase: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Broad:  'bg-gray-500/10 text-gray-400 border-gray-500/20',
}

function scoreBadgeClass(score: number): string {
  if (score >= 70) return 'bg-green-500/10 text-green-400 border-green-500/20'
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
  return 'bg-red-500/10 text-red-400 border-red-500/20'
}

export function StepKeywords({ summary, affiliateUrl, initialKeywords, onComplete, onBack }: StepKeywordsProps) {
  const [keywords, setKeywords] = useState<ScoredKeyword[]>([])
  const [negatives, setNegatives] = useState<string[]>(STANDARD_NEGATIVE_KEYWORDS)
  const [customInput, setCustomInput] = useState('')
  const [negativeInput, setNegativeInput] = useState('')
  const [showSniperOnly, setShowSniperOnly] = useState(false)

  useEffect(() => {
    const generated = initialKeywords && initialKeywords.length > 0
      ? initialKeywords
      : generateKeywords(summary.productName, summary.benefits, affiliateUrl)
    setKeywords(generated)
  }, [summary.productName, summary.benefits, affiliateUrl, initialKeywords])

  function toggleKeyword(index: number) {
    setKeywords((prev) =>
      prev.map((kw, i) => (i === index ? { ...kw, selected: !kw.selected } : kw))
    )
  }

  function removeKeyword(index: number) {
    setKeywords((prev) => prev.filter((_, i) => i !== index))
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed) return
    const already = keywords.find((k) => k.keyword === trimmed.toLowerCase())
    if (already) { setCustomInput(''); return }
    const newKw = addCustomKeyword(trimmed, summary.productName)
    setKeywords((prev) => [newKw, ...prev])
    setCustomInput('')
  }

  function addNegative() {
    const trimmed = negativeInput.trim().toLowerCase()
    if (!trimmed || negatives.includes(trimmed)) return
    setNegatives((prev) => [...prev, trimmed])
    setNegativeInput('')
  }

  function removeNegative(kw: string) {
    setNegatives((prev) => prev.filter((n) => n !== kw))
  }

  function selectAll() {
    setKeywords((prev) => prev.map((kw) => ({ ...kw, selected: true })))
  }

  function deselectAll() {
    setKeywords((prev) => prev.map((kw) => ({ ...kw, selected: false })))
  }

  const displayed = showSniperOnly
    ? keywords.filter((k) => k.score >= 70)
    : keywords

  const selectedCount = keywords.filter((k) => k.selected && !k.isNegative).length
  const sniperCount = keywords.filter((k) => k.score >= 70).length

  function handleNext() {
    onComplete(keywords, negatives)
  }

  return (
    <TooltipProvider>
      <Card>
        <CardContent className="pt-6 space-y-5">
          {/* Header stats */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="gap-1.5">
              <span className="text-foreground font-semibold">{selectedCount}</span>
              <span className="text-muted-foreground">selecionadas</span>
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-yellow-500/30 text-yellow-400">
              <Star className="h-3 w-3 fill-yellow-400" />
              <span>{sniperCount} Sniper</span>
            </Badge>
            <div className="flex gap-1.5 ml-auto">
              <Button variant="outline" size="sm" onClick={selectAll}>Selecionar todas</Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>Desmarcar todas</Button>
              <Button
                variant={showSniperOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowSniperOnly((v) => !v)}
                className={showSniperOnly ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20' : ''}
              >
                <Star className="mr-1.5 h-3 w-3" />
                Sniper Mode
              </Button>
            </div>
          </div>

          {/* Add custom keyword */}
          <div className="flex gap-2">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom() } }}
              placeholder="Adicionar palavra-chave personalizada..."
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addCustom} disabled={!customInput.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Keywords table */}
          <div className="overflow-hidden rounded-md border border-border">
            <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-0 text-xs font-medium text-muted-foreground bg-muted/40 border-b border-border px-3 py-2">
              <span className="w-5" />
              <span>Palavra-chave</span>
              <span className="px-3 text-center">Tipo</span>
              <span className="px-3 text-center">Score</span>
              <span className="w-7" />
            </div>

            <div className="divide-y divide-border max-h-[340px] overflow-y-auto">
              {displayed.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Nenhuma palavra-chave encontrada para este filtro.
                </div>
              )}
              {displayed.map((kw, i) => {
                const originalIndex = keywords.indexOf(kw)
                return (
                  <div
                    key={kw.keyword}
                    className={cn(
                      'grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-0 px-3 py-2 text-sm transition-colors',
                      kw.selected ? 'bg-background' : 'bg-muted/20 opacity-60',
                      kw.isNegative && 'opacity-40'
                    )}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={kw.selected}
                      onChange={() => toggleKeyword(originalIndex)}
                      className="h-3.5 w-3.5 rounded accent-indigo-500 mr-3 cursor-pointer"
                      disabled={kw.isNegative}
                    />

                    {/* Keyword */}
                    <span className={cn('font-mono text-xs', kw.isNegative && 'line-through text-muted-foreground')}>
                      {kw.keyword}
                      {kw.score >= 70 && (
                        <Star className="inline ml-1.5 h-3 w-3 text-yellow-400 fill-yellow-400" />
                      )}
                    </span>

                    {/* Match type */}
                    <div className="px-3">
                      <Badge variant="outline" className={cn('text-xs', MATCH_TYPE_COLORS[kw.matchType])}>
                        {kw.matchType}
                      </Badge>
                    </div>

                    {/* Score */}
                    <div className="px-3">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant="outline" className={cn('text-xs cursor-help', scoreBadgeClass(kw.score))}>
                            {kw.score}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="text-xs max-w-[200px]">
                          Score de intenção de compra. ≥70 = Sniper (Exact Match). 40-69 = Phrase. &lt;40 = Broad.
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeKeyword(originalIndex)}
                      className="text-muted-foreground hover:text-red-400 transition-colors w-7 flex items-center justify-center"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Negative keywords */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label className="text-sm font-medium">Palavras-chave Negativas</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="text-xs max-w-[240px]">
                  Evitam que seu anúncio apareça para buscas irrelevantes (ex: "grátis", "reclamação").
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="flex gap-2">
              <Input
                value={negativeInput}
                onChange={(e) => setNegativeInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNegative() } }}
                placeholder="Adicionar negativa personalizada..."
                className="flex-1 text-sm"
              />
              <Button type="button" variant="outline" onClick={addNegative} disabled={!negativeInput.trim()}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {negatives.map((n) => (
                <Badge
                  key={n}
                  variant="outline"
                  className="gap-1 pr-1 bg-red-500/5 text-red-400 border-red-500/20 text-xs"
                >
                  -{n}
                  <button
                    type="button"
                    onClick={() => removeNegative(n)}
                    className="ml-0.5 hover:opacity-70"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft className="mr-1.5 h-4 w-4" />
              Voltar
            </Button>
            <Button type="button" onClick={handleNext} disabled={selectedCount === 0}>
              Gerar Anúncios ({selectedCount})
              <ChevronRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
