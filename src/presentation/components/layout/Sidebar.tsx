import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Receipt,
  Settings,
  Smartphone,
  Target,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import type { AuthUser } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { useToast } from '../../../core/toast/toastContext'
import { usePWA } from '../../hooks/usePWA'

export interface SidebarProps {
  user?: AuthUser | null
  onLogout?: () => void
  activeSection: string
  onSelectSection: (section: string) => void
  onOpenThemeModal?: () => void
  onOpenSettingsModal?: () => void
  isMobileOpen?: boolean
  onCloseMobile: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function Sidebar({
  user: _user,
  onLogout,
  activeSection,
  onSelectSection,
  onOpenThemeModal,
  onOpenSettingsModal,
  isMobileOpen = false,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed

  const { currentTheme } = useTheme()
  const toast = useToast()
  const { isInstallable, isInstalled, installApp } = usePWA()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: BarChart3,
    },
    {
      id: 'transactions',
      label: 'Transações',
      icon: Receipt,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageSquare,
      badge: 'IA',
    },
    {
      id: 'cards',
      label: 'Cartões & Faturas',
      icon: CreditCard,
    },
    {
      id: 'debts',
      label: 'Dívidas & Empréstimos',
      icon: HandCoins,
    },
    {
      id: 'budget',
      label: 'Planejamento',
      icon: Target,
    },
    {
      id: 'categories',
      label: 'Categorias',
      icon: FolderTree,
    },
  ]

  const handleNavClick = (id: string) => {
    soundFX.playClick()
    onSelectSection(id)
    onCloseMobile()
  }

  const handleToggleCollapse = () => {
    soundFX.playClick()
    if (controlledToggle) {
      controlledToggle()
    } else {
      setInternalCollapsed(!internalCollapsed)
    }
  }

  return (
    <>
      {/* Backdrop Mobile quando Sidebar for expandida via drawer */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Fechar menu lateral"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-35 md:hidden cursor-pointer"
        />
      )}

