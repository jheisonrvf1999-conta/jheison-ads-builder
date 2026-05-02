'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Globe, Search, Link } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PageAnalysisResult } from '@/types'

const schema = z.object({
  destinationUrl: z
    .string()
    .min(1, 'URL obrigatória')
    .url('Insira uma URL válida (ex: https://centralpaginaoficial.com/go/comprar)'),
  analysisUrl: z
    .string()
    .min(1, 'URL obrigatória')
    .url('Insira uma URL válida (ex: https://ozenvitta.com.br)'),
  country: z.string().min(1, 'Selecione o país'),
  language: z.string().min(1, 'Selecione o idioma'),
})

type FormValues = z.infer<typeof schema>

const COUNTRIES = [
  { value: 'BR', label: 'Brasil' },
  { value: 'PT', label: 'Portugal' },
  { value: 'US', label: 'Estados Unidos' },
  { value: 'ES', label: 'Espanha' },
  { value: 'MX', label: 'México' },
  { value: 'AR', label: 'Argentina' },
]

const LANGUAGES = [
  { value: 'pt-BR', label: 'Português (BR)' },
  { value: 'pt-PT', label: 'Português (PT)' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
]

interface StepUrlProps {
  onComplete: (result: PageAnalysisResult, destinationUrl: string, analysisUrl: string, country: string, language: string) => void
}

export function StepUrl({ onComplete }: StepUrlProps) {
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { destinationUrl: '', analysisUrl: '', country: 'BR', language: 'pt-BR' },
  })

  const country = watch('country')
  const language = watch('language')

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setServerError(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: values.analysisUrl, country: values.country, language: values.language }),
      })

      const json = await res.json()

      if (!res.ok) {
        setServerError(json.error ?? 'Erro ao analisar a página. Tente novamente.')
        return
      }

      const data = json.data as PageAnalysisResult
      onComplete(data, values.destinationUrl, values.analysisUrl, values.country, values.language)
    } catch {
      setServerError('Erro de conexão. Verifique sua internet e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Destination URL */}
          <div className="space-y-1.5">
            <Label htmlFor="destinationUrl" className="flex items-center gap-1.5">
              <Link className="h-3.5 w-3.5 text-muted-foreground" />
              Link de Destino (URL do Anúncio)
            </Label>
            <Input
              id="destinationUrl"
              placeholder="URL para onde o visitante vai ao clicar no anúncio"
              {...register('destinationUrl')}
              disabled={loading}
              className={errors.destinationUrl ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.destinationUrl && (
              <p className="text-xs text-red-500">{errors.destinationUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Pode ser sua presell, link de afiliado ou página de vendas
            </p>
          </div>

          {/* Analysis URL */}
          <div className="space-y-1.5">
            <Label htmlFor="analysisUrl" className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              Link para Análise (Página de Vendas do Produto)
            </Label>
            <Input
              id="analysisUrl"
              placeholder="URL da página de vendas do produto para extrair informações"
              {...register('analysisUrl')}
              disabled={loading}
              className={errors.analysisUrl ? 'border-red-500 focus-visible:ring-red-500' : ''}
            />
            {errors.analysisUrl && (
              <p className="text-xs text-red-500">{errors.analysisUrl.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Cole a URL da página de vendas do produtor para criar anúncios mais precisos
            </p>
          </div>

          {/* País e Idioma */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="country">País</Label>
              <Select
                value={country}
                onValueChange={(v) => setValue('country', v)}
                disabled={loading}
              >
                <SelectTrigger id="country" className={errors.country ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-xs text-red-500">{errors.country.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="language">Idioma</Label>
              <Select
                value={language}
                onValueChange={(v) => setValue('language', v)}
                disabled={loading}
              >
                <SelectTrigger id="language" className={errors.language ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>
                      {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.language && (
                <p className="text-xs text-red-500">{errors.language.message}</p>
              )}
            </div>
          </div>

          {/* Server error */}
          {serverError && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              {serverError}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analisando página...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analisar Página
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
