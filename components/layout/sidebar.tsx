'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Plus,
  Megaphone,
  TrendingUp,
  FileText,
  Settings,
  CreditCard,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface SidebarProps {
  googleAdsConnected?: boolean
  lastSyncAt?: string | null
  userPlan?: string
  userName?: string
  userEmail?: string
}

const navSections = [
  {
    label: 'Principal',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/campaigns/new', label: 'Nova Campanha', icon: Plus },
      { href: '/campaigns', label: 'Campanhas', icon: Megaphone },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { href: '/performance', label: 'Performance', icon: TrendingUp },
      { href: '/templates', label: 'Templates', icon: FileText },
    ],
  },
  {
    label: 'Conta',
    items: [
      { href: '/settings', label: 'Configurações', icon: Settings },
      { href: '/billing', label: 'Planos', icon: CreditCard },
    ],
  },
]

function formatLastSync(lastSyncAt: string | null | undefined): string {
  if (!lastSyncAt) return 'Nunca sincronizado'
  try {
    const date = new Date(lastSyncAt)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  } catch {
    return 'Data inválida'
  }
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  if (email) {
    return email.substring(0, 2).toUpperCase()
  }
  return 'U'
}

function getPlanLabel(plan?: string): string {
  switch (plan) {
    case 'pro':
      return 'Pro'
    case 'enterprise':
      return 'Enterprise'
    default:
      return 'Free'
  }
}

export function Sidebar({
  googleAdsConnected = false,
  lastSyncAt,
  userPlan = 'free',
  userName,
  userEmail,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/campaigns/new') return pathname === '/campaigns/new'
    if (href === '/campaigns') return pathname.startsWith('/campaigns') && pathname !== '/campaigns/new'
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-gray-900 text-white">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shrink-0">
          J
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white leading-tight truncate">
            Jheison Ads
          </span>
          <span className="text-xs text-gray-400 leading-tight truncate">
            Builder Pro
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
              {section.label}
            </p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                        active
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Google Ads Status */}
      <div className="px-4 py-3 border-t border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          {googleAdsConnected ? (
            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 text-red-400 shrink-0" />
          )}
          <span
            className={cn(
              'text-xs font-medium',
              googleAdsConnected ? 'text-green-400' : 'text-red-400'
            )}
          >
            Google Ads: {googleAdsConnected ? 'Conectado' : 'Desconectado'}
          </span>
        </div>
        {googleAdsConnected && (
          <p className="text-xs text-gray-500 pl-6">
            Sync: {formatLastSync(lastSyncAt)}
          </p>
        )}
      </div>

      {/* User Info */}
      <div className="px-4 py-4 border-t border-gray-800 flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
          {getInitials(userName, userEmail)}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium text-white truncate">
            {userName || userEmail || 'Usuário'}
          </span>
          <span className="text-xs text-gray-400 truncate">
            {userEmail || ''}
          </span>
        </div>
        <Badge
          className={cn(
            'text-xs shrink-0 px-1.5 py-0.5',
            userPlan === 'enterprise'
              ? 'bg-purple-600 text-white border-transparent hover:bg-purple-600'
              : userPlan === 'pro'
              ? 'bg-indigo-600 text-white border-transparent hover:bg-indigo-600'
              : 'bg-gray-700 text-gray-300 border-transparent hover:bg-gray-700'
          )}
        >
          {getPlanLabel(userPlan)}
        </Badge>
      </div>
    </aside>
  )
}
