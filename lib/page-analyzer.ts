import * as cheerio from 'cheerio'
import type { PageAnalysisResult } from '@/types'
import { isValidUrl } from '@/lib/utils'

const TIMEOUT_MS = 10000

async function fetchPage(
  url: string,
  maxRetries = 3,
  attempt = 0
): Promise<{ html: string; finalUrl: string }> {
  const delays = [0, 1000, 2000, 3000]
  if (attempt > 0) {
    await new Promise((resolve) => setTimeout(resolve, delays[attempt]))
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    return { html, finalUrl: response.url || url }
  } catch (error) {
    if (attempt < maxRetries - 1) {
      return fetchPage(url, maxRetries, attempt + 1)
    }
    throw error
  }
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
    if (text && text.length > 2) results.push(text.substring(0, 500))
    return true
  })
  return results
}

function extractBenefits($: cheerio.CheerioAPI): string[] {
  const keywords = [
    'benefício', 'vantagem', 'ganho', 'melhora', 'reduz', 'aumenta',
    'emagrece', 'elimina', 'fortalece', 'potencializa', 'acelera',
  ]
  const benefits: string[] = []
  const seen = new Set<string>()

  $('p, li, span, div').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (keywords.some((kw) => text.toLowerCase().includes(kw)) && text.length > 10 && text.length <= 200) {
      const key = text.toLowerCase().substring(0, 50)
      if (!seen.has(key)) { seen.add(key); benefits.push(text) }
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
      if (!seen.has(key)) { seen.add(key); features.push(text) }
    }
    return true
  })

  return features.slice(0, 10)
}

function extractCTAs($: cheerio.CheerioAPI): string[] {
  const ctaKeywords = [
    'comprar', 'solicitar', 'saber mais', 'adquirir', 'garantir',
    'pedir', 'quero', 'aproveitar', 'acessar', 'começar',
  ]
  const ctas: string[] = []
  const seen = new Set<string>()

  $('button, a, input[type="submit"], input[type="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    const val = $(el).attr('value') || ''
    const fullText = text || val
    if (ctaKeywords.some((kw) => fullText.toLowerCase().includes(kw)) && fullText.length > 2 && fullText.length <= 80) {
      const key = fullText.toLowerCase().substring(0, 40)
      if (!seen.has(key)) { seen.add(key); ctas.push(fullText) }
    }
  })

  return ctas.slice(0, 5)
}

function extractPrice($: cheerio.CheerioAPI): string | null {
  const matches = $('body').text().match(/R\$\s*[\d.,]+/g)
  return matches ? matches[0].replace(/\s+/g, ' ').trim() : null
}

function extractOffers($: cheerio.CheerioAPI): string[] {
  const keywords = ['kit', 'combo', 'oferta', 'promoção', 'desconto', 'grátis', 'bônus']
  const offers: string[] = []
  const seen = new Set<string>()

  $('p, span, div, h2, h3, strong').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (keywords.some((kw) => text.toLowerCase().includes(kw)) && text.length > 5 && text.length <= 150) {
      const key = text.toLowerCase().substring(0, 40)
      if (!seen.has(key)) { seen.add(key); offers.push(text) }
    }
    if (offers.length >= 5) return false
    return true
  })

  return offers
}

function extractTrustElements($: cheerio.CheerioAPI): string[] {
  const keywords = [
    'certificado', 'aprovado', 'garantia', 'depoimento', 'anvisa', 'fda',
    'comprovado', 'testado', 'seguro', 'confiável', 'avaliação',
  ]
  const elements: string[] = []
  const seen = new Set<string>()

  $('p, span, div, h2, h3, strong, small').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
    if (keywords.some((kw) => text.toLowerCase().includes(kw)) && text.length > 5 && text.length <= 200) {
      const key = text.toLowerCase().substring(0, 40)
      if (!seen.has(key)) { seen.add(key); elements.push(text) }
    }
    if (elements.length >= 5) return false
    return true
  })

  return elements
}

function inferProductName(title: string, h1: string[], metaDescription: string): string {
  for (const source of [title, ...h1, metaDescription].filter(Boolean)) {
    const capitalized = source.split(/\s+/)
      .filter((w) => w.length > 3 && /^[A-ZÁÉÍÓÚÂÊÔÃÕÇÜ]/.test(w))
    if (capitalized.length > 0) return capitalized.slice(0, 3).join(' ')
  }
  return title ? title.split(/\s+/).slice(0, 3).join(' ') : 'Produto'
}

export async function analyzePage(inputUrl: string): Promise<PageAnalysisResult> {
  if (!isValidUrl(inputUrl)) {
    throw new Error(
      'URL inválida. Use uma URL completa com http:// ou https:// e certifique-se de que não é localhost.'
    )
  }

  let html: string

  try {
    const result = await fetchPage(inputUrl)
    html = result.html
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Não foi possível acessar a página: ${message}`)
  }

  const $ = cheerio.load(html)

  // Remove noise before content extraction
  $('script, style, noscript, iframe, svg').remove()

  const title = $('title').text().replace(/\s+/g, ' ').trim().substring(0, 500)
  const metaDescription =
    $('meta[name="description"]').attr('content')?.replace(/\s+/g, ' ').trim().substring(0, 500) || ''

  const h1 = extractHeadlines($, 'h1', 3)
  const h2 = extractHeadlines($, 'h2', 3)
  const h3 = extractHeadlines($, 'h3', 3)
  const benefits   = extractBenefits($)
  const features   = extractFeatures($)
  const ctas       = extractCTAs($)
  const price      = extractPrice($)
  const offers     = extractOffers($)
  const trustElements = extractTrustElements($)
  const productName   = inferProductName(title, h1, metaDescription)

  return {
    url: inputUrl,
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
