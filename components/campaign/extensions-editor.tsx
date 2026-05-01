'use client'

import { useState } from 'react'
import { Plus, Trash2, ExternalLink, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import { CharCounter } from '@/components/campaign/char-counter'
import { cn } from '@/lib/utils'
import type { Sitelink, Callout, StructuredSnippet, CampaignExtensions } from '@/types'

const SITELINK_TITLE_MAX  = 25
const SITELINK_DESC_MAX   = 35
const CALLOUT_MAX         = 25

interface ExtensionsEditorProps {
  extensions: CampaignExtensions
  onChange: (extensions: CampaignExtensions) => void
  readOnly?: boolean
}

// ─── Sitelinks ────────────────────────────────────────────────────────────────

function SitelinkRow({
  sitelink, index, onChange, onRemove, readOnly,
}: {
  sitelink: Sitelink
  index: number
  onChange: (s: Sitelink) => void
  onRemove: () => void
  readOnly?: boolean
}) {
  const titleOver = sitelink.title.length > SITELINK_TITLE_MAX
  const d1Over = sitelink.description1.length > SITELINK_DESC_MAX
  const d2Over = (sitelink.description2 ?? '').length > SITELINK_DESC_MAX

  return (
    <Card className={cn('border', (titleOver || d1Over || d2Over) && 'border-red-500/40')}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Sitelink {index + 1}
          </span>
          {!readOnly && (
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-red-400"
              onClick={onRemove}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Título *</Label>
            <CharCounter value={sitelink.title} max={SITELINK_TITLE_MAX} />
          </div>
          <Input
            value={sitelink.title}
            onChange={(e) => onChange({ ...sitelink, title: e.target.value })}
            disabled={readOnly}
            placeholder="Como Funciona"
            className={cn('h-8 text-sm', titleOver && 'border-red-500')}
            maxLength={SITELINK_TITLE_MAX + 3}
          />
        </div>

        {/* Description 1 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Descrição 1</Label>
            <CharCounter value={sitelink.description1} max={SITELINK_DESC_MAX} />
          </div>
          <Input
            value={sitelink.description1}
            onChange={(e) => onChange({ ...sitelink, description1: e.target.value })}
            disabled={readOnly}
            placeholder="Saiba como o produto funciona"
            className={cn('h-8 text-sm', d1Over && 'border-red-500')}
            maxLength={SITELINK_DESC_MAX + 3}
          />
        </div>

        {/* Description 2 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Descrição 2</Label>
            <CharCounter value={sitelink.description2 ?? ''} max={SITELINK_DESC_MAX} />
          </div>
          <Input
            value={sitelink.description2 ?? ''}
            onChange={(e) => onChange({ ...sitelink, description2: e.target.value })}
            disabled={readOnly}
            placeholder="Veja os resultados reais"
            className={cn('h-8 text-sm', d2Over && 'border-red-500')}
            maxLength={SITELINK_DESC_MAX + 3}
          />
        </div>

        {/* URL */}
        <div className="space-y-1">
          <Label className="text-xs flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            URL de Destino *
          </Label>
          <Input
            value={sitelink.finalUrl}
            onChange={(e) => onChange({ ...sitelink, finalUrl: e.target.value })}
            disabled={readOnly}
            placeholder="https://..."
            className="h-8 text-sm font-mono"
          />
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Callouts ─────────────────────────────────────────────────────────────────

const DEFAULT_CALLOUTS = [
  'Produto Original', 'Compra Segura', 'PIX e Cartão', 'Parcelamento s/ Juros',
]

function CalloutsEditor({
  callouts, onChange, readOnly,
}: {
  callouts: Callout[]
  onChange: (c: Callout[]) => void
  readOnly?: boolean
}) {
  function changeText(index: number, text: string) {
    onChange(callouts.map((c, i) => (i === index ? { text } : c)))
  }

  function remove(index: number) {
    onChange(callouts.filter((_, i) => i !== index))
  }

  function add() {
    if (callouts.length >= 10) return
    onChange([...callouts, { text: '' }])
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Callouts são textos curtos destacados no anúncio.
          </span>
          <Badge variant="outline" className="text-xs">{callouts.length}/10</Badge>
        </div>
        {!readOnly && callouts.length < 10 && (
          <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={add}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Adicionar
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {callouts.map((c, i) => {
          const over = c.text.length > CALLOUT_MAX
          return (
            <div key={i} className={cn(
              'group flex items-center gap-2 rounded-md border px-2.5 py-1.5',
              over ? 'border-red-500/40 bg-red-500/5' : 'border-border'
            )}>
              <Input
                value={c.text}
                onChange={(e) => changeText(i, e.target.value)}
                disabled={readOnly}
                placeholder={DEFAULT_CALLOUTS[i] ?? `Callout ${i + 1}`}
                className={cn('h-7 border-0 bg-transparent p-0 text-sm focus-visible:ring-0', over && 'text-red-400')}
                maxLength={CALLOUT_MAX + 3}
              />
              <CharCounter value={c.text} max={CALLOUT_MAX} className="shrink-0" />
              {!readOnly && (
                <Button type="button" variant="ghost" size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => remove(i)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Structured Snippets ──────────────────────────────────────────────────────

function SnippetsEditor({
  snippets, onChange, readOnly,
}: {
  snippets: StructuredSnippet[]
  onChange: (s: StructuredSnippet[]) => void
  readOnly?: boolean
}) {
  function changeValue(snipIndex: number, valIndex: number, text: string) {
    onChange(snippets.map((s, i) =>
      i === snipIndex
        ? { ...s, values: s.values.map((v, j) => (j === valIndex ? text : v)) }
        : s
    ))
  }

  function addValue(snipIndex: number) {
    onChange(snippets.map((s, i) =>
      i === snipIndex ? { ...s, values: [...s.values, ''] } : s
    ))
  }

  function removeValue(snipIndex: number, valIndex: number) {
    onChange(snippets.map((s, i) =>
      i === snipIndex
        ? { ...s, values: s.values.filter((_, j) => j !== valIndex) }
        : s
    ))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Snippets estruturados mostram listas de opções/planos no anúncio.
      </p>
      {snippets.map((snippet, si) => (
        <div key={si} className="space-y-2 rounded-lg border border-border p-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">{snippet.header}</Badge>
            <span className="text-xs text-muted-foreground">{snippet.values.length} valores</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {snippet.values.map((v, vi) => (
              <div key={vi} className="group flex items-center gap-1 rounded border border-border px-2 py-1">
                <Input
                  value={v}
                  onChange={(e) => changeValue(si, vi, e.target.value)}
                  disabled={readOnly}
                  className="h-6 w-20 border-0 bg-transparent p-0 text-xs focus-visible:ring-0"
                  placeholder="30 dias"
                />
                {!readOnly && (
                  <button type="button" onClick={() => removeValue(si, vi)}
                    className="text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && snippet.values.length < 10 && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => addValue(si)}>
                <Plus className="mr-1 h-3 w-3" />
                Adicionar
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ExtensionsEditor({ extensions, onChange, readOnly }: ExtensionsEditorProps) {
  function updateSitelinks(sitelinks: Sitelink[]) {
    onChange({ ...extensions, sitelinks })
  }
  function updateCallouts(callouts: Callout[]) {
    onChange({ ...extensions, callouts })
  }
  function updateSnippets(structuredSnippets: StructuredSnippet[]) {
    onChange({ ...extensions, structuredSnippets })
  }

  function addSitelink() {
    if (extensions.sitelinks.length >= 6) return
    updateSitelinks([...extensions.sitelinks, {
      title: '', description1: '', description2: '', finalUrl: '',
    }])
  }

  function removeSitelink(index: number) {
    updateSitelinks(extensions.sitelinks.filter((_, i) => i !== index))
  }

  const sitelinkIssueCount = extensions.sitelinks.reduce((acc, s) => {
    return acc
      + (s.title.length > SITELINK_TITLE_MAX ? 1 : 0)
      + (s.description1.length > SITELINK_DESC_MAX ? 1 : 0)
      + ((s.description2 ?? '').length > SITELINK_DESC_MAX ? 1 : 0)
  }, 0)

  const calloutIssueCount = extensions.callouts.filter(c => c.text.length > CALLOUT_MAX).length

  return (
    <TooltipProvider>
      <Tabs defaultValue="sitelinks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sitelinks" className="gap-2 text-xs">
            Sitelinks
            <Badge variant="outline" className={cn('text-xs px-1.5', sitelinkIssueCount > 0 && 'border-red-500/40 text-red-400')}>
              {extensions.sitelinks.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="callouts" className="gap-2 text-xs">
            Callouts
            <Badge variant="outline" className={cn('text-xs px-1.5', calloutIssueCount > 0 && 'border-red-500/40 text-red-400')}>
              {extensions.callouts.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="snippets" className="text-xs">
            Snippets
          </TabsTrigger>
        </TabsList>

        {/* Sitelinks */}
        <TabsContent value="sitelinks" className="space-y-3 mt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Máx. 6 sitelinks. Título 25 chars, Descrição 35 chars.</p>
              <Tooltip>
                <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                <TooltipContent className="max-w-[220px] text-xs">
                  Sitelinks são links adicionais exibidos abaixo do anúncio principal, levando para páginas específicas.
                </TooltipContent>
              </Tooltip>
            </div>
            {!readOnly && extensions.sitelinks.length < 6 && (
              <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={addSitelink}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Adicionar Sitelink
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {extensions.sitelinks.map((s, i) => (
              <SitelinkRow
                key={i} sitelink={s} index={i}
                onChange={(updated) => updateSitelinks(extensions.sitelinks.map((x, j) => j === i ? updated : x))}
                onRemove={() => removeSitelink(i)}
                readOnly={readOnly}
              />
            ))}
          </div>
        </TabsContent>

        {/* Callouts */}
        <TabsContent value="callouts" className="mt-0">
          <CalloutsEditor callouts={extensions.callouts} onChange={updateCallouts} readOnly={readOnly} />
        </TabsContent>

        {/* Structured Snippets */}
        <TabsContent value="snippets" className="mt-0">
          <SnippetsEditor snippets={extensions.structuredSnippets} onChange={updateSnippets} readOnly={readOnly} />
        </TabsContent>
      </Tabs>
    </TooltipProvider>
  )
}
