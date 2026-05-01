import type {
  Campaign,
  CampaignInput,
  AdGroup,
  RSAAd,
  RSAHeadline,
  RSADescription,
  CampaignExtensions,
  Sitelink,
  ScoredKeyword,
} from '@/types'
import { truncateHeadline, truncateDescription, buildUtmUrl, generateId } from '@/lib/utils'
import { STANDARD_NEGATIVE_KEYWORDS } from '@/lib/keyword-scorer'
import { sanitizeForAds } from '@/lib/compliance'

function makeHeadline(text: string): RSAHeadline {
  return { text: truncateHeadline(sanitizeForAds(text)) }
}

function makeDescription(text: string): RSADescription {
  return { text: truncateDescription(sanitizeForAds(text)) }
}

function generateBrandAdGroupAds(input: CampaignInput): RSAAd[] {
  const { productName, benefits, offer, affiliateUrl } = input
  const campaignName = `${productName} - Marca Oficial`
  const adGroupName = 'Marca Oficial'
  const finalUrl = buildUtmUrl(affiliateUrl, campaignName, adGroupName)

  const benefit1 = benefits[0] ? benefits[0].substring(0, 25) : 'Resultado Comprovado'
  const benefit2 = benefits[1] ? benefits[1].substring(0, 25) : 'Fórmula Exclusiva'
  const benefit3 = benefits[2] ? benefits[2].substring(0, 25) : 'Alta Qualidade'

  const offerText = offer ? offer.substring(0, 25) : 'Oferta Especial Hoje'

  const headlines: RSAHeadline[] = [
    makeHeadline(`${productName} Oficial`),
    makeHeadline(`Compre ${productName} Aqui`),
    makeHeadline(`${productName} Original`),
    makeHeadline(`Site Oficial ${productName}`),
    makeHeadline(`${productName} Garantido`),
    makeHeadline(benefit1),
    makeHeadline(benefit2),
    makeHeadline(benefit3),
    makeHeadline(offerText),
    makeHeadline('Frete Grátis Disponível'),
    makeHeadline('Parcele Sem Juros'),
    makeHeadline('Compra 100% Segura'),
    makeHeadline('Entrega Rápida'),
    makeHeadline('Garantia de Qualidade'),
    makeHeadline('Satisfação Garantida'),
  ]

  const descriptions: RSADescription[] = [
    makeDescription(
      `${productName} é o produto original com resultados comprovados. Compre agora no site oficial com garantia e entrega rápida.`
    ),
    makeDescription(
      `Adquira ${productName} com segurança. ${benefit1}. Parcelamento disponível e frete grátis para todo Brasil.`
    ),
    makeDescription(
      `${productName} original com garantia de satisfação. Compra segura, pagamento via PIX ou cartão. Aproveite!`
    ),
    makeDescription(
      `${offerText.substring(0, 40)}. Compre ${productName} hoje e tenha acesso a todos os benefícios. Clique aqui.`
    ),
  ]

  return [
    {
      id: generateId(),
      headlines: headlines.slice(0, 15),
      descriptions: descriptions.slice(0, 4),
      finalUrl,
      trackingTemplate: '{lpurl}?utm_source=google_ads&utm_medium=cpc',
      path1: productName.substring(0, 15).replace(/\s+/g, '-').toLowerCase(),
      path2: 'oficial',
    },
  ]
}

function generateSniperkAdGroupAds(input: CampaignInput): RSAAd[] {
  const { productName, benefits, differentials, offer, affiliateUrl } = input
  const campaignName = `${productName} - Sniper`
  const adGroupName = 'Comprar SNIPER'
  const finalUrl = buildUtmUrl(affiliateUrl, campaignName, adGroupName)

  const benefit1 = benefits[0] ? benefits[0].substring(0, 25) : 'Resultado Rápido'
  const benefit2 = benefits[1] ? benefits[1].substring(0, 20) : 'Alta Eficácia'
  const diff1 = differentials[0] ? differentials[0].substring(0, 25) : 'Fórmula Exclusiva'
  const offerText = offer ? offer.substring(0, 25) : 'Promoção Especial'

  const headlines: RSAHeadline[] = [
    makeHeadline(`Comprar ${productName}`),
    makeHeadline(`${productName} - Compre Já`),
    makeHeadline(`${productName} Melhor Preço`),
    makeHeadline(`Onde Comprar ${productName}`),
    makeHeadline(`${productName} Promoção`),
    makeHeadline(benefit1),
    makeHeadline(diff1),
    makeHeadline(offerText),
    makeHeadline('Compre com Desconto'),
    makeHeadline('Entrega em 24h'),
    makeHeadline('PIX com Desconto'),
    makeHeadline('Parcelas sem Juros'),
    makeHeadline(`${productName} ${benefit2}`),
    makeHeadline('Produto Original'),
    makeHeadline('Garantia de 30 Dias'),
  ]

  const descriptions: RSADescription[] = [
    makeDescription(
      `Compre ${productName} com segurança. ${benefit1}. Frete grátis, parcele sem juros e receba em casa.`
    ),
    makeDescription(
      `${productName}: ${diff1}. Adquira agora com o melhor preço. ${offerText}. Pague no PIX ou cartão.`
    ),
    makeDescription(
      `Garanta seu ${productName} agora. ${benefit2}. Produto original com garantia. Entrega rápida para todo Brasil.`
    ),
    makeDescription(
      `${offerText}. Aproveite e compre ${productName} hoje. Satisfação garantida ou seu dinheiro de volta.`
    ),
  ]

  return [
    {
      id: generateId(),
      headlines: headlines.slice(0, 15),
      descriptions: descriptions.slice(0, 4),
      finalUrl,
      trackingTemplate: '{lpurl}?utm_source=google_ads&utm_medium=cpc',
      path1: 'comprar',
      path2: productName.substring(0, 15).replace(/\s+/g, '-').toLowerCase(),
    },
  ]
}

