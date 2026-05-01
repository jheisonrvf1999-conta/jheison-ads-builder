import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { createAdminClient } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      authorize: async (credentials) => {
        try {
          const parsed = loginSchema.safeParse(credentials)

          if (!parsed.success) {
            return null
          }

          const { email, password } = parsed.data

          const supabase = createAdminClient()

          const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, password_hash, two_fa_enabled')
            .eq('email', email.toLowerCase())
            .single()

          if (error || !user) {
            return null
          }

          const passwordMatch = await bcrypt.compare(password, user.password_hash)

          if (!passwordMatch) {
            return null
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name || user.email,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        token.name = user.name
      }
      return token
    },
    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  trustHost: true,
})
