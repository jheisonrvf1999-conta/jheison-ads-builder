import * as cheerio from 'cheerio'
import type { PageAnalysisResult } from '@/types'
import { isValidUrl } from '@/lib/utils'

const TIMEOUT_MS = 10000

async function fetchWithRetry(url: string, attempt = 0): Promise<string> {
  const delays = [0, 1000, 2000, 3000]
  if (attempt > 0) {
    await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; AdsBuilder/1.0; +https://adsbuilder.com)',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.text()
  } catch (error) {
    if (attempt < 3) {
      return fetchWithRetry(url, attempt + 1)
    }
    throw error
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractText(el: any, maxLength = 500): string {
  const text = el.text().replace(/\s+/g, ' ').trim()
  return text.substring(0, maxLength)
}

function extractHeadlines(
  $: cheerio.CheerioAPI,
  selector: string,
  limit = 3
): string[] {
  const results: string[] = []
  $(selector).each((i, el) => {
    if (i >= limit) return false
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text && text.length > 2) {
      results.push(text.substring(0, 500))
    }
    return true
  })
  return results
}

function extractBenefits($: cheerio.CheerioAPI): string[] {
  const benefitKeywords = [
    'benefício',
    'vantagem',
    'ganho',
    'melhora',
    'reduz',
    'aumenta',
    'emagrece',
    'elimina',
    'fortalece',
    'potencializa',
    'acelera',
    'melhora',
  ]

  const benefits: string[] = []
  const seen = new Set<string>()

  $('p, li, span, div').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    const lowerText = text.toLowerCase()

    const hasBenefit = benefitKeywords.some((kw) => lowerText.includes(kw))
    if (hasBenefit && text.length > 10 && text.length <= 200) {
      const key = text.toLowerCase().substring(0, 50)
      if (!seen.has(key)) {
        seen.add(key)
        benefits.push(text)
      }
    }

    if (benefits.length >= 8) return false
    return true
  })

  return benefits.slice(0, 8)
}

function extractFeatures($: cheerio.CheerioAPI): string[] {
  const features: string[] = []
  const seen = new Set<string>()

  $('li').each((i, el) => {
    if (i >= 30) return false
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (text && text.length > 5 && text.length <= 150) {
      const key = text.toLowerCase().substring(0, 40)
      if (!seen.has(key)) {
        seen.add(key)
        features.push(text)
      }
    }
    return true
  })

  return features.slice(0, 10)
}

function extractCTAs($: cheerio.CheerioAPI): string[] {
  const ctaKeywords = [
    'comprar',
    'solicitar',
    'saber mais',
    'adquirir',
    'garantir',
    'pedir',
    'quero',
    'aproveitar',
    'acessar',
    'começar',
  ]

  const ctas: string[] = []
  const seen = new Set<string>()

  $('button, a, input[type="submit"], input[type="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (!text) return

    const val = $(el).attr('value') || ''
    const fullText = text || val

    const lowerText = fullText.toLowerCase()
    const isCTA = ctaKeywords.some((kw) => lowerText.includes(kw))

    if (isCTA && fullText.length > 2 && fullText.length <= 80) {
      const key = fullText.toLowerCase().substring(0, 40)
      if (!seen.has(key)) {
        seen.add(key)
        ctas.push(fullText)
      }
    }
  })

  return ctas.slice(0, 5)
}

function extractPrice($: cheerio.CheerioAPI): string | null {
  const priceRegex = /R\$\s*[\d.,]+/g
  const fullText = $('body').text()
  const matches = fullText.match(priceRegex)

  if (matches && matches.length > 0) {
    // Return the most prominent (first meaningful) price
    return matches[0].replace(/\s+/g, ' ').trim()
  }

  return null
}

function extractOffers($: cheerio.CheerioAPI): string[] {
  const offerKeywords = ['kit', 'combo', 'oferta', 'promoção', 'desconto', 'grátis', 'bônus']
  const offers: string[] = []
  const seen = new Set<string>()

  $('p, span, div, h2, h3, strong').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    const lowerText = text.toLowerCase()

    if (offerKeywords.some((kw) => lowerText.includes(kw)) && text.length > 5 && text.length <= 150) {
      const key = text.toLowerCase().substring(0, 40)
      if (!seen.has(key)) {
        seen.add(key)
        offers.push(text)
      }
    }

    if (offers.length >= 5) return false
    return true
  })

  return offers
}

function extractTrustElements($: cheerio.CheerioAPI): string[] {
  const trustKeywords = [
    'certificado',
    'aprovado',
    'garantia',
    'depoimento',
    'anvisa',
    'fda',
    'comprovado',
    'testado',
    'seguro',
    'confiável',
    'avaliação',
  ]

  const trustElements: string[] = []
  const seen = new Set<string>()

  $('p, span, div, h2, h3, strong, small').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    const lowerText = text.toLowerCase()

    if (trustKeywords.some((kw) => lowerText.includes(kw)) && text.length > 5 && text.length <= 200) {
      const key = text.toLowerCase().substring(0, 40)
      if (!seen.has(key)) {
        seen.add(key)
        trustElements.push(text)
      }
    }

    if (trustElements.length >= 5) return false
    return true
  })

  return trustElements
}

function inferProductName(
  title: string,
  h1: string[],
  metaDescription: string
): string {
  // Try to extract product name from title
  const sources = [title, ...(h1 || []), metaDescription].filter(Boolean)

  for (const source of sources) {
    // Look for capitalized words that could be product names
    const words = source.split(/\s+/).filter((w) => w.length > 3)
    const capitalizedWords = words.filter((w) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇÜ]/.test(w))

    if (capitalizedWords.length > 0) {
      // Return first 1-3 capitalized words as product name
      return capitalizedWords.slice(0, 3).join(' ')
    }
  }

  return title ? title.split(/\s+/).slice(0, 3).join(' ') : 'Produto'
}

export async function analyzePage(url: string): Promise<PageAnalysisResult> {
  if (!isValidUrl(url)) {
    throw new Error(
      'URL inválida. Use uma URL completa com http:// ou https:// e certifique-se de que não é localhost.'
    )
  }

  let html: string
  try {
    html = await fetchWithRetry(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Não foi possível acessar a página: ${message}`)
  }

  const $ = cheerio.load(html)

  // Remove script, style, noscript tags before extracting text
  $('script, style, noscript, iframe, svg').remove()

  const title = $('title').text().replace(/\s+/g, ' ').trim().substring(0, 500)
  const metaDescription =
    $('meta[name="description"]').attr('content')?.replace(/\s+/g, ' ').trim().substring(0, 500) || ''

  const h1 = extractHeadlines($, 'h1', 3)
  const h2 = extractHeadlines($, 'h2', 3)
  const h3 = extractHeadlines($, 'h3', 3)

  const benefits = extractBenefits($)
  const features = extractFeatures($)
  const ctas = extractCTAs($)
  const price = extractPrice($)
  const offers = extractOffers($)
  const trustElements = extractTrustElements($)

  const productName = inferProductName(title, h1, metaDescription)

  return {
    url,
    title,
    metaDescription,
    h1,
    h2,
    h3,
    benefits,
    features,
    ctas,
    price,
    offers,
    trustElements,
    productName,
    analyzedAt: new Date().toISOString(),
  }
}
