import Papa from 'papaparse'
import type { Campaign, ValidationResult } from '@/types'

interface GoogleAdsRow {
  Campaign: string
  'Campaign Status': string
  'Campaign Type': string
  'Campaign Daily Budget': string
  'Ad Group': string
  'Ad Group Status': string
  Keyword: string
  'Match Type': string
  'Headline 1': string
  'Headline 2': string
  'Headline 3': string
  'Headline 4': string
  'Headline 5': string
  'Headline 6': string
  'Headline 7': string
  'Headline 8': string
  'Headline 9': string
  'Headline 10': string
  'Headline 11': string
  'Headline 12': string
  'Headline 13': string
  'Headline 14': string
  'Headline 15': string
  'Description 1': string
  'Description 2': string
  'Description 3': string
  'Description 4': string
  'Final URL': string
  'Tracking Template': string
  'Path 1': string
  'Path 2': string
  'Ad Type': string
  'Negative Keyword': string
  'Negative Keyword Match Type': string
}

export function exportToCsv(campaign: Campaign): string {
  const rows: Partial<GoogleAdsRow>[] = []

  for (const adGroup of campaign.adGroups) {
    // Add keywords
    for (const keyword of adGroup.keywords) {
      if (!keyword.selected || keyword.isNegative) continue

      rows.push({
        Campaign: campaign.name,
        'Campaign Status': 'Enabled',
        'Campaign Type': 'Search',
        'Campaign Daily Budget': '30.00',
        'Ad Group': adGroup.name,
        'Ad Group Status': adGroup.status === 'active' ? 'Enabled' : 'Paused',
        Keyword: keyword.keyword,
        'Match Type': keyword.matchType,
        'Final URL': adGroup.ads[0]?.finalUrl || campaign.affiliateUrl,
      })
    }

    // Add ads
    for (const ad of adGroup.ads) {
      const headlines = ad.headlines.map((h) => h.text)
      const descriptions = ad.descriptions.map((d) => d.text)

      const adRow: Partial<GoogleAdsRow> = {
        Campaign: campaign.name,
        'Campaign Status': 'Enabled',
        'Campaign Type': 'Search',
        'Campaign Daily Budget': '30.00',
        'Ad Group': adGroup.name,
        'Ad Group Status': adGroup.status === 'active' ? 'Enabled' : 'Paused',
        'Ad Type': 'Responsive Search Ad',
        'Headline 1': headlines[0] || '',
        'Headline 2': headlines[1] || '',
        'Headline 3': headlines[2] || '',
        'Headline 4': headlines[3] || '',
        'Headline 5': headlines[4] || '',
        'Headline 6': headlines[5] || '',
        'Headline 7': headlines[6] || '',
        'Headline 8': headlines[7] || '',
        'Headline 9': headlines[8] || '',
        'Headline 10': headlines[9] || '',
        'Headline 11': headlines[10] || '',
        'Headline 12': headlines[11] || '',
        'Headline 13': headlines[12] || '',
        'Headline 14': headlines[13] || '',
        'Headline 15': headlines[14] || '',
        'Description 1': descriptions[0] || '',
        'Description 2': descriptions[1] || '',
        'Description 3': descriptions[2] || '',
        'Description 4': descriptions[3] || '',
        'Final URL': ad.finalUrl,
        'Tracking Template': ad.trackingTemplate,
        'Path 1': ad.path1 || '',
        'Path 2': ad.path2 || '',
      }

      rows.push(adRow)
    }
  }

  // Add negative keywords
  for (const negKw of campaign.negativeKeywords) {
    rows.push({
      Campaign: campaign.name,
      'Negative Keyword': negKw,
      'Negative Keyword Match Type': 'Broad',
    })
  }

  const csv = Papa.unparse(rows, {
    header: true,
    skipEmptyLines: true,
  })

  return csv
}