function generateGenericAdGroupAds(input: CampaignInput): RSAAd[] {
  const { productName, benefits, category, affiliateUrl } = input
  const campaignName = `${productName} - Genérico`
  const adGroupName = 'Genérico'
  const finalUrl = buildUtmUrl(affiliateUrl, campaignName, adGroupName)

  const benefit1 = benefits[0] ? benefits[0].substring(0, 25) : 'Resultado Comprovado'
  const benefit2 = benefits[1] ? benefits[1].substring(0, 25) : 'Alta Qualidade'
  const categoryLabel = getCategoryLabel(category)

  const headlines: RSAHeadline[] = [
    makeHeadline(`${productName}`),
    makeHeadline(`${productName} Funciona`),
    makeHeadline(`${productName} Vale a Pena?`),
    makeHeadline(`Melhor ${categoryLabel}`),
    makeHeadline(`${categoryLabel} Eficaz`),
    makeHeadline(benefit1),
    makeHeadline(benefit2),
    makeHeadline(`${productName} Resultado`),
    makeHeadline('Confira os Benefícios'),
    makeHeadline('Produto Recomendado'),
    makeHeadline('Avaliação Positiva'),
    makeHeadline('Qualidade Comprovada'),
    makeHeadline(`${productName} Avaliação`),
    makeHeadline('Conheça o Produto'),
    makeHeadline('Veja Como Funciona'),
  ]

  const descriptions: RSADescription[] = [
    makeDescription(
      `${productName}: ${benefit1}. Descubra como funciona e veja os resultados. Produto de alta qualidade.`
    ),
    makeDescription(
      `Conheça ${productName} e seus benefícios. ${benefit2}. Clique para saber mais e fazer seu pedido.`
    ),
    makeDescription(
      `${productName} é reconhecido pela eficácia e qualidade. ${benefit1}. Confira agora e garanta o seu.`
    ),
    makeDescription(
      `Saiba tudo sobre ${productName}. Produto original, entrega rápida, preço justo. Acesse o site oficial.`
    ),
  ]

  return [
    {
      id: generateId(),
      headlines: headlines.slice(0, 15),
      descriptions: descriptions.slice(0, 4),
      finalUrl,
      trackingTemplate: '{lpurl}?utm_source=google_ads&utm_medium=cpc',
      path1: categoryLabel.toLowerCase().replace(/\s+/g, '-').substring(0, 15),
      path2: 'info',
    },
  ]
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    suplemento: 'Suplemento',
    software: 'Software',
    curso: 'Curso',
    ecommerce: 'Produto',
    servico: 'Serviço',
    ebook: 'E-book',
    consultoria: 'Consultoria',
    outro: 'Produto',
  }
  return labels[category] || 'Produto'
}

function generateExtensions(input: CampaignInput): CampaignExtensions {
  const { productName, benefits, affiliateUrl } = input

  const sitelinks: Sitelink[] = [
    {
      title: truncateHeadline('Como Funciona'),
      description1: truncateDescription(`Saiba como ${productName} funciona e seus benefícios`).substring(0, 35),
      description2: truncateDescription('Veja os resultados reais dos usuários').substring(0, 35),
      finalUrl: affiliateUrl,
    },
    {
      title: truncateHeadline('Comprar Agora'),
      description1: truncateDescription('Compra segura com garantia de satisfação').substring(0, 35),
      description2: truncateDescription('Parcele em até 12x sem juros').substring(0, 35),
      finalUrl: affiliateUrl,
    },
    {
      title: truncateHeadline('Benefícios'),
      description1: truncateDescription(benefits[0] || `Benefícios de ${productName}`).substring(0, 35),
      description2: truncateDescription(benefits[1] || 'Resultados comprovados').substring(0, 35),
      finalUrl: affiliateUrl,
    },
    {
      title: truncateHeadline('Garantia'),
      description1: truncateDescription('Garantia de satisfação ou reembolso').substring(0, 35),
      description2: truncateDescription('Produto 100% original e seguro').substring(0, 35),
      finalUrl: affiliateUrl,
    },
    {
      title: truncateHeadline('Entrega'),
      description1: truncateDescription('Entrega rápida para todo Brasil').substring(0, 35),
      description2: truncateDescription('Frete grátis em pedidos selecionados').substring(0, 35),
      finalUrl: affiliateUrl,
    },
    {
      title: truncateHeadline('Depoimentos'),
      description1: truncateDescription(`Veja o que dizem sobre ${productName}`).substring(0, 35),
      description2: truncateDescription('Clientes satisfeitos em todo Brasil').substring(0, 35),
      finalUrl: affiliateUrl,
    },
  ]

  return {
    sitelinks,
    callouts: [
      { text: 'Produto Original' },
      { text: 'Compra Segura' },
      { text: 'PIX e Cartão' },
      { text: 'Parcelamento s/ Juros' },
    ],
    structuredSnippets: [
      {
        header: 'Planos',
        values: ['30 dias', '90 dias', '150 dias', '240 dias'],
      },
    ],
  }
}

