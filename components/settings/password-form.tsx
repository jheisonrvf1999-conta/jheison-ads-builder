'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual obrigatória'),
    newPassword: z
      .string()
      .min(12, 'Mínimo 12 caracteres')
      .regex(/[A-Z]/, 'Deve conter pelo menos 1 letra maiúscula')
      .regex(/[0-9]/, 'Deve conter pelo menos 1 número'),
    confirmPassword: z.string().min(1, 'Confirmação obrigatória'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  })
type Values = z.infer<typeof schema>

export function PasswordForm({ userId: _ }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(values: Values) {
    setLoading(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao alterar senha.'); return }
      toast.success('Senha alterada com sucesso!')
      reset()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  function PasswordInput({
    id, label, show, onToggle, registration, error,
  }: {
    id: string; label: string; show: boolean; onToggle: () => void
    registration: ReturnType<typeof register>; error?: string
  }) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input id={id} type={show ? 'text' : 'password'} {...registration}
            disabled={loading} className={`pr-10 ${error ? 'border-red-500' : ''}`} />
          <button type="button" onClick={onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <PasswordInput id="currentPassword" label="Senha atual" show={showCurrent}
        onToggle={() => setShowCurrent((v) => !v)} registration={register('currentPassword')}
        error={errors.currentPassword?.message} />
      <PasswordInput id="newPassword" label="Nova senha (mín. 12 caracteres)" show={showNew}
        onToggle={() => setShowNew((v) => !v)} registration={register('newPassword')}
        error={errors.newPassword?.message} />
      <PasswordInput id="confirmPassword" label="Confirmar nova senha" show={showNew}
        onToggle={() => setShowNew((v) => !v)} registration={register('confirmPassword')}
        error={errors.confirmPassword?.message} />
      <Button type="submit" disabled={loading} size="sm">
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="mr-2 h-3.5 w-3.5" />}
        Alterar senha
      </Button>
    </form>
  )
}
