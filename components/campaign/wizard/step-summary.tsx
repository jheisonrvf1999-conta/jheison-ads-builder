'use client'

import { useState } from 'react'
import { Plus, X, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CampaignCategory, CampaignObjective } from '@/types'

export interface SummaryData {
  productName: string
  category: CampaignCategory
  objective: CampaignObjective
  benefits: string[]
  differentials: string[]
  offer: string
  affiliateUrl: string
}

const BANNED_WORDS = [
  'revolucionário', 'melhor do mercado', 'garanta', '100%', 'milagre',
  'comprovado cientificamente', 'cure', 'cura', 'garantido', 'milagroso',
]

const CATEGORIES: { value: CampaignCategory; label: string }[] = [
  { value: 'suplemento', label: 'Suplemento' },
  { value: 'software', label: 'Software' },
  { value: 'curso', label: 'Curso / Infoproduto' },
  { value: 'ecommerce', label: 'E-commerce / Produto Físico' },
  { value: 'servico', label: 'Serviço' },
  { value: 'ebook', label: 'E-book' },
  { value: 'consultoria', label: 'Consultoria' },
  { value: 'outro', label: 'Outro' },
]

const OBJECTIVES: { value: CampaignObjective; label: string; hint: string }[] = [
  { value: 'conversao', label: 'Conversão', hint: 'Maximize Conversions · CPA alvo' },
  { value: 'leads', label: 'Captação de Leads', hint: 'Target CPA · formulário' },
  { value: 'trafego', label: 'Tráfego', hint: 'Maximize Clicks' },
  { value: 'awareness', label: 'Reconhecimento', hint: 'CPM / Impressões' },
]

function detectBannedWords(text: string): string[] {
  const lower = text.toLowerCase()
  return BANNED_WORDS.filter((w) => lower.includes(w.toLowerCase()))
}

interface TagInputProps {
  label: string
  hint?: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  max?: number
}

function TagInput({ label, hint, values, onChange, placeholder = 'Digite e pressione Enter', max = 5 }: TagInputProps) {
  const [input, setInput] = useState('')

  function add() {
    const trimmed = input.trim()
    if (!trimmed || values.includes(trimmed) || values.length >= max) return
    onChange([...values, trimmed])
    setInput('')
  }

  function remove(index: number) {
    onChange(values.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <span className="text-xs text-muted-foreground">{values.length}/{max}</span>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
          }}
          placeholder={placeholder}
          disabled={values.length >= max}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={add} disabled={values.length >= max || !input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {values.map((v, i) => {
            const banned = detectBannedWords(v)
            return (
              <Badge
                key={i}
                variant="secondary"
                className={`gap-1 pr-1 ${banned.length > 0 ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : ''}`}
              >
                <span className="max-w-[200px] truncate">{v}</span>
                {banned.length > 0 && <AlertTriangle className="h-3 w-3 shrink-0" />}
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="ml-0.5 rounded-sm hover:opacity-70"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

interface StepSummaryProps {
  initialData: SummaryData
  onComplete: (data: SummaryData) => void
  onBack: () => void
}

export function StepSummary({ initialData, onComplete, onBack }: StepSummaryProps) {
  const [data, setData] = useState<SummaryData>(initialData)
  const [errors, setErrors] = useState<Partial<Record<keyof SummaryData, string>>>({})

  function set<K extends keyof SummaryData>(key: K, value: SummaryData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof SummaryData, string>> = {}
    if (!data.productName.trim()) errs.productName = 'Nome do produto é obrigatório'
    if (!data.affiliateUrl.trim()) errs.affiliateUrl = 'URL de destino é obrigatória'
    if (data.benefits.length < 1) errs.benefits = 'Adicione pelo menos 1 benefício'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (validate()) onComplete(data)
  }

  // Global banned-word warnings across all text fields
  const allText = [
    data.productName, data.offer,
    ...data.benefits, ...data.differentials,
  ].join(' ')
  const globalBanned = detectBannedWords(allText)

  return (
    <Card>
      <CardContent className="pt-6 space-y-5">
        {/* Banned word warning */}
        {globalBanned.length > 0 && (
          <div className="flex items-start gap-2.5 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2.5 text-sm text-yellow-400">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>
              Palavras bloqueadas pelo Google Ads detectadas:{' '}
              <strong>{globalBanned.join(', ')}</strong>. Edite antes de prosseguir.
            </span>
          </div>
        )}

        {/* Produto + Categoria */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="productName">Nome do Produto *</Label>
            <Input
              id="productName"
              value={data.productName}
              onChange={(e) => set('productName', e.target.value)}
              placeholder="Ex: Nutriclean 360"
              className={errors.productName ? 'border-red-500' : ''}
            />
            {errors.productName && (
              <p className="text-xs text-red-500">{errors.productName}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category">Categoria</Label>
            <Select value={data.category} onValueChange={(v) => set('category', v as CampaignCategory)}>
              <SelectTrigger id="category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Objetivo */}
        <div className="space-y-2">
          <Label>Objetivo da Campanha</Label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {OBJECTIVES.map((obj) => (
              <button
                key={obj.value}
                type="button"
                onClick={() => set('objective', obj.value)}
                className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                  data.objective === obj.value
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400'
                    : 'border-border text-muted-foreground hover:border-indigo-500/40 hover:text-foreground'
                }`}
              >
                <p className="font-medium">{obj.label}</p>
                <p className="text-xs opacity-70 mt-0.5">{obj.hint}</p>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Benefícios */}
        <TagInput
          label="Benefícios *"
          hint="3 a 5 benefícios claros e objetivos. Evite palavras proibidas."
          values={data.benefits}
          onChange={(v) => set('benefits', v)}
          placeholder="Ex: Aumenta disposição e energia"
          max={5}
        />
        {errors.benefits && (
          <p className="text-xs text-red-500 -mt-3">{errors.benefits}</p>
        )}

        {/* Diferenciais */}
        <TagInput
          label="Diferenciais"
          hint="2 a 3 diferenciais em relação à concorrência."
          values={data.differentials}
          onChange={(v) => set('differentials', v)}
          placeholder="Ex: Fórmula patenteada exclusiva"
          max={3}
        />

        {/* Oferta */}
        <div className="space-y-1.5">
          <Label htmlFor="offer">Oferta / Promoção</Label>
          <Input
            id="offer"
            value={data.offer}
            onChange={(e) => set('offer', e.target.value)}
            placeholder="Ex: Kit 3 frascos com 30% de desconto"
          />
          <p className="text-xs text-muted-foreground">Opcional. Aparecerá nas extensões de anúncio.</p>
        </div>

        {/* URL de destino */}
        <div className="space-y-1.5">
          <Label htmlFor="affiliateUrl">URL de Destino (Afiliado) *</Label>
          <Input
            id="affiliateUrl"
            value={data.affiliateUrl}
            onChange={(e) => set('affiliateUrl', e.target.value)}
            placeholder="https://produto.com.br/?ref=SEU_ID"
            className={errors.affiliateUrl ? 'border-red-500' : ''}
          />
          {errors.affiliateUrl && (
            <p className="text-xs text-red-500">{errors.affiliateUrl}</p>
          )}
          <p className="text-xs text-muted-foreground">
            UTMs serão adicionados automaticamente na próxima etapa.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          <Button type="button" variant="outline" onClick={onBack}>
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Voltar
          </Button>
          <Button type="button" onClick={handleNext}>
            Ver Palavras-chave
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
