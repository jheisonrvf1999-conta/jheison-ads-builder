import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function truncate(text: string, maxLength: number): string {
  if (!text) return ''
  const cleaned = text.trim()
  if (cleaned.length <= maxLength) return cleaned
  return cleaned.substring(0, maxLength).trim()
}

export function truncateHeadline(text: string): string {
  return truncate(text, 30)
}

export function truncateDescription(text: string): string {
  return truncate(text, 90)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export function capitalizeWords(text: string): string {
  return text
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatDateShort(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function buildUtmUrl(
  baseUrl: string,
  campaignName: string,
  adGroupName: string
): string {
  try {
    const url = new URL(baseUrl)
    const sanitizedCampaign = slugify(campaignName)
    const sanitizedAdGroup = slugify(adGroupName)
    url.searchParams.set('utm_source', 'google_ads')
    url.searchParams.set('utm_medium', 'cpc')
    url.searchParams.set('utm_campaign', sanitizedCampaign)
    url.searchParams.set('utm_content', sanitizedAdGroup)
    return url.toString()
  } catch {
    return baseUrl
  }
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (!['http:', 'https:'].includes(parsed.protocol)) return false
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') return false
    if (host.startsWith('192.168.') || host.startsWith('10.') || host.startsWith('172.')) return false
    return true
  } catch {
    return false
  }
}

export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'text-green-500'
    case 'draft':
      return 'text-amber-500'
    case 'exported':
      return 'text-blue-500'
    default:
      return 'text-gray-400'
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'draft':
      return 'Rascunho'
    case 'exported':
      return 'Exportado'
    default:
      return status
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function removeAccents(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

export function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s\-.,!?]/g, '')
    .trim()
}
