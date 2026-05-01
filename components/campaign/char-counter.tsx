'use client'

import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CharCounterProps {
  value: string
  max: number
  className?: string
  isUtf8?: boolean
}

function countBytes(str: string): number {
  let bytes = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.codePointAt(i) ?? 0
    if (code <= 0x7f)       bytes += 1
    else if (code <= 0x7ff) bytes += 2
    else if (code <= 0xffff) bytes += 3
    else { bytes += 4; i++ } // surrogate pair — skip extra char
  }
  return bytes
}

export function CharCounter({ value, max, className, isUtf8 = false }: CharCounterProps) {
  const count = isUtf8 ? countBytes(value) : value.length
  const pct = count / max
  const over = count > max
  const warn = !over && pct >= 0.87 // 87% threshold for yellow

  return (
    <span
      className={cn(
        'flex items-center gap-1 text-xs font-mono tabular-nums transition-colors',
        over  ? 'text-red-500'    :
        warn  ? 'text-yellow-500' :
                'text-muted-foreground',
        className
      )}
      aria-live="polite"
      aria-label={`${count} de ${max} caracteres`}
    >
      {over && <AlertTriangle className="h-3 w-3 shrink-0" />}
      <span className={cn(over && 'font-bold')}>{count}</span>
      <span className="opacity-50">/</span>
      <span>{max}</span>
    </span>
  )
}

// Inline variant: wraps an input element and its counter in a relative div
interface CharCounterInputProps {
  value: string
  max: number
  isUtf8?: boolean
  children: React.ReactNode
}

export function CharCounterWrapper({ value, max, isUtf8, children }: CharCounterInputProps) {
  const count = isUtf8 ? countBytes(value) : value.length
  const over = count > max
  const warn = !over && count / max >= 0.87

  return (
    <div className="relative">
      {children}
      <div
        className={cn(
          'pointer-events-none absolute bottom-2 right-2.5 flex items-center gap-0.5 text-xs font-mono tabular-nums',
          over  ? 'text-red-500'    :
          warn  ? 'text-yellow-500' :
                  'text-muted-foreground/60'
        )}
      >
        {over && <AlertTriangle className="h-3 w-3" />}
        <span className={cn(over && 'font-bold')}>{count}</span>
        <span className="opacity-50">/{max}</span>
      </div>
    </div>
  )
}
