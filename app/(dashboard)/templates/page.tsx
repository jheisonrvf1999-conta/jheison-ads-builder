import Link from 'next/link'
import { Plus, Copy, Tag, Link2, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const TEMPLATES = [
  {
    id: "suplemento",
    name: "Suplemento / Saúde",
    category: "suplemento",
    description: "Suplementos alimentares para rotina saudável e bem-estar.",
    display_path: ["Loja", "Oficial"],
    keywords: ["comprar suplemento", "suplemento original", "onde comprar suplemento", "suplemento preço hoje", "site oficial suplemento"],
    headlines: ["Site Oficial [Produto]","Promoção em [Cidade]","Apoio à Rotina Saudável","Fórmula com Nutrientes","[Produto] Original","Onde Comprar [Produto]","[Produto] Preço Hoje","Auxilia na Saciedade","Suporte Nutricional Diário","Nutrição para Equilíbrio","Com Fibras Naturais","[Produto] no Site Oficial","Conheça o [Produto]","[Produto] Rotina Saudável","Compra Segura e Rápida"],
    descriptions: ["Compre no site oficial com segurança e praticidade","Complemente sua rotina com nosso produto original","Fórmula com nutrientes para apoiar sua alimentação","Escolha seu kit e compre direto no site oficial"],
    sitelinks: [
      {title:"Pacote Econômico",desc1:"Leve 3 Pague 2",desc2:"Melhor Custo-Benefício",url:"?src=1"},
      {title:"Pacote Familiar",desc1:"150 Dias de Suplemento",desc2:"Mais Economia por Unidade",url:"?src=2"},
      {title:"Pacote Máximo",desc1:"Leve 8 Pague 5",desc2:"Maior Economia do Site",url:"?src=3"},
      {title:"Pote Único",desc1:"Ideal Para Começar",desc2:"Suplemento Para 30 Dias",url:"?src=4"},
      {title:"Frete Grátis Brasil",desc1:"Envio para Todo o País",desc2:"Entrega Rápida e Segura",url:"?src=5"},
      {title:"Compra Protegida",desc1:"Pagamento em Ambiente Seguro",desc2:"Envio Rápido com Rastreio",url:"?src=6"},
    ],
    callouts: ["Produto Original","Compra Segura","Pix e Cartão","Parcele em 12x"],
    snippets: ["30 Dias","90 Dias","150 Dias","240 Dias"],
    negative_keywords: ["download","pdf","reclamação","reclame aqui","não funciona","golpe"],
  },
  {
    id: "curso",
    name: "Curso / Infoproduto",
    category: "curso",
    description: "Cursos online, treinamentos e mentorias digitais.",
    display_path: ["Curso", "Oficial"],
    keywords: ["comprar curso online","curso original","onde comprar curso","curso preço hoje","site oficial curso"],
    headlines: ["Site Oficial [Produto]","Acesso Vitalício","Do Zero ao Avançado","Certificado Incluso","[Produto] Original","Onde Comprar [Produto]","[Produto] Preço Hoje","Comece Hoje Mesmo","Suporte Durante o Curso","Material Exclusivo","Aulas em Vídeo HD","[Produto] no Site Oficial","Conheça o [Produto]","Aprenda no Seu Ritmo","Acesso Imediato"],
    descriptions: ["Acesse o curso no site oficial com segurança","Acesso vitalício para aprender no seu próprio ritmo","Conteúdo completo do zero ao avançado com suporte","Escolha seu plano e compre direto no site oficial"],
    sitelinks: [
      {title:"Acesso Vitalício",desc1:"Pague Uma Vez",desc2:"Acesse Para Sempre",url:"?src=1"},
      {title:"Suporte Incluso",desc1:"Tire Suas Dúvidas",desc2:"Suporte por 12 Meses",url:"?src=2"},
      {title:"Certificado",desc1:"Certificado de Conclusão",desc2:"Reconhecido pelo Mercado",url:"?src=3"},
      {title:"Bônus Exclusivos",desc1:"Materiais Extras",desc2:"Inclusos na Compra",url:"?src=4"},
      {title:"Acesso Imediato",desc1:"Comece em Minutos",desc2:"Após Confirmação",url:"?src=5"},
      {title:"Compra Protegida",desc1:"Pagamento Seguro",desc2:"Garantia de 7 Dias",url:"?src=6"},
    ],
    callouts: ["Acesso Vitalício","Certificado Incluso","Suporte Incluso","Garantia de 7 Dias"],
    snippets: ["Módulo 1","Módulo 2","Módulo 3","Bônus"],
    negative_keywords: ["pirata","torrent","crack","reclamação","não funciona"],
  },
  {
    id: "software",
    name: "Software / SaaS",
    category: "software",
    description: "Ferramentas digitais, automações e plataformas online.",
    display_path: ["Software", "Oficial"],
    keywords: ["comprar software","software original","onde comprar software","software preço hoje","site oficial software"],
    headlines: ["Site Oficial [Produto]","Período de Teste Grátis","Automatize Seu Negócio","Integra com Tudo","[Produto] Original","Onde Comprar [Produto]","[Produto] Preço Hoje","Suporte Técnico 24h","Atualizações Incluídas","Sem Contrato Anual","Cancele Quando Quiser","[Produto] no Site Oficial","Conheça o [Produto]","Economize Tempo","Configure em Minutos"],
    descriptions: ["Acesse o software no site oficial com segurança","Automatize processos e ganhe tempo para o essencial","Integra com suas ferramentas favoritas facilmente","Escolha seu plano e comece a usar hoje mesmo"],
    sitelinks: [
      {title:"Plano Mensal",desc1:"Sem Compromisso",desc2:"Cancele Quando Quiser",url:"?src=1"},
      {title:"Plano Anual",desc1:"Economize até 40%",desc2:"Melhor Custo-Benefício",url:"?src=2"},
      {title:"Suporte 24h",desc1:"Atendimento Especializado",desc2:"Via Chat e Email",url:"?src=3"},
      {title:"Integrações",desc1:"Conecte Suas Ferramentas",desc2:"+50 Integrações",url:"?src=4"},
      {title:"Período de Teste",desc1:"14 Dias para Experimentar",desc2:"Sem Cartão de Crédito",url:"?src=5"},
      {title:"Compra Protegida",desc1:"Pagamento Seguro",desc2:"Dados Criptografados",url:"?src=6"},
    ],
    callouts: ["Período de Teste","Suporte 24h","Cancele Quando Quiser","Dados Seguros"],
    snippets: ["Plano Starter","Plano Pro","Plano Business","Plano Enterprise"],
    negative_keywords: ["crack","pirata","torrent","reclamação","não funciona"],
  },
  {
    id: "ebook",
    name: "E-book / PDF",
    category: "ebook",
    description: "Livros digitais, guias e materiais educativos.",
    display_path: ["Ebook", "Oficial"],
    keywords: ["comprar ebook","ebook original","onde comprar ebook","ebook preço hoje","site oficial ebook"],
    headlines: ["Site Oficial [Produto]","Download Imediato","Guia Completo e Prático","Aprenda com Especialistas","[Produto] Original","Onde Comprar [Produto]","[Produto] Preço Hoje","Acesso em Todo Dispositivo","Conteúdo Atualizado","Linguagem Clara e Direta","Passo a Passo Detalhado","[Produto] no Site Oficial","Conheça o [Produto]","Conhecimento na Prática","Acesso Imediato"],
    descriptions: ["Adquira o e-book no site oficial com segurança","Acesso imediato após a confirmação do pagamento","Conteúdo completo e prático para seu desenvolvimento","Escolha seu formato e compre no site oficial"],
    sitelinks: [
      {title:"Formato PDF",desc1:"Acesse em Qualquer Tela",desc2:"PC, Tablet ou Celular",url:"?src=1"},
      {title:"Bônus Inclusos",desc1:"Materiais Extras",desc2:"Inclusos na Compra",url:"?src=2"},
      {title:"Acesso Imediato",desc1:"Após Confirmação",desc2:"Sem Espera",url:"?src=3"},
      {title:"Suporte Incluso",desc1:"Tire Suas Dúvidas",desc2:"Atendimento por Email",url:"?src=4"},
      {title:"Garantia de 7 Dias",desc1:"Satisfação ou Reembolso",desc2:"Sem Burocracia",url:"?src=5"},
      {title:"Compra Protegida",desc1:"Pagamento Seguro",desc2:"Dados Criptografados",url:"?src=6"},
    ],
    callouts: ["Acesso Imediato","Garantia de 7 Dias","Formato PDF","Suporte Incluso"],
    snippets: ["Capítulo 1","Capítulo 2","Capítulo 3","Bônus"],
    negative_keywords: ["pirata","torrent","reclamação","não funciona","golpe"],
  },
  {
    id: "consultoria",
    name: "Consultoria / Serviço",
    category: "consultoria",
    description: "Serviços profissionais, consultorias e assessorias.",
    display_path: ["Consultoria", "Oficial"],
    keywords: ["contratar consultoria","consultoria profissional","onde contratar","consultoria preço hoje","site oficial consultoria"],
    headlines: ["Site Oficial [Empresa]","Primeira Consulta Grátis","Especialistas ao Seu Lado","Experiência Comprovada","[Empresa] Original","Onde Contratar [Empresa]","[Empresa] Preço Hoje","Atendimento Personalizado","Anos de Experiência","Metodologia Própria","Cases de Sucesso Reais","[Empresa] no Site Oficial","Conheça a [Empresa]","Apoio ao Seu Negócio","Agende sua Consulta"],
    descriptions: ["Contrate nossa consultoria com segurança e praticidade","Especialistas prontos para apoiar o crescimento do negócio","Metodologia própria com casos documentados de sucesso","Agende sua consulta inicial direto no site oficial"],
    sitelinks: [
      {title:"Consulta Inicial",desc1:"Primeira Consulta Grátis",desc2:"Agende Agora",url:"?src=1"},
      {title:"Nossos Cases",desc1:"Resultados Documentados",desc2:"Clientes Satisfeitos",url:"?src=2"},
      {title:"Nossa Equipe",desc1:"Especialistas Certificados",desc2:"Prontos para Atender",url:"?src=3"},
      {title:"Metodologia",desc1:"Nossa Abordagem",desc2:"Processos Estruturados",url:"?src=4"},
      {title:"Planos",desc1:"Planos Personalizados",desc2:"Para Cada Necessidade",url:"?src=5"},
      {title:"Fale Conosco",desc1:"Atendimento Especializado",desc2:"Resposta em até 24h",url:"?src=6"},
    ],
    callouts: ["Primeira Consulta Grátis","Especialistas Certificados","Metodologia Própria","Atendimento Personalizado"],
    snippets: ["Consultoria","Mentoria","Treinamento","Assessoria"],
    negative_keywords: ["reclamação","reclame aqui","golpe","fraude"],
  },
  {
    id: "ecommerce",
    name: "E-commerce / Produto Físico",
    category: "ecommerce",
    description: "Produtos físicos, lojas virtuais e marketplace.",
    display_path: ["Loja", "Oficial"],
    keywords: ["comprar produto","produto original","onde comprar","produto preço hoje","site oficial","frete grátis"],
    headlines: ["Site Oficial [Loja]","Frete Grátis Hoje","Entrega em até 48h","Parcele em 12x","[Produto] Original","Onde Comprar [Produto]","[Produto] Preço Hoje","Produto Original Lacrado","Troca Sem Burocracia","Estoque Disponível","Compra Segura","[Loja] no Site Oficial","Conheça a [Loja]","Melhor Preço Online","Promoção de Hoje"],
    descriptions: ["Compre no site oficial com frete grátis e entrega rápida","Produto original com garantia e suporte pós-venda","Parcele em até 12x sem juros ou PIX com desconto","Receba em casa com rastreamento completo do pedido"],
    sitelinks: [
      {title:"Frete Grátis",desc1:"Para Todo o Brasil",desc2:"Pedidos acima de R$ 99",url:"?src=1"},
      {title:"Parcelamento",desc1:"Até 12x Sem Juros",desc2:"No Cartão de Crédito",url:"?src=2"},
      {title:"Troca Grátis",desc1:"Política de Troca Fácil",desc2:"Sem Burocracia",url:"?src=3"},
      {title:"Rastreamento",desc1:"Acompanhe seu Pedido",desc2:"Atualização em Tempo Real",url:"?src=4"},
      {title:"Ofertas do Dia",desc1:"Melhores Preços Online",desc2:"Atualizado Todo Dia",url:"?src=5"},
      {title:"Compra Segura",desc1:"Ambiente Criptografado",desc2:"Dados Protegidos",url:"?src=6"},
    ],
    callouts: ["Frete Grátis","Parcele em 12x","Troca Grátis","Compra Segura"],
    snippets: ["30 dias","60 dias","90 dias","180 dias"],
    negative_keywords: ["reclamação","reclame aqui","golpe","falsificado"],
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
                  {tpl.headlines.slice(0, 3).map((h, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <span className="text-indigo-400 font-mono shrink-0">{i + 1}.</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Tag className="h-3 w-3" />
                  {tpl.keywords.length} palavras-chave
                </span>
                <span className="flex items-center gap-1">
                  <Link2 className="h-3 w-3" />
                  {tpl.sitelinks.length} sitelinks
                </span>
                <span className="flex items-center gap-1">
                  <Megaphone className="h-3 w-3" />
                  {tpl.callouts.length} extensões
                </span>
              </div>

              {/* Negative keywords preview */}
              <div className="flex flex-wrap gap-1 mt-auto">
                {tpl.negative_keywords.slice(0, 4).map((kw) => (
                  <Badge key={kw} variant="secondary" className="text-xs px-1.5 py-0 text-red-400/70">
                    -{kw}
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
