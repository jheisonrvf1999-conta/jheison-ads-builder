import type { ScoredKeyword } from '@/types'
import { removeAccents } from '@/lib/utils'

const PURCHASE_INTENT_WORDS = [
  'comprar',
  'compre',
  'buy',
  'precio',
  'prix',
  'adquirir',
  'pedir',
  'encomendar',
]

const NEGATIVE_WORDS_FREE = ['grátis', 'gratis', 'free', 'download', 'baixar']
const NEGATIVE_WORDS_DIGITAL = ['pdf', 'ebook', 'e-book', 'apostila']
const NEGATIVE_WORDS_COMPLAINT = [
  'reclamação',
  'reclamacão',
  'problema',
  'não funciona',
  'nao funciona',
  'fraude',
  'golpe',
  'fake',
  'mentira',
]
const NEGATIVE_WORDS_TUTORIAL = [
  'como fazer',
  'tutorial',
  'passo a passo',
  'como usar',
  'como funciona',
  'diy',
]

export function scoreKeyword(keyword: string, productName: string): number {
  const lower = removeAccents(keyword.toLowerCase())
  const lowerProduct = removeAccents(productName.toLowerCase())
  let score = 0

  // +50 if contains purchase intent
  if (PURCHASE_INTENT_WORDS.some((w) => lower.includes(removeAccents(w)))) {
    score += 50
  }

  // +30 if contains product name
  if (lowerProduct && lower.includes(lowerProduct)) {
    score += 30
  }

  // +20 if 4+ words (long tail)
  const wordCount = keyword.trim().split(/\s+/).length
  if (wordCount >= 4) {
    score += 20
  }

  // -40 if contains free/download words
  if (NEGATIVE_WORDS_FREE.some((w) => lower.includes(removeAccents(w)))) {
    score -= 40
  }

  // -30 if contains digital product words
  if (NEGATIVE_WORDS_DIGITAL.some((w) => lower.includes(removeAccents(w)))) {
    score -= 30
  }

  // -50 if contains complaint words
  if (NEGATIVE_WORDS_COMPLAINT.some((w) => lower.includes(removeAccents(w)))) {
    score -= 50
  }

  // -35 if contains tutorial words
  if (NEGATIVE_WORDS_TUTORIAL.some((w) => lower.includes(removeAccents(w)))) {
    score -= 35
  }

  return score
}

export function determineMatchType(
  score: number
): 'Exact' | 'Phrase' | 'Broad' {
  if (score >= 50) return 'Exact'
  if (score >= 20) return 'Phrase'
  return 'Broad'
}

export function expandKeywords(
  productName: string,
  benefits: string[] = []
): string[] {
  const keywords: string[] = []

  keywords.push(`${productName} comprar`)
  keywords.push(`comprar ${productName}`)
  keywords.push(`onde comprar ${productName}`)
  keywords.push(`${productName} preço hoje`)
  keywords.push(`${productName} original`)
  keywords.push(`${productName} site oficial`)
  keywords.push(`${productName} funciona`)
  keywords.push(`${productName} é bom`)
  keywords.push(`${productName} vale a pena`)
  keywords.push(`${productName} como usar`)

  // Add benefit-based keywords (max 3 benefits)
  const topBenefits = benefits.slice(0, 3)
  for (const benefit of topBenefits) {
    // Extract key words from benefit (first 3 words)
    const benefitWords = benefit
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 3)
      .join(' ')
    if (benefitWords) {
      keywords.push(`${productName} ${benefitWords}`)
    }
  }

  // Remove duplicates
  return [...new Set(keywords)].filter((k) => k.trim().length > 0)
}

export function generateKeywords(
  productName: string,
  benefits: string[] = [],
  url = ''
): ScoredKeyword[] {
  const rawKeywords = expandKeywords(productName, benefits)

  // Extract domain-based keywords if URL provided
  if (url) {
    try {
      const domain = new URL(url).hostname.replace('www.', '').split('.')[0]
      if (domain && domain.length > 2) {
        rawKeywords.push(domain)
        rawKeywords.push(`${domain} comprar`)
        rawKeywords.push(`${domain} oficial`)
      }
    } catch {
      // Invalid URL, skip
    }
  }

  const scoredKeywords: ScoredKeyword[] = rawKeywords.map((keyword) => {
    const score = scoreKeyword(keyword, productName)
    const matchType = determineMatchType(score)

    return {
      keyword: keyword.toLowerCase().trim(),
      score,
      matchType,
      selected: score > 0, // Auto-select positive score keywords
      isNegative: score < -20, // Mark very negative as negative keywords
    }
  })

  // Sort by score descending
  return scoredKeywords.sort((a, b) => b.score - a.score)
}

export function addCustomKeyword(
  keyword: string,
  productName: string
): ScoredKeyword {
  const score = scoreKeyword(keyword, productName)
  const matchType = determineMatchType(score)

  return {
    keyword: keyword.toLowerCase().trim(),
    score,
    matchType,
    selected: true,
    isNegative: false,
  }
}

export function filterPositiveKeywords(keywords: ScoredKeyword[]): ScoredKeyword[] {
  return keywords.filter((k) => k.selected && !k.isNegative)
}

export function filterNegativeKeywords(keywords: ScoredKeyword[]): ScoredKeyword[] {
  return keywords.filter((k) => k.isNegative)
}

export const STANDARD_NEGATIVE_KEYWORDS = [
  'grátis',
  'download',
  'pdf',
  'ebook',
  'reclamação',
  'funciona mesmo',
  'vale a pena mesmo',
  'antes e depois',
  'review negativo',
  'reclame aqui',
  'pirata',
  'cracked',
  'torrent',
  'fake',
  'golpe',
  'fraude',
  'não funciona',
]
