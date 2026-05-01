import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { rateLimitByIp, getIpFromRequest } from '@/lib/rate-limit'
import { cacheGet, cacheSet } from '@/lib/redis'
import { analyzePage } from '@/lib/page-analyzer'
import { isValidUrl } from '@/lib/utils'

const analyzeSchema = z.object({
  url: z.string().url('URL inválida'),
  country: z.string().optional(),
  language: z.string().optional(),
})

export async function POST(request: NextRequest) {
  // Require authentication
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Autenticação necessária' }, { status: 401 })
  }

  // Rate limit by IP
  const ip = getIpFromRequest(request)
  const rateLimitResult = await rateLimitByIp(ip, 'analyze')
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Muitas requisições. Tente novamente em 1 hora.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '5',
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
          'X-RateLimit-Reset': String(rateLimitResult.reset),
        },
      }
    )
  }

  // Parse and validate body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo da requisição inválido' }, { status: 400 })
  }

  const parsed = analyzeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Dados inválidos', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { url, country, language } = parsed.data

  // Extra URL safety check (rejects localhost etc.)
  if (!isValidUrl(url)) {
    return NextResponse.json(
      { error: 'URL inválida. Use uma URL pública com http:// ou https://.' },
      { status: 400 }
    )
  }

  // Check Redis cache
  const cacheKey = `analysis:${url}`
  const cached = await cacheGet(cacheKey)
  if (cached) {
    return NextResponse.json({ data: cached, cached: true })
  }

  // Fetch and analyze the page
  let analysis
  try {
    analysis = await analyzePage(url)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido'
    // Distinguish between bad-URL errors and network errors
    if (message.includes('URL inválida')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }
    return NextResponse.json(
      { error: `Não foi possível acessar a página: ${message}` },
      { status: 502 }
    )
  }

  // Persist to Supabase
  const supabase = createAdminClient()
  const cacheExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  await supabase.from('page_analyses').upsert(
    {
      user_id: session.user.id,
      url,
      analysis_data: analysis,        // corrected: schema uses analysis_data
      cache_expires_at: cacheExpiresAt,
      created_at: new Date().toISOString(),
    },
    { onConflict: 'url' }
  )

  // Cache in Redis for 7 days (604800 seconds)
  await cacheSet(cacheKey, analysis, 604800)

  return NextResponse.json({ data: analysis, cached: false })
}