export function generateCampaign(input: CampaignInput): Campaign {
  const { productName, keywords, affiliateUrl } = input

  // Split keywords by ad group
  const brandKeywords: ScoredKeyword[] = keywords
    .filter((k) => k.selected && !k.isNegative)
    .filter((k) => {
      const lower = k.keyword.toLowerCase()
      return (
        lower.includes(productName.toLowerCase()) &&
        (lower.includes('oficial') || lower.includes('original') || lower.includes('site'))
      )
    })
    .map((k) => ({ ...k, matchType: ['Exact', 'Phrase'].includes(k.matchType) ? k.matchType : 'Phrase' as const }))

  const purchaseKeywords: ScoredKeyword[] = keywords
    .filter((k) => k.selected && !k.isNegative)
    .filter((k) => {
      const lower = k.keyword.toLowerCase()
      return (
        lower.includes('comprar') ||
        lower.includes('compre') ||
        lower.includes('adquirir') ||
        lower.includes('preço') ||
        lower.includes('preco')
      )
    })

  const genericKeywords: ScoredKeyword[] = keywords
    .filter((k) => k.selected && !k.isNegative)
    .filter((k) => {
      const lower = k.keyword.toLowerCase()
      const isBrand = brandKeywords.some((bk) => bk.keyword === lower)
      const isPurchase = purchaseKeywords.some((pk) => pk.keyword === lower)
      return !isBrand && !isPurchase
    })
    .map((k) => ({ ...k, matchType: ['Broad', 'Phrase'].includes(k.matchType) ? k.matchType : 'Broad' as const }))

  const adGroups: AdGroup[] = [
    {
      id: generateId(),
      name: 'Marca Oficial',
      keywords: brandKeywords.length > 0
        ? brandKeywords
        : [
            { keyword: `${productName.toLowerCase()} site oficial`, score: 80, matchType: 'Exact', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} original`, score: 80, matchType: 'Exact', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} oficial`, score: 70, matchType: 'Phrase', selected: true, isNegative: false },
          ],
      ads: generateBrandAdGroupAds(input),
      status: 'active',
    },
    {
      id: generateId(),
      name: 'Comprar - SNIPER',
      keywords: purchaseKeywords.length > 0
        ? purchaseKeywords
        : [
            { keyword: `comprar ${productName.toLowerCase()}`, score: 80, matchType: 'Exact', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} comprar`, score: 80, matchType: 'Exact', selected: true, isNegative: false },
            { keyword: `onde comprar ${productName.toLowerCase()}`, score: 70, matchType: 'Phrase', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} preço hoje`, score: 60, matchType: 'Broad', selected: true, isNegative: false },
          ],
      ads: generateSniperkAdGroupAds(input),
      status: 'active',
    },
    {
      id: generateId(),
      name: 'Genérico',
      keywords: genericKeywords.length > 0
        ? genericKeywords
        : [
            { keyword: productName.toLowerCase(), score: 30, matchType: 'Broad', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} funciona`, score: 10, matchType: 'Phrase', selected: true, isNegative: false },
            { keyword: `${productName.toLowerCase()} é bom`, score: 20, matchType: 'Broad', selected: true, isNegative: false },
          ],
      ads: generateGenericAdGroupAds(input),
      status: 'active',
    },
  ]

  const extensions = generateExtensions(input)

  const negativeKeywords = [
    ...STANDARD_NEGATIVE_KEYWORDS,
    ...keywords.filter((k) => k.isNegative).map((k) => k.keyword),
  ].filter((v, i, arr) => arr.indexOf(v) === i) // deduplicate

  return {
    id: generateId(),
    userId: '',
    name: `${productName} - Google Ads`,
    productName,
    category: input.category,
    objective: input.objective,
    benefits: input.benefits,
    differentials: input.differentials,
    offer: input.offer,
    affiliateUrl,
    adGroups,
    extensions,
    negativeKeywords,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
