'use client'

import { useState } from 'react'
import { Plus, Trash2, Pin, GripVertical, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { CharCounter } from '@/components/campaign/char-counter'
import { ComplianceChecker } from '@/components/campaign/compliance-checker'
import { sanitizeForAds } from '@/lib/compliance'
import { cn } from '@/lib/utils'
import type { RSAHeadline, RSADescription } from '@/types'

const HEADLINE_MAX    = 30
const DESCRIPTION_MAX = 90

interface AdBuilderProps {
  adGroupName: string
  initialHeadlines: RSAHeadline[]
  initialDescriptions: RSADescription[]
  onChange?: (headlines: RSAHeadline[], descriptions: RSADescription[]) => void
  readOnly?: boolean
}

function HeadlineRow({
  item, index, total, onChange, onRemove, onPin, readOnly,
}: {
  item: RSAHeadline
  index: number
  total: number
  onChange: (val: string) => void
  onRemove: () => void
  onPin: (pos: 1 | 2 | 3 | undefined) => void
  readOnly?: boolean
}) {
  const over = item.text.length > HEADLINE_MAX
  const PIN_OPTIONS = [1, 2, 3] as const

  return (
    <div className={cn(
      'group flex items-center gap-2 rounded-md border px-2 py-1.5 transition-colors',
      over ? 'border-red-500/40 bg-red-500/5' : 'border-border hover:border-border/80'
    )}>
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />

      <span className="w-5 shrink-0 text-center text-xs text-muted-foreground font-mono">
        {index + 1}
      </span>

      <div className="relative flex-1">
        <Input
          value={item.text}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          placeholder={`Título ${index + 1}`}
          className={cn(
            'pr-16 h-8 text-sm font-mono',
            over && 'border-red-500 focus-visible:ring-red-500'
          )}
          maxLength={HEADLINE_MAX + 5}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <CharCounter value={item.text} max={HEADLINE_MAX} />
        </div>
      </div>

      {/* Pin indicator */}
      {item.pinPosition && (
        <Badge variant="outline" className="text-xs px-1.5 bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
          📌{item.pinPosition}
        </Badge>
      )}

      {!readOnly && (
        <TooltipProvider>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Pin button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-indigo-400"
                  onClick={() => {
                    const next = item.pinPosition === undefined ? 1
                      : item.pinPosition === 3 ? undefined
                      : (item.pinPosition + 1) as 1 | 2 | 3
                    onPin(next)
                  }}
                >
                  <Pin className={cn('h-3.5 w-3.5', item.pinPosition && 'text-indigo-400 fill-indigo-400')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {item.pinPosition ? `Fixado posição ${item.pinPosition} (clique para mudar)` : 'Fixar posição'}
              </TooltipContent>
            </Tooltip>

            {/* Sanitize button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button" variant="ghost" size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-yellow-400"
                  onClick={() => onChange(sanitizeForAds(item.text))}
                >
                  <Wand2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Auto-corrigir palavras proibidas</TooltipContent>
            </Tooltip>

            {/* Remove */}
            <Button
              type="button" variant="ghost" size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-red-400"
              disabled={total <= 3}
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </TooltipProvider>
      )}
    </div>
  )
}

function DescriptionRow({
  item, index, total, onChange, onRemove, readOnly,
}: {
  item: RSADescription
  index: number
  total: number
  onChange: (val: string) => void
  onRemove: () => void
  readOnly?: boolean
}) {
  const over = item.text.length > DESCRIPTION_MAX

  return (
    <div className={cn(
      'group space-y-1 rounded-md border px-2 py-2 transition-colors',
      over ? 'border-red-500/40 bg-red-500/5' : 'border-border hover:border-border/80'
    )}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-mono">Descrição {index + 1}</span>
        <div className="flex items-center gap-2">
          <CharCounter value={item.text} max={DESCRIPTION_MAX} />
          {!readOnly && (
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button" variant="ghost" size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-yellow-400"
                      onClick={() => onChange(sanitizeForAds(item.text))}
                    >
                      <Wand2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Auto-corrigir</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                type="button" variant="ghost" size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-red-400"
                disabled={total <= 2}
                onClick={onRemove}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
      <Textarea
        value={item.text}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        placeholder={`Descrição ${index + 1} — máx 90 caracteres`}
        rows={2}
        className={cn(
          'resize-none text-sm font-mono leading-snug',
          over && 'border-red-500 focus-visible:ring-red-500'
        )}
        maxLength={DESCRIPTION_MAX + 10}
      />
    </div>
  )
}

export function AdBuilder({
  adGroupName,
  initialHeadlines,
  initialDescriptions,
  onChange,
  readOnly = false,
}: AdBuilderProps) {
  const [headlines, setHeadlines] = useState<RSAHeadline[]>(initialHeadlines)
  const [descriptions, setDescriptions] = useState<RSADescription[]>(initialDescriptions)

  function updateHeadlines(next: RSAHeadline[]) {
    setHeadlines(next)
    onChange?.(next, descriptions)
  }

  function updateDescriptions(next: RSADescription[]) {
    setDescriptions(next)
    onChange?.(headlines, next)
  }

  function changeHeadline(index: number, text: string) {
    updateHeadlines(headlines.map((h, i) => i === index ? { ...h, text } : h))
  }

  function pinHeadline(index: number, pos: 1 | 2 | 3 | undefined) {
    updateHeadlines(headlines.map((h, i) => i === index ? { ...h, pinPosition: pos } : h))
  }

  function removeHeadline(index: number) {
    if (headlines.length <= 3) return
    updateHeadlines(headlines.filter((_, i) => i !== index))
  }

  function addHeadline() {
    if (headlines.length >= 15) return
    updateHeadlines([...headlines, { text: '' }])
  }

  function changeDescription(index: number, text: string) {
    updateDescriptions(descriptions.map((d, i) => i === index ? { ...d, text } : d))
  }

  function removeDescription(index: number) {
    if (descriptions.length <= 2) return
    updateDescriptions(descriptions.filter((_, i) => i !== index))
  }

  function addDescription() {
    if (descriptions.length >= 4) return
    updateDescriptions([...descriptions, { text: '' }])
  }

  const overLimitCount = [
    ...headlines.filter(h => h.text.length > HEADLINE_MAX),
    ...descriptions.filter(d => d.text.length > DESCRIPTION_MAX),
  ].length

  return (
    <div className="space-y-5">
      {/* Over-limit global warning */}
      {overLimitCount > 0 && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          <span className="font-semibold">{overLimitCount}</span>
          {overLimitCount === 1 ? 'campo excede' : 'campos excedem'} o limite de caracteres.
          O Google Ads pode reprovar estes anúncios.
        </div>
      )}

      {/* Headlines */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Títulos</h4>
            <Badge variant="outline" className={cn(
              'text-xs',
              headlines.length >= 15
                ? 'border-green-500/30 text-green-400'
                : 'text-muted-foreground'
            )}>
              {headlines.length}/15
            </Badge>
          </div>
          {!readOnly && headlines.length < 15 && (
            <Button type="button" variant="outline" size="sm" onClick={addHeadline}
              className="h-7 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar título
            </Button>
          )}
        </div>

        <div className="space-y-1.5">
          {headlines.map((h, i) => (
            <HeadlineRow
              key={i} item={h} index={i} total={headlines.length}
              onChange={(v) => changeHeadline(i, v)}
              onRemove={() => removeHeadline(i)}
              onPin={(pos) => pinHeadline(i, pos)}
              readOnly={readOnly}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Mín. 3, máx. 15 títulos. O Google exibe até 3 por vez.{' '}
          Clique no 📌 para fixar um título em posição específica.
        </p>
      </div>

      <Separator />

      {/* Descriptions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-foreground">Descrições</h4>
            <Badge variant="outline" className={cn(
              'text-xs',
              descriptions.length >= 4
                ? 'border-green-500/30 text-green-400'
                : 'text-muted-foreground'
            )}>
              {descriptions.length}/4
            </Badge>
          </div>
          {!readOnly && descriptions.length < 4 && (
            <Button type="button" variant="outline" size="sm" onClick={addDescription}
              className="h-7 text-xs gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Adicionar descrição
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {descriptions.map((d, i) => (
            <DescriptionRow
              key={i} item={d} index={i} total={descriptions.length}
              onChange={(v) => changeDescription(i, v)}
              onRemove={() => removeDescription(i)}
              readOnly={readOnly}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Mín. 2, máx. 4 descrições. O Google exibe até 2 por vez.
        </p>
      </div>

      <Separator />

      {/* Compliance checker */}
      <ComplianceChecker
        adGroupName={adGroupName}
        headlines={headlines}
        descriptions={descriptions}
      />
    </div>
  )
}
