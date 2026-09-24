import { LogOut, Plus } from 'lucide-react'
import type { AuthUser } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'

interface HeaderProps {
  activeSection?: string
  title?: string
  transactionCount?: number
  dataSource?: 'supabase'
  user?: AuthUser | null
  onLogout?: () => void
  onOpenMobileMenu?: () => void
  onOpenThemeModal?: () => void
  onOpenNewTransaction?: () => void
}

const SECTION_CONFIG: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'DASHBOARD',
    subtitle: 'Aqui está o resumo das suas finanças',
  },
  transactions: {
    title: 'TRANSAÇÕES',
    subtitle: 'Histórico e registro de entradas e saídas',
  },
  budget: {
    title: 'PLANEJAMENTO',
    subtitle: 'Controle de metas e teto mensal de gastos',
  },
  categories: {
    title: 'CATEGORIAS',
    subtitle: 'Distribuição de despesas por origem e destino',
  },
}

export const Header = ({
  activeSection = 'dashboard',
  title,
  user = null,
  onLogout,
  onOpenNewTransaction,
}: HeaderProps) => {
  const { currentTheme } = useTheme()

  const currentConfig = SECTION_CONFIG[activeSection] || SECTION_CONFIG.dashboard
  const displayTitle = title || currentConfig.title
  const displaySubtitle = currentConfig.subtitle

  // Primeira letra para o avatar
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  const handleOpenTransaction = () => {
    soundFX.playClick()
    onOpenNewTransaction?.()
  }

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-4 py-1">
      {/* Nome da tela em questão */}
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-black tracking-wider text-white drop-shadow-sm uppercase truncate">
          {displayTitle}
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5 truncate">{displaySubtitle}</p>
      </div>

      {/* Ações e Perfil do Usuário */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onOpenNewTransaction && (
          <button
            type="button"
            onClick={handleOpenTransaction}
            title="Adicionar nova movimentação"
            aria-label="Nova Transação"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer border"
            style={{
              backgroundColor: `${currentTheme.primaryColor}18`,
              borderColor: `${currentTheme.primaryColor}45`,
              color: currentTheme.primaryColor,
            }}
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Nova Transação</span>
          </button>
        )}

        {/* Botão de perfil do usuário logado */}
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl glass-pill border border-white/10">
            <div
              className="w-7 h-7 rounded-lg font-bold text-xs flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              {userInitial}
            </div>
            <div className="hidden sm:block text-left overflow-hidden">
              <span className="text-xs font-semibold text-white block leading-tight truncate max-w-32">
                {user.name || user.email}
              </span>
              <span className="text-[10px] text-zinc-400 block leading-tight">Online</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Encerrar sessão"
                aria-label="Sair da conta"
                className="p-1 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-white/5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
