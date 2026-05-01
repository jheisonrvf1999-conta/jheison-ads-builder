import Link from 'next/link'
import { Plus, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const TEMPLATES = [
  {
    id: 'suplemento',
    name: 'Suplemento / Saúde',
    category: 'suplemento',
    description: 'Emagrecimento, ganho de massa, energia e performance física.',
    headlines: ['Emagreça Rápido e Saudável', 'Resultados em 30 Dias', 'Fórmula Aprovada por Médicos'],
    tags: ['saúde', 'emagrecimento', 'suplemento'],
  },
  {
    id: 'curso',
    name: 'Curso / Infoproduto',
    category: 'curso',
    description: 'Cursos online, treinamentos e mentorias digitais.',
    headlines: ['Aprenda do Zero ao Avançado', 'Acesso Vitalício Garantido', 'Comece Hoje Mesmo'],
    tags: ['educação', 'online', 'treinamento'],
  },
  {
    id: 'software',
    name: 'Software / SaaS',
    category: 'software',
    description: 'Ferramentas digitais, automações e plataformas online.',
    headlines: ['Automatize Seu Negócio', 'Teste Grátis por 14 Dias', 'Integra com Tudo'],
    tags: ['tecnologia', 'automação', 'SaaS'],
  },
  {
    id: 'ebook',
    name: 'E-book / PDF',
    category: 'ebook',
    description: 'Livros digitais, guias e materiais educativos.',
    headlines: ['Baixe Agora e Aprenda', 'Guia Completo e Prático', 'Download Imediato'],
    tags: ['ebook', 'download', 'guia'],
  },
  {
    id: 'consultoria',
    name: 'Consultoria / Serviço',
    category: 'consultoria',
    description: 'Serviços profissionais, consultorias e assessorias.',
    headlines: ['Especialistas ao Seu Lado', 'Diagnóstico Gratuito', 'Resultados Comprovados'],
    tags: ['consultoria', 'profissional', 'serviço'],
  },
  {
    id: 'ecommerce',
    name: 'E-commerce / Físico',
    category: 'ecommerce',
    description: 'Produtos físicos, lojas virtuais e marketplace.',
    headlines: ['Frete Grátis Hoje', 'Entrega em 48h', 'Parcele em 12x Sem Juros'],
    tags: ['loja', 'produto', 'frete'],
  },
]

const CATEGORY_COLORS: Record<string, string> = {
  suplemento: 'bg-green-500/10 text-green-400 border-green-500/20',
  curso: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  software: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ebook: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  consultoria: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ecommerce: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
}

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Modelos prontos para acelerar a criação de campanhas
          </p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
          <Link href="/campaigns/new">
            <Plus className="mr-2 h-4 w-4" />
            Nova campanha
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((tpl) => (
          <Card key={tpl.id} className="flex flex-col hover:border-indigo-500/40 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base">{tpl.name}</CardTitle>
                <Badge variant="outline" className={CATEGORY_COLORS[tpl.category] ?? ''}>
                  {tpl.category}
                </Badge>
              </div>
              <CardDescription className="text-xs leading-relaxed">
                {tpl.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 pt-0">
              {/* Sample headlines */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Títulos de exemplo
                </p>
                <ul className="space-y-1">
                  {tpl.headlines.map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <span className="text-indigo-400 font-mono shrink-0">{i + 1}.</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {tpl.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>

              <Button asChild variant="outline" size="sm" className="w-full mt-1">
                <Link href={`/campaigns/new?template=${tpl.id}`}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Usar template
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