export function exportToXml(campaign: Campaign): string {
  const escapeXml = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  }

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`
  xml += `<googleads xmlns="https://adwords.google.com/api/adwords/cm/v201809">\n`
  xml += `  <campaign>\n`
  xml += `    <name>${escapeXml(campaign.name)}</name>\n`
  xml += `    <status>ENABLED</status>\n`
  xml += `    <advertisingChannelType>SEARCH</advertisingChannelType>\n`
  xml += `    <biddingStrategyConfiguration>\n`
  xml += `      <biddingStrategyType>TARGET_CPA</biddingStrategyType>\n`
  xml += `    </biddingStrategyConfiguration>\n`
  xml += `    <budget>\n`
  xml += `      <amount>30000000</amount>\n`
  xml += `    </budget>\n`

  for (const adGroup of campaign.adGroups) {
    xml += `    <adGroup>\n`
    xml += `      <name>${escapeXml(adGroup.name)}</name>\n`
    xml += `      <status>${adGroup.status === 'active' ? 'ENABLED' : 'PAUSED'}</status>\n`

    // Keywords
    for (const keyword of adGroup.keywords) {
      if (!keyword.selected || keyword.isNegative) continue
      const matchTypeMap: Record<string, string> = {
        Exact: 'EXACT',
        Phrase: 'PHRASE',
        Broad: 'BROAD',
      }
      xml += `      <criterion xsi:type="Keyword">\n`
      xml += `        <text>${escapeXml(keyword.keyword)}</text>\n`
      xml += `        <matchType>${matchTypeMap[keyword.matchType] || 'BROAD'}</matchType>\n`
      xml += `      </criterion>\n`
    }

    // Ads
    for (const ad of adGroup.ads) {
      xml += `      <ad xsi:type="ResponsiveSearchAd">\n`
      xml += `        <finalUrls><url>${escapeXml(ad.finalUrl)}</url></finalUrls>\n`
      xml += `        <trackingUrlTemplate>${escapeXml(ad.trackingTemplate)}</trackingUrlTemplate>\n`
      if (ad.path1) xml += `        <path1>${escapeXml(ad.path1)}</path1>\n`
      if (ad.path2) xml += `        <path2>${escapeXml(ad.path2)}</path2>\n`
      xml += `        <headlines>\n`
      for (let i = 0; i < ad.headlines.length; i++) {
        xml += `          <asset>\n`
        xml += `            <assetPerformanceLabel>LEARNING</assetPerformanceLabel>\n`
        xml += `            <text>${escapeXml(ad.headlines[i].text)}</text>\n`
        if (ad.headlines[i].pinPosition) {
          xml += `            <pinnedField>HEADLINE_${ad.headlines[i].pinPosition}</pinnedField>\n`
        }
        xml += `          </asset>\n`
      }
      xml += `        </headlines>\n`
      xml += `        <descriptions>\n`
      for (let i = 0; i < ad.descriptions.length; i++) {
        xml += `          <asset>\n`
        xml += `            <text>${escapeXml(ad.descriptions[i].text)}</text>\n`
        if (ad.descriptions[i].pinPosition) {
          xml += `            <pinnedField>DESCRIPTION_${ad.descriptions[i].pinPosition}</pinnedField>\n`
        }
        xml += `          </asset>\n`
      }
      xml += `        </descriptions>\n`
      xml += `      </ad>\n`
    }

    xml += `    </adGroup>\n`
  }

  // Negative keywords
  xml += `    <negativeKeywords>\n`
  for (const negKw of campaign.negativeKeywords) {
    xml += `      <criterion xsi:type="Keyword">\n`
    xml += `        <text>${escapeXml(negKw)}</text>\n`
    xml += `        <matchType>BROAD</matchType>\n`
    xml += `      </criterion>\n`
  }
  xml += `    </negativeKeywords>\n`

  // Sitelinks
  if (campaign.extensions.sitelinks.length > 0) {
    xml += `    <sitelinks>\n`
    for (const sitelink of campaign.extensions.sitelinks) {
      xml += `      <sitelink>\n`
      xml += `        <linkText>${escapeXml(sitelink.title)}</linkText>\n`
      xml += `        <finalUrls><url>${escapeXml(sitelink.finalUrl)}</url></finalUrls>\n`
      xml += `        <description1>${escapeXml(sitelink.description1)}</description1>\n`
      if (sitelink.description2) {
        xml += `        <description2>${escapeXml(sitelink.description2)}</description2>\n`
      }
      xml += `      </sitelink>\n`
    }
    xml += `    </sitelinks>\n`
  }

  // Callouts
  if (campaign.extensions.callouts.length > 0) {
    xml += `    <callouts>\n`
    for (const callout of campaign.extensions.callouts) {
      xml += `      <callout><calloutText>${escapeXml(callout.text)}</calloutText></callout>\n`
    }
    xml += `    </callouts>\n`
  }

  xml += `  </campaign>\n`
  xml += `</googleads>\n`

  return xml
}

export function validateExport(campaign: Campaign): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!campaign.name) {
    errors.push('Nome da campanha é obrigatório')
  }

  if (!campaign.affiliateUrl) {
    errors.push('URL do afiliado é obrigatória')
  }

  if (campaign.adGroups.length === 0) {
    errors.push('A campanha precisa de pelo menos um grupo de anúncios')
  }

  for (const adGroup of campaign.adGroups) {
    if (adGroup.ads.length === 0) {
      errors.push(`Grupo de anúncios "${adGroup.name}" não tem anúncios`)
    }

    for (const ad of adGroup.ads) {
      if (ad.headlines.length < 3) {
        errors.push(
          `Anúncio no grupo "${adGroup.name}" precisa de pelo menos 3 headlines`
        )
      }

      if (ad.descriptions.length < 2) {
        errors.push(
          `Anúncio no grupo "${adGroup.name}" precisa de pelo menos 2 descriptions`
        )
      }

      // Validate char limits
      for (const headline of ad.headlines) {
        if (headline.text.length > 30) {
          errors.push(
            `Headline "${headline.text.substring(0, 20)}..." excede 30 caracteres`
          )
        }
      }

      for (const description of ad.descriptions) {
        if (description.text.length > 90) {
          errors.push(
            `Description "${description.text.substring(0, 30)}..." excede 90 caracteres`
          )
        }
      }
    }

    if (adGroup.keywords.filter((k) => k.selected && !k.isNegative).length === 0) {
      warnings.push(`Grupo de anúncios "${adGroup.name}" não tem palavras-chave ativas`)
    }
  }

  if (campaign.extensions.sitelinks.length < 2) {
    warnings.push('Recomendado adicionar pelo menos 2 sitelinks para melhor desempenho')
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}
