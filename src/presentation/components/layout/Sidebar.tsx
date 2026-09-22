import {
  ChevronLeft,
  ChevronRight,
  Cloud,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Palette,
  Receipt,
  Target,
  Wallet,
  X,
} from 'lucide-react'
import { useState } from 'react'
import type { AuthUser } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'

export interface SidebarProps {
  user?: AuthUser | null
  onLogout?: () => void
  activeSection: string
  onSelectSection: (section: string) => void
  onOpenThemeModal: () => void
  isMobileOpen: boolean
  onCloseMobile: () => void
}

export function Sidebar({
  user,
  onLogout,
  activeSection,
  onSelectSection,
  onOpenThemeModal,
  isMobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { currentTheme } = useTheme()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Visão Geral',
      icon: LayoutDashboard,
      description: 'Métricas e Gráficos',
    },
    {
      id: 'transactions',
      label: 'Lançamentos',
      icon: Receipt,
      description: 'Entradas e Saídas',
    },
    {
      id: 'budget',
      label: 'Planejamento',
      icon: Target,
      description: 'Metas & Teto Mensal',
    },
    {
      id: 'categories',
      label: 'Categorias',
      icon: FolderTree,
      description: 'Origem & Destino',
    },
  ]

  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  const handleNavClick = (id: string) => {
    soundFX.playClick()
    onSelectSection(id)
    onCloseMobile()
  }

  const handleToggleCollapse = () => {
    soundFX.playClick()
    setIsCollapsed(!isCollapsed)
  }

  return (
    <>
      {/* Backdrop para Mobile Drawer */}
      {isMobileOpen && (
        <div
          role="presentation"
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Container Principal da Sidebar */}
      <aside
        aria-label="Menu Lateral de Navegação"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64'}`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Cabeçalho da Sidebar / Logo */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className="p-2.5 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              <Wallet className="w-5 h-5" aria-hidden="true" />
            </div>

            {!isCollapsed && (
              <div className="overflow-hidden">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-base text-white tracking-tight leading-none">
                    my<span style={{ color: currentTheme.primaryColor }}>Finance</span>
                  </span>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider"
                    style={{
                      backgroundColor: `${currentTheme.primaryColor}25`,
                      color: currentTheme.primaryColor,
                    }}
                  >
                    DEV
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 block mt-1 truncate">
                  {currentTheme.name}
                </span>
              </div>
            )}
          </div>

          {/* Botão fechar (Mobile) ou recolher (Desktop) */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Fechar menu lateral"
              className="lg:hidden p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleToggleCollapse}
              aria-label={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              title={isCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="hidden lg:flex p-1.5 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 cursor-pointer transition-colors"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Links de Navegação */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer group ${
                    isActive
                      ? 'text-white border shadow-md'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent'
                  }`}
                  style={{
                    backgroundColor: isActive ? `${currentTheme.primaryColor}20` : undefined,
                    borderColor: isActive ? `${currentTheme.primaryColor}50` : undefined,
                    color: isActive ? '#ffffff' : undefined,
                  }}
                >
                  <Icon
                    className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110"
                    style={{
                      color: isActive ? currentTheme.primaryColor : undefined,
                    }}
                    aria-hidden="true"
                  />
                  {!isCollapsed && (
                    <div className="text-left overflow-hidden">
                      <span className="block truncate">{item.label}</span>
                      <span className="text-[10px] text-zinc-500 font-normal block truncate">
                        {item.description}
                      </span>
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Divisor */}
          <div className="pt-3 my-2 border-t border-white/10" />

          {/* Botão de Temas Dev */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onOpenThemeModal()
              onCloseMobile()
            }}
            title={isCollapsed ? 'Temas de Desenvolvedor' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/8 border border-white/10 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div
              className="p-1 rounded-lg shrink-0"
              style={{
                backgroundColor: `${currentTheme.primaryColor}25`,
                color: currentTheme.primaryColor,
              }}
            >
              <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            </div>

            {!isCollapsed && (
              <div className="flex-1 text-left truncate flex items-center justify-between">
                <div>
                  <span className="block truncate text-white">Temas Dev</span>
                  <span className="text-[10px] text-zinc-400 block truncate">5 paletas de IDE</span>
                </div>
                <span
                  className="w-2.5 h-2.5 rounded-full ring-2 ring-black/50 shrink-0"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
              </div>
            )}
          </button>
        </nav>

        {/* Rodapé da Sidebar / Perfil do Desenvolvedor */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {/* Card de Nuvem */}
          {!isCollapsed && (
            <div className="px-3 py-2 rounded-xl bg-white/4 border border-white/8 flex items-center gap-2 text-[11px] text-zinc-300">
              <Cloud
                className="w-3.5 h-3.5 animate-pulse shrink-0"
                style={{ color: currentTheme.primaryColor }}
              />
              <span className="truncate">Supabase PostgreSQL</span>
            </div>
          )}

          {/* Perfil & Logout */}
          <div
            className={`flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } p-2 rounded-2xl bg-white/5 border border-white/8`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div
                className="w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center shrink-0 border"
                style={{
                  backgroundColor: `${currentTheme.primaryColor}25`,
                  borderColor: `${currentTheme.primaryColor}50`,
                  color: currentTheme.primaryColor,
                }}
              >
                {userInitial}
              </div>

              {!isCollapsed && user && (
                <div className="overflow-hidden text-left">
                  <span className="text-xs font-semibold text-white block truncate max-w-[120px]">
                    {user.name || user.email}
                  </span>
                  <span className="text-[10px] text-zinc-400 block truncate">Online</span>
                </div>
              )}
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  onLogout()
                }}
                title="Sair da conta"
                aria-label="Sair da conta"
                className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}
