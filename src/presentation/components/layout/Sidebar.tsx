import {
  ChevronLeft,
  ChevronRight,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Palette,
  Receipt,
  Settings,
  Target,
  Wallet,
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
  isMobileOpen: _isMobileOpen,
  onCloseMobile,
  isCollapsed: controlledCollapsed,
  onToggleCollapse: controlledToggle,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const isCollapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed

  const { currentTheme } = useTheme()

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      description: 'Métricas e Gráficos',
    },
    {
      id: 'transactions',
      label: 'Transações',
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
      {/* Container Principal da Sidebar - Sempre visível, largura adaptável sem backdrop obstrutivo */}
      <aside
        aria-label="Menu Lateral de Navegação"
        className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r border-white/10 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-14 sm:w-16' : 'w-48 sm:w-52'
        }`}
        style={{
          backgroundColor: 'var(--bg-sidebar)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Cabeçalho da Sidebar / Apenas Ícone Principal do App e Nome do App */}
        {isCollapsed ? (
          <div className="p-2.5 sm:p-3 flex flex-col items-center gap-2 border-b border-white/10">
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
              className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="p-3 sm:p-3.5 flex items-center justify-between border-b border-white/10">
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
                className="flex p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Links de Navegação */}
        <nav className="flex-1 p-2.5 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`flex items-center transition-all cursor-pointer group ${
                    isCollapsed
                      ? 'w-8 h-8 mx-auto justify-center rounded-xl'
                      : 'w-full gap-2 px-2 py-2 rounded-xl text-xs font-semibold'
                  } ${
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
                    className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
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
          <div className="pt-2 my-1.5 border-t border-white/10" />

          {/* Botão de Temas Dev (Padronizado com os demais itens de navegação) */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onOpenThemeModal()
              onCloseMobile()
            }}
            title="Temas Dev"
            aria-label="Temas Dev"
            className={`flex items-center text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent transition-all cursor-pointer group ${
              isCollapsed
                ? 'w-8 h-8 mx-auto justify-center rounded-xl'
                : 'w-full gap-2 px-2 py-2 rounded-xl text-xs font-semibold'
            }`}
          >
            <Palette
              className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
              style={{ color: currentTheme.primaryColor }}
              aria-hidden="true"
            />
            {!isCollapsed && (
              <div className="text-left overflow-hidden flex-1">
                <span className="block truncate text-zinc-300 group-hover:text-white">
                  Temas Dev
                </span>
                <span className="text-[10px] text-zinc-500 font-normal block truncate">
                  5 paletas de IDE
                </span>
              </div>
            )}
          </button>
        </nav>

        {/* Rodapé da Sidebar / Configurações & Perfil */}
        <div className="p-2 border-t border-white/10 space-y-1">
          {/* Botão de Configurações no lugar do antigo indicador de nuvem */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              if (onOpenSettingsModal) {
                onOpenSettingsModal()
              } else {
                onOpenThemeModal()
              }
              onCloseMobile()
            }}
            title="Configurações"
            aria-label="Configurações"
            className={`flex items-center text-zinc-400 hover:text-zinc-100 hover:bg-white/5 border border-transparent transition-all cursor-pointer group ${
              isCollapsed
                ? 'w-8 h-8 mx-auto justify-center rounded-xl'
                : 'w-full gap-2 px-2 py-2 rounded-xl text-xs font-semibold'
            }`}
          >
            <Settings
              className="w-4 h-4 shrink-0 transition-transform group-hover:rotate-45"
              aria-hidden="true"
            />
            {!isCollapsed && (
              <div className="text-left overflow-hidden flex-1">
                <span className="block truncate text-zinc-300 group-hover:text-white">
                  Configurações
                </span>
                <span className="text-[10px] text-zinc-500 font-normal block truncate">
                  Preferências do App
                </span>
              </div>
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
                  ? 'w-8 h-8 mx-auto justify-center rounded-xl'
                  : 'w-full gap-2 px-2 py-2 rounded-xl text-xs font-semibold'
              }`}
            >
              <LogOut
                className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105"
                aria-hidden="true"
              />
              {!isCollapsed && (
                <div className="text-left overflow-hidden flex-1">
                  <span className="block truncate text-zinc-300 group-hover:text-rose-300">
                    Sair da conta
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal block truncate">
                    Encerrar sessão
                  </span>
                </div>
              )}
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