      {/* Container Principal da Sidebar - Oculto no mobile (substituído pela BottomNavBar) e flex no desktop/tablet */}
      <aside
        aria-label="Menu Lateral de Navegação"
        className={`${
          isMobileOpen ? 'flex w-56 sm:w-56 shadow-2xl z-50' : 'hidden md:flex z-40'
        } fixed top-0 bottom-0 left-0 flex-col border-r border-white/8 transition-all duration-300 ease-in-out ${
          isCollapsed && !isMobileOpen ? 'w-14 sm:w-16' : 'w-48 sm:w-52'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Cabeçalho da Sidebar / Apenas Ícone Principal do App e Nome do App */}
        {isCollapsed ? (
          <div className="p-2.5 sm:p-3 flex flex-col items-center gap-2 border-b border-white/8">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-md"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
              title="myFinance"
            >
              <Wallet className="w-4 h-4" aria-hidden="true" />
            </div>

            <button
              type="button"
              onClick={handleToggleCollapse}
              aria-label="Expandir menu lateral"
              title="Expandir menu lateral"
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/8 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-3.5 flex items-center justify-between border-b border-white/8">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-md"
                style={{
                  backgroundColor: `${currentTheme.primaryColor}20`,
                  borderColor: `${currentTheme.primaryColor}40`,
                  color: currentTheme.primaryColor,
                }}
              >
                <Wallet className="w-4 h-4" aria-hidden="true" />
              </div>

              <div className="overflow-hidden">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-none">
                  my<span style={{ color: currentTheme.primaryColor }}>Finance</span>
                </span>
              </div>
            </div>

            {/* Botão para recolher a sidebar em qualquer tamanho de tela */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleToggleCollapse}
                aria-label="Recolher menu lateral"
                title="Recolher menu lateral"
                className="flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/8 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Links de Navegação */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {navItems.map((item, index) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={`${item.label} (Atalho: ${index + 1})`}
                  className={`flex items-center transition-all duration-150 cursor-pointer group relative ${
                    isCollapsed
                      ? 'w-9 h-9 mx-auto justify-center rounded-xl'
                      : 'w-full gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium'
                  } ${
                    isActive
                      ? 'text-white border shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/4 border border-transparent'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${currentTheme.primaryColor}18` : undefined,
                    borderColor: isActive ? `${currentTheme.primaryColor}40` : undefined,
                    color: isActive ? '#ffffff' : undefined,
                  }}
                >
                  {/* Indicador de barra ativa na lateral quando expandido */}
                  {!isCollapsed && isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full shadow-xs"
                      style={{ backgroundColor: currentTheme.primaryColor }}
                      aria-hidden="true"
                    />
                  )}

                  <Icon
                    className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      color: isActive ? currentTheme.primaryColor : undefined,
                    }}
                    aria-hidden="true"
                  />

                  {isCollapsed && 'badge' in item && item.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  )}

                  {!isCollapsed && (
                    <>
                      <span className="truncate flex-1 text-left font-medium">{item.label}</span>
                      {'badge' in item && item.badge && (
                        <span className="px-1.5 py-0.5 rounded text-3xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {item.badge}
                        </span>
                      )}
                      <kbd className="hidden sm:inline-flex text-3xs font-mono text-zinc-500 group-hover:text-zinc-300 opacity-60 px-1 py-0.5 rounded bg-white/3 border border-white/6">
                        {index + 1}
                      </kbd>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* Divisor */}
          <div className="pt-2 my-1 border-t border-white/8" />

          {/* Botão de Instalar App Nativo (PWA) no lugar do antigo Temas Dev */}
          {!isInstalled && (
            <button
              type="button"
              onClick={async () => {
                soundFX.playClick()
                if (isInstallable) {
                  await installApp()
                } else {
                  toast.info(
                    'Instalação do myFinance',
                    'Para instalar, abra as opções do seu navegador e clique em "Instalar aplicativo" ou "Adicionar à tela de início".',
                  )
                }
                onCloseMobile()
              }}
              title="Instalar App no dispositivo"
              aria-label="Instalar App"
              className={`flex items-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 transition-all cursor-pointer group ${
                isCollapsed
                  ? 'w-9 h-9 mx-auto justify-center rounded-xl bg-emerald-500/10'
                  : 'w-full gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-emerald-500/5'
              }`}
            >
              <Smartphone
                className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span className="flex-1 text-left text-xs font-medium text-emerald-300 truncate">
                  Instalar App
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Rodapé da Sidebar / Configurações & Perfil */}
        <div className="p-2 border-t border-white/8 space-y-0.5">
          {/* Botão de Configurações no lugar do antigo indicador de nuvem */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              if (onOpenSettingsModal) {
                onOpenSettingsModal()
              } else {
                onOpenThemeModal?.()
              }
              onCloseMobile()
            }}
            title="Configurações"
            aria-label="Configurações"
            className={`flex items-center text-zinc-400 hover:text-zinc-100 hover:bg-white/4 border border-transparent transition-all cursor-pointer group ${
              isCollapsed
                ? 'w-9 h-9 mx-auto justify-center rounded-xl'
                : 'w-full gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium'
            }`}
          >
            <Settings
              className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-45"
              aria-hidden="true"
            />
            {!isCollapsed && (
              <span className="flex-1 text-left text-xs font-medium text-zinc-300 group-hover:text-white truncate">
                Configurações
              </span>
            )}
          </button>

          {/* Botão de Logout */}
          {onLogout && (
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onLogout()
              }}
              title="Sair da conta"
              aria-label="Sair da conta"
              className={`flex items-center text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent transition-all cursor-pointer group ${
                isCollapsed
                  ? 'w-9 h-9 mx-auto justify-center rounded-xl'
                  : 'w-full gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium'
              }`}
            >
              <LogOut
                className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                aria-hidden="true"
              />
              {!isCollapsed && (
                <span className="flex-1 text-left text-xs font-medium text-zinc-400 group-hover:text-rose-300 truncate">
                  Sair da conta
                </span>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
