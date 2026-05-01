'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
})
type Values = z.infer<typeof schema>

interface ProfileFormProps {
  userId: string
  initialName: string
  initialEmail: string
}

export function ProfileForm({ initialName, initialEmail }: ProfileFormProps) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: initialName, email: initialEmail },
  })

  async function onSubmit(values: Values) {
    setLoading(true)
    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Erro ao salvar.'); return }
      toast.success('Perfil atualizado!')
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register('name')} disabled={loading}
          className={errors.name ? 'border-red-500' : ''} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" type="email" {...register('email')} disabled={loading}
          className={errors.email ? 'border-red-500' : ''} />
        {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={loading || !isDirty} size="sm">
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-2 h-3.5 w-3.5" />}
        Salvar alterações
      </Button>
    </form>
  )
}
