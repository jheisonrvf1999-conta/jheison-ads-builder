'use client'

import { signOut, useSession } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Sun,
  Moon,
  LogOut,
  Settings,
  CreditCard,
  User,
  ChevronDown,
  Menu,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/campaigns': 'Campanhas',
  '/campaigns/new': 'Nova Campanha',
  '/performance': 'Performance',
  '/templates': 'Templates',
  '/settings': 'Configurações',
  '/billing': 'Planos',
}

interface HeaderProps {
  onMobileMenuToggle?: () => void
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }
  if (email) return email.substring(0, 2).toUpperCase()
  return 'U'
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 text-muted-foreground hover:text-foreground"
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

export function Header({ onMobileMenuToggle }: HeaderProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith('/campaigns/') ? 'Campanha' : 'Painel')

  const user = session?.user

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Left: mobile toggle + page title */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 lg:hidden text-muted-foreground"
          onClick={onMobileMenuToggle}
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold text-foreground">{pageTitle}</h1>
      </div>

      {/* Right: theme toggle + user menu */}
      <div className="flex items-center gap-1">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 px-2 h-9 text-sm text-muted-foreground hover:text-foreground"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">
                {getInitials(user?.name, user?.email)}
              </div>
              <span className="hidden sm:block max-w-[120px] truncate">
                {user?.name || user?.email || 'Usuário'}
              </span>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium truncate">{user?.name || 'Usuário'}</span>
                <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                Planos
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500 focus:text-red-500 cursor-pointer"
              onClick={() => signOut({ callbackUrl: '/login' })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
