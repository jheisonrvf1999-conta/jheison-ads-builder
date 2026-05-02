import * as cheerio from 'cheerio'
import type { PageAnalysisResult } from '@/types'
import { isValidUrl } from '@/lib/utils'

const TIMEOUT_MS = 10000

const KNOWN_CHECKOUTS = ['monetizze.com', 'hotmart.com', 'kiwify.com', 'eduzz.com', 'braip.com']

const SOCIAL_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'youtube.com',
  'whatsapp.com', 'telegram.me', 't.me', 'linkedin.com', 'tiktok.com',
  'pinterest.com', 'snapchat.com',
]

const CTA_KEYWORDS = [
  'comprar', 'compre', 'quero', 'garantir', 'garantia', 'acessar', 'acesse',
  'continuar', 'clique', 'saiba mais', 'ver mais', 'adquirir', 'solicitar',
  'pedir', 'assinar', 'começar', 'inscrever', 'matricular', 'aproveitar',
  'quero agora', 'comprar agora', 'sim quero', 'eu quero', 'pegar',
]

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

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

function isKnownCheckout(url: string): boolean {
  const domain = getDomain(url)
  return KNOWN_CHECKOUTS.some((c) => domain === c || domain.endsWith(`.${c}`))
}

function isSocialOrIrrelevant(url: string): boolean {
  const domain = getDomain(url)
  return SOCIAL_DOMAINS.some((s) => domain === s || domain.endsWith(`.${s}`))
}

function findCtaUrl($: cheerio.CheerioAPI, pageUrl: string): string | null {
  const pageDomain = getDomain(pageUrl)
  const candidates: { url: string; score: number }[] = []

  $('a[href]').each((_, el) => {
    const rawHref = ($(el).attr('href') || '').trim()
    if (!rawHref || rawHref === '#' || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:') || rawHref.startsWith('javascript:')) return

    let href: string
    try {
      href = new URL(rawHref, pageUrl).toString()
    } catch {
      return
    }

    const hrefDomain = getDomain(href)
    if (!hrefDomain || hrefDomain === pageDomain) return
    if (isSocialOrIrrelevant(href)) return

    const text = $(el).text().replace(/\s+/g, ' ').trim().toLowerCase()
    const ariaLabel = ($(el).attr('aria-label') || '').toLowerCase()
    const titleAttr = ($(el).attr('title') || '').toLowerCase()
    const fullText = `${text} ${ariaLabel} ${titleAttr}`

    let score = 1 // base: external non-social link

    if (CTA_KEYWORDS.some((kw) => fullText.includes(kw))) score += 10
    if (isKnownCheckout(href)) score += 5

    const classes = ($(el).attr('class') || '').toLowerCase()
    const parentTag = ($(el).parent().prop('tagName') || '').toLowerCase()
    const parentClasses = ($(el).parent().attr('class') || '').toLowerCase()

    if (
      classes.includes('btn') ||
      classes.includes('button') ||
      classes.includes('cta') ||
      parentTag === 'button' ||
      parentClasses.includes('btn') ||
      parentClasses.includes('button') ||
      parentClasses.includes('cta')
    ) {
      score += 3
    }

    candidates.push({ url: href, score })
  })

  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0].url
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
    'benefício', 'vantagem', 'ganho', 'melhora', 'reduz', 'aumenta',
    'emagrece', 'elimina', 'fortalece', 'potencializa', 'acelera',
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
    'comprar', 'solicitar', 'saber mais', 'adquirir', 'garantir',
    'pedir', 'quero', 'aproveitar', 'acessar', 'começar',
  ]
  const ctas: string[] = []
  const seen = new Set<string>()

  $('button, a, input[type="submit"], input[type="button"]').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim()
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
    'certificado', 'aprovado', 'garantia', 'depoimento', 'anvisa', 'fda',
    'comprovado', 'testado', 'seguro', 'confiável', 'avaliação',
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

function inferProductName(title: string, h1: string[], metaDescription: string): string {
  const sources = [title, ...(h1 || []), metaDescription].filter(Boolean)
  for (const source of sources) {
    const words = source.split(/\s+/).filter((w) => w.length > 3)
    const capitalizedWords = words.filter((w) => /^[A-ZÁÉÍÓÚÂÊÔÃÕÇÜ]/.test(w))
    if (capitalizedWords.length > 0) {
      return capitalizedWords.slice(0, 3).join(' ')
    }
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
  let effectiveUrl: string
  let salesPageUrl: string | undefined

  // Step 1: fetch the initial URL (fetch follows HTTP redirects automatically)
  try {
    const result = await fetchPage(inputUrl)
    html = result.html
    effectiveUrl = result.finalUrl

    // If HTTP redirect took us to a different domain, we're already at the sales page
    if (getDomain(effectiveUrl) !== getDomain(inputUrl)) {
      salesPageUrl = effectiveUrl
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    throw new Error(`Não foi possível acessar a página: ${message}`)
  }

  let $ = cheerio.load(html)

  // Step 2: if not already redirected, look for CTA links on the presell page
  if (!salesPageUrl) {
    const ctaUrl = findCtaUrl($, effectiveUrl)

    if (ctaUrl) {
      try {
        // Fetch once (no retries) to keep latency low for secondary fetches
        const ctaResult = await fetchPage(ctaUrl, 1)
        let targetHtml = ctaResult.html
        let targetUrl = ctaResult.finalUrl

        // Step 3: if landed on a known checkout, try one more level
        if (isKnownCheckout(targetUrl)) {
          const checkout$ = cheerio.load(targetHtml)
          const deepUrl = findCtaUrl(checkout$, targetUrl)
          if (deepUrl && !isKnownCheckout(deepUrl)) {
            try {
              const deepResult = await fetchPage(deepUrl, 1)
              targetHtml = deepResult.html
              targetUrl = deepResult.finalUrl
            } catch {
              // stay with checkout page
            }
          }
        }

        $ = cheerio.load(targetHtml)
        salesPageUrl = targetUrl
      } catch {
        // Can't follow CTA — analyze original page as-is
      }
    }
  } else if (isKnownCheckout(effectiveUrl)) {
    // HTTP redirect landed on a known checkout — try one more level
    const checkout$ = cheerio.load(html)
    const deepUrl = findCtaUrl(checkout$, effectiveUrl)
    if (deepUrl) {
      try {
        const deepResult = await fetchPage(deepUrl, 1)
        $ = cheerio.load(deepResult.html)
        salesPageUrl = deepResult.finalUrl
      } catch {
        // stay with checkout page
      }
    }
  }

  // Remove noise before extraction
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
    url: inputUrl,
    salesPageUrl,
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
