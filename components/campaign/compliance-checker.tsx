'use client'

import { useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown, ChevronUp, AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { validateAdGroup, getComplianceScore } from '@/lib/compliance'
import type { ComplianceIssue, RSAHeadline, RSADescription } from '@/types'

interface ComplianceCheckerProps {
  adGroupName?: string
  headlines: RSAHeadline[]
  descriptions: RSADescription[]
  className?: string
}

function ScoreRing({ score }: { score: number }) {
  const size = 52
  const stroke = 4
  const r = (size - stroke) / 2
  const circumference = 2 * Math.PI * r
  const fill = circumference * (1 - score / 100)

  const color =
    score >= 80 ? '#22c55e' :
    score >= 50 ? '#eab308' :
                  '#ef4444'

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} className="text-muted/30" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={fill}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        className="rotate-90" fill={color}
        style={{ fontSize: 13, fontWeight: 700, fontFamily: 'inherit', transform: `rotate(90deg) translate(0, 0)` }}>
        {/* SVG text doesn't support CSS transforms well — use foreignObject approach below */}
      </text>
    </svg>
  )
}

function IssueRow({ issue }: { issue: ComplianceIssue }) {
  const isError = issue.severity === 'error'
  return (
    <div className={cn(
      'flex items-start gap-2.5 rounded-md px-3 py-2 text-sm',
      isError ? 'bg-red-500/5 border border-red-500/20' : 'bg-yellow-500/5 border border-yellow-500/20'
    )}>
      {isError
        ? <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        : <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />}
      <div className="space-y-0.5 min-w-0">
        <p className={cn('font-medium', isError ? 'text-red-400' : 'text-yellow-400')}>
          {issue.message}
        </p>
        {issue.suggestion && (
          <p className="text-muted-foreground text-xs">{issue.suggestion}</p>
        )}
        <Badge variant="outline" className="text-xs px-1.5 py-0 mt-1">
          {issue.field}
        </Badge>
      </div>
    </div>
  )
}

export function ComplianceChecker({ adGroupName = 'Grupo de Anúncio', headlines, descriptions, className }: ComplianceCheckerProps) {
  const [issues, setIssues] = useState<ComplianceIssue[] | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [hasRun, setHasRun] = useState(false)

  function runCheck() {
    const { issues: found } = validateAdGroup(adGroupName, headlines, descriptions)
    const s = getComplianceScore(found)
    setIssues(found)
    setScore(s)
    setExpanded(true)
    setHasRun(true)
  }

  const errors   = issues?.filter(i => i.severity === 'error') ?? []
  const warnings = issues?.filter(i => i.severity === 'warning') ?? []

  const scoreColor =
    score === null ? 'text-muted-foreground' :
    score >= 80    ? 'text-green-400'  :
    score >= 50    ? 'text-yellow-400' :
                     'text-red-400'

  const ScoreIcon =
    score === null  ? ShieldCheck :
    score >= 80     ? ShieldCheck :
    score >= 50     ? ShieldAlert :
                      ShieldX

  return (
    <div className={cn('space-y-3', className)}>
      {/* Trigger button */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant={hasRun && score !== null && score < 80 ? 'destructive' : 'outline'}
          size="sm"
          onClick={runCheck}
          className={cn(
            'gap-2',
            hasRun && score !== null && score >= 80 && 'border-green-500/40 text-green-400 hover:bg-green-500/10'
          )}
        >
          <ShieldCheck className="h-4 w-4" />
          Verificar Conformidade
        </Button>

        {score !== null && (
          <div className="flex items-center gap-2">
            <ScoreIcon className={cn('h-4 w-4', scoreColor)} />
            <span className={cn('text-sm font-semibold', scoreColor)}>
              Score {score}/100
            </span>
            {errors.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {errors.length} erro{errors.length > 1 ? 's' : ''}
              </Badge>
            )}
            {warnings.length > 0 && (
              <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-500/30">
                {warnings.length} aviso{warnings.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Issues list */}
      {issues !== null && issues.length > 0 && (
        <div className="rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setExpanded(v => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium bg-muted/40 hover:bg-muted/60 transition-colors"
          >
            <span>Problemas encontrados ({issues.length})</span>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {expanded && (
            <div className="p-3 space-y-2">
              {errors.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-red-400">
                    Erros ({errors.length})
                  </p>
                  {errors.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                </div>
              )}
              {warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400 mt-2">
                    Avisos ({warnings.length})
                  </p>
                  {warnings.map((issue, i) => <IssueRow key={i} issue={issue} />)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* All clear */}
      {issues !== null && issues.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-green-500/20 bg-green-500/5 px-3 py-2.5 text-sm text-green-400">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Nenhum problema encontrado. Anúncio em conformidade com as políticas do Google Ads.
        </div>
      )}
    </div>
  )
}
