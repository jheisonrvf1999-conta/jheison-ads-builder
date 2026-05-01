import type { ComplianceIssue } from '@/types'

const BANNED_WORDS: Record<string, string> = {
  revolucionário: '',
  revolucionaria: '',
  'melhor do mundo': 'excelente',
  'melhor do mercado': 'destaque no mercado',
  único: 'diferenciado',
  unico: 'diferenciado',
  cura: 'auxilia',
  'resolve definitivamente': 'pode ajudar',
  garante: 'oferece',
  '100% comprovado': 'comprovado',
  '100% garantido': 'comprovado',
  '100% eficaz': 'eficaz',
  eliminado: 'reduzido',
  'cura definitiva': 'auxilia no tratamento',
  milagroso: 'eficaz',
  milagre: 'resultado',
  'sem esforço': 'com facilidade',
  instantâneo: 'rápido',
  instantaneo: 'rápido',
}

const EXCESSIVE_PROMISE_PATTERNS = [
  /\b100%\s*(garantid[oa]|comprovad[oa]|segur[oa]|eficaz)\b/gi,
  /\bperde[r]?\s*\d+\s*kg\s*em\s*\d+\s*dias?\b/gi,
  /\bgaranti[ao]\s*absolut[ao]\b/gi,
  /\bjamais\s*(falha|erra)\b/gi,
  /\bnunc[ao]\s*(mais|volta)\b/gi,
  /\bsem\s*nenhum\s*(risco|esforço|sacrifício)\b/gi,
]

const HEADLINE_MAX = 30
const DESCRIPTION_MAX = 90

export function checkText(text: string, field: string): ComplianceIssue[] {
  const issues: ComplianceIssue[] = []

  if (!text) return issues

  const lowerText = text.toLowerCase()

  // Check char limits
  if (field === 'headline' && text.length > HEADLINE_MAX) {
    issues.push({
      field,
      type: 'char_limit',
      message: `Headline excede ${HEADLINE_MAX} caracteres (atual: ${text.length})`,
      severity: 'error',
      suggestion: text.substring(0, HEADLINE_MAX),
    })
  }

  if (field === 'description' && text.length > DESCRIPTION_MAX) {
    issues.push({
      field,
      type: 'char_limit',
      message: `Descrição excede ${DESCRIPTION_MAX} caracteres (atual: ${text.length})`,
      severity: 'error',
      suggestion: text.substring(0, DESCRIPTION_MAX),
    })
  }

  // Check banned words
  for (const [banned, replacement] of Object.entries(BANNED_WORDS)) {
    if (lowerText.includes(banned.toLowerCase())) {
      issues.push({
        field,
        type: 'banned_word',
        message: `Palavra banida encontrada: "${banned}"`,
        severity: 'error',
        suggestion: replacement
          ? `Substitua por: "${replacement}"`
          : 'Remova esta palavra',
      })
    }
  }

  // Check excessive promises
  for (const pattern of EXCESSIVE_PROMISE_PATTERNS) {
    if (pattern.test(text)) {
      issues.push({
        field,
        type: 'excessive_promise',
        message: 'Promessa excessiva detectada. O Google Ads pode reprovar este anúncio.',
        severity: 'warning',
        suggestion: 'Reformule para ser mais neutro e específico',
      })
    }
    // Reset regex state
    pattern.lastIndex = 0
  }

  return issues
}

export function checkAd(
  headlines: Array<{ text: string }>,
  descriptions: Array<{ text: string }>
): ComplianceIssue[] {
  const allIssues: ComplianceIssue[] = []

  for (const headline of headlines) {
    const issues = checkText(headline.text, 'headline')
    allIssues.push(...issues)
  }

  for (const description of descriptions) {
    const issues = checkText(description.text, 'description')
    allIssues.push(...issues)
  }

  return allIssues
}

export function sanitizeForAds(text: string): string {
  if (!text) return ''

  let sanitized = text

  // Replace banned words with neutral alternatives
  for (const [banned, replacement] of Object.entries(BANNED_WORDS)) {
    const regex = new RegExp(banned, 'gi')
    sanitized = sanitized.replace(regex, replacement)
  }

  // Remove excessive promises
  for (const pattern of EXCESSIVE_PROMISE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '')
    pattern.lastIndex = 0
  }

  // Clean up extra spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim()

  // Remove double punctuation
  sanitized = sanitized.replace(/([!?,.]){2,}/g, '$1')

  return sanitized
}

export function validateAdGroup(
  adGroupName: string,
  headlines: Array<{ text: string }>,
  descriptions: Array<{ text: string }>
): { valid: boolean; issues: ComplianceIssue[] } {
  const issues = checkAd(headlines, descriptions)

  if (headlines.length < 3) {
    issues.push({
      field: 'headlines',
      type: 'policy_violation',
      message: `Mínimo 3 headlines necessário (atual: ${headlines.length})`,
      severity: 'error',
    })
  }

  if (headlines.length > 15) {
    issues.push({
      field: 'headlines',
      type: 'policy_violation',
      message: `Máximo 15 headlines permitido (atual: ${headlines.length})`,
      severity: 'error',
    })
  }

  if (descriptions.length < 2) {
    issues.push({
      field: 'descriptions',
      type: 'policy_violation',
      message: `Mínimo 2 descriptions necessário (atual: ${descriptions.length})`,
      severity: 'error',
    })
  }

  if (descriptions.length > 4) {
    issues.push({
      field: 'descriptions',
      type: 'policy_violation',
      message: `Máximo 4 descriptions permitido (atual: ${descriptions.length})`,
      severity: 'error',
    })
  }

  const errors = issues.filter((i) => i.severity === 'error')

  return {
    valid: errors.length === 0,
    issues,
  }
}

export function getComplianceScore(issues: ComplianceIssue[]): number {
  if (issues.length === 0) return 100

  const errorCount = issues.filter((i) => i.severity === 'error').length
  const warningCount = issues.filter((i) => i.severity === 'warning').length

  const score = Math.max(0, 100 - errorCount * 20 - warningCount * 10)
  return score
}
