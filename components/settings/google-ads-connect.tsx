'use client'

import { useState } from 'react'
import { Loader2, CheckCircle2, XCircle, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface GoogleAdsConnectProps {
  connected: boolean
}

export function GoogleAdsConnect({ connected: initialConnected }: GoogleAdsConnectProps) {
  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(initialConnected)

  async function handleConnect() {
    setLoading(true)
    // Redirect to the OAuth connect endpoint — it handles the full flow
    window.location.href = '/api/google-ads/connect'
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch('/api/google-ads/disconnect', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao desconectar.'); return }
      setConnected(false)
      toast.success('Google Ads desconectado.')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className={`border ${connected ? 'border-green-500/20 bg-green-500/5' : 'border-border'}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* Google logo placeholder */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-lg font-bold">
              G
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground text-sm">Google Ads</p>
                {connected ? (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-xs">
                    <XCircle className="mr-1 h-3 w-3" />
                    Desconectado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {connected
                  ? 'Sua conta Google Ads está vinculada. Você pode criar campanhas com 1 clique.'
                  : 'Conecte sua conta para criar campanhas diretamente no Google Ads via API.'}
              </p>
              {connected && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  Escopo autorizado:{' '}
                  <span className="font-mono text-indigo-400">https://www.googleapis.com/auth/adwords</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 shrink-0">
            {connected ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleConnect}
                  disabled={loading}
                  className="text-xs"
                >
                  {loading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="mr-1.5 h-3.5 w-3.5" />}
                  Reconectar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10"
                >
                  Desconectar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                )}
                Conectar Google Ads
              </Button>
            )}
          </div>
        </div>

        {!connected && (
          <div className="mt-4 rounded-md bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Como funciona:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Clique em "Conectar Google Ads"</li>
              <li>Faça login na conta Google com acesso ao Google Ads</li>
              <li>Autorize o escopo <span className="font-mono">adwords</span></li>
              <li>Você será redirecionado de volta e a conexão ficará ativa</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
