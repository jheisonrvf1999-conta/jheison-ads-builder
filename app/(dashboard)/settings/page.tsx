import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { createAdminClient } from '@/lib/supabase'
import type { Metadata } from 'next'
import { ProfileForm } from '@/components/settings/profile-form'
import { PasswordForm } from '@/components/settings/password-form'
import { GoogleAdsConnect } from '@/components/settings/google-ads-connect'
import { Separator } from '@/components/ui/separator'

export const metadata: Metadata = { title: 'Configurações' }

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { connected?: string; error?: string }
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, google_ads_connected, two_fa_enabled, created_at')
    .eq('id', session.user.id)
    .single()

  if (!user) redirect('/login')

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* Success / error banners from OAuth redirect */}
      {searchParams.connected === 'true' && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
          Google Ads conectado com sucesso! Agora você pode criar e gerenciar campanhas diretamente.
        </div>
      )}
      {searchParams.error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          Erro ao conectar o Google Ads:{' '}
          <span className="font-mono">{decodeURIComponent(searchParams.error)}</span>
        </div>
      )}

      {/* Profile */}
      <section>
        <h3 className="text-base font-semibold text-foreground">Perfil</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Nome e endereço de e-mail da sua conta.</p>
        <Separator className="mt-3 mb-5" />
        <ProfileForm
          userId={user.id}
          initialName={user.name ?? ''}
          initialEmail={user.email}
        />
      </section>

      {/* Password */}
      <section>
        <h3 className="text-base font-semibold text-foreground">Segurança</h3>
        <p className="text-sm text-muted-foreground mt-0.5">Altere sua senha de acesso.</p>
        <Separator className="mt-3 mb-5" />
        <PasswordForm userId={user.id} />
      </section>

      {/* Google Ads */}
      <section>
        <h3 className="text-base font-semibold text-foreground">Google Ads</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          Conecte sua conta para criar e sincronizar campanhas diretamente.
        </p>
        <Separator className="mt-3 mb-5" />
        <GoogleAdsConnect connected={user.google_ads_connected ?? false} />
      </section>
    </div>
  )
}
