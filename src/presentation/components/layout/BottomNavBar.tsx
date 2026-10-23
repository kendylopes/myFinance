import {
  BarChart3,
  CreditCard,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  MessageSquare,
  MoreHorizontal,
  Plus,
  Receipt,
  Settings,
  Target,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'

export interface BottomNavBarProps {
  activeSection: string
  onSelectSection: (section: string) => void
  onOpenNewTransaction: () => void
  onOpenSettings?: () => void
}

export function BottomNavBar({
  activeSection,
  onSelectSection,
  onOpenNewTransaction,
  onOpenSettings,
}: BottomNavBarProps) {
  const { currentTheme } = useTheme()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  // Fecha o menu "Mais" ao pressionar Escape
  useEffect(() => {
    if (!isMoreOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isMoreOpen])

  const handleNavClick = (sectionId: string) => {
    soundFX.playClick()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(10)
    }
    onSelectSection(sectionId)
    setIsMoreOpen(false)
  }

  const handleNewTransactionClick = () => {
    soundFX.playClick()
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(15)
    }
    setIsMoreOpen(false)
    onOpenNewTransaction()
  }

  const handleOpenSettingsClick = () => {
    soundFX.playClick()
    setIsMoreOpen(false)
    onOpenSettings?.()
  }

  // Seções secundárias do menu "Mais"
  const moreItems = [
    {
      id: 'reports',
      label: 'Relatórios',
      description: 'Análise detalhada por período',
      icon: BarChart3,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp IA',
      description: 'Lançamentos e extrato por voz/texto',
      icon: MessageSquare,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      badge: 'IA',
    },
    {
      id: 'debts',
      label: 'Dívidas & Empréstimos',
      description: 'Gestão de contratos e juros',
      icon: HandCoins,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
    {
      id: 'budget',
      label: 'Planejamento',
      description: 'Metas e teto mensal',
      icon: Target,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      id: 'categories',
      label: 'Categorias',
      description: 'Origem e destino das finanças',
      icon: FolderTree,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
  ]

  // Verifica se a tela ativa é uma das opções do menu "Mais"
  const isMoreActive = moreItems.some((item) => item.id === activeSection)

  return (
    <>
      {/* 1. BOTTOM SHEET / GAVETA DESLIZANTE DE MAIS OPÇÕES */}
      {isMoreOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mais opções de navegação"
          className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-fade-in"
        >
          {/* Backdrop Escuro Translúcido com Blur */}
          <button
            type="button"
            aria-label="Fechar menu de mais opções"
            onClick={() => setIsMoreOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-md cursor-pointer transition-opacity"
          />

          {/* Painel do Bottom Sheet */}
          <div
            className="relative z-10 w-full rounded-t-3xl border-t border-white/10 p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom duration-300"
            style={{
              backgroundColor: 'var(--bg-card)',
              backdropFilter: 'blur(28px)',
              paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))',
            }}
          >
            {/* Barra de arraste tátil (Drag Handle) */}
            <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto -mt-1 mb-2" />

            {/* Cabeçalho do Menu */}
            <div className="flex items-center justify-between border-b border-white/8 pb-3">
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Mais Funcionalidades
                </h3>
                <p className="text-2xs text-zinc-400">
                  Navegue pelas áreas especializadas do myFinance
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreOpen(false)}
                aria-label="Fechar"
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Grid com Itens Secundários */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {moreItems.map((item) => {
                const Icon = item.icon
                const isActive = activeSection === item.id

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                      isActive
                        ? 'border-emerald-500/50 bg-emerald-500/15 shadow-md'
                        : 'border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl border shrink-0 ${item.bgColor} ${item.color}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-white' : 'text-zinc-200'
                          }`}
                        >
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-3xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-zinc-400 truncate mt-0.5">{item.description}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Ação Rápida de Configurações no Sheet */}
            <div className="pt-2 border-t border-white/8">
              <button
                type="button"
                onClick={handleOpenSettingsClick}
                className="w-full flex items-center justify-between p-3 rounded-2xl border border-white/8 bg-white/4 hover:bg-white/8 text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <span className="text-xs font-semibold block text-white">
                      Configurações & Temas
                    </span>
                    <span className="text-2xs text-zinc-400 block">
                      Personalização e preferências
                    </span>
                  </div>
                </div>
                <span className="text-2xs text-zinc-500 font-medium px-2 py-1 rounded-lg bg-white/5">
                  Abrir
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. BARRA DE NAVEGAÇÃO INFERIOR FIXA (MOBILE) */}
      <nav
        aria-label="Navegação Principal Mobile"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-white/10 shadow-2xl transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          backdropFilter: 'blur(24px)',
          paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0.4rem))',
        }}
      >
        <div className="max-w-md mx-auto px-3 py-1 flex items-center justify-between relative">
          {/* Botão 1: Início (Dashboard) */}
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            aria-label="Início"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer flex-1 ${
              activeSection === 'dashboard' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <LayoutDashboard
                className="w-5 h-5 transition-transform"
                style={{
                  color: activeSection === 'dashboard' ? currentTheme.primaryColor : undefined,
                }}
              />
              {activeSection === 'dashboard' && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
              )}
            </div>
            <span
              className={`text-3xs font-medium mt-1 truncate ${
                activeSection === 'dashboard' ? 'font-bold' : ''
              }`}
              style={{
                color: activeSection === 'dashboard' ? currentTheme.primaryColor : undefined,
              }}
            >
              Início
            </span>
          </button>

          {/* Botão 2: Extrato (Transações) */}
          <button
            type="button"
            onClick={() => handleNavClick('transactions')}
            aria-label="Extrato de Transações"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer flex-1 ${
              activeSection === 'transactions' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <Receipt
                className="w-5 h-5 transition-transform"
                style={{
                  color: activeSection === 'transactions' ? currentTheme.primaryColor : undefined,
                }}
              />
              {activeSection === 'transactions' && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
              )}
            </div>
            <span
              className={`text-3xs font-medium mt-1 truncate ${
                activeSection === 'transactions' ? 'font-bold' : ''
              }`}
              style={{
                color: activeSection === 'transactions' ? currentTheme.primaryColor : undefined,
              }}
            >
              Extrato
            </span>
          </button>

          {/* Botão 3: FAB CENTRAL FLUTUANTE (+) */}
          <div className="flex-1 flex justify-center -mt-6">
            <button
              type="button"
              onClick={handleNewTransactionClick}
              aria-label="Nova Transação"
              title="Adicionar nova movimentação"
              className="w-13 h-13 rounded-2xl flex items-center justify-center text-slate-950 font-black shadow-lg transition-all transform active:scale-90 hover:scale-105 cursor-pointer border border-white/25"
              style={{
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 8px 24px -4px ${currentTheme.primaryColor}66, 0 2px 6px -1px rgba(0,0,0,0.4)`,
              }}
            >
              <Plus className="w-6 h-6 stroke-[2.8]" />
            </button>
          </div>

          {/* Botão 4: Cartões (Faturas) */}
          <button
            type="button"
            onClick={() => handleNavClick('cards')}
            aria-label="Cartões e Faturas"
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer flex-1 ${
              activeSection === 'cards' ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <CreditCard
                className="w-5 h-5 transition-transform"
                style={{
                  color: activeSection === 'cards' ? currentTheme.primaryColor : undefined,
                }}
              />
              {activeSection === 'cards' && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
              )}
            </div>
            <span
              className={`text-3xs font-medium mt-1 truncate ${
                activeSection === 'cards' ? 'font-bold' : ''
              }`}
              style={{
                color: activeSection === 'cards' ? currentTheme.primaryColor : undefined,
              }}
            >
              Cartões
            </span>
          </button>

          {/* Botão 5: Mais (Menu de Outras Seções) */}
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setIsMoreOpen(!isMoreOpen)
            }}
            aria-label="Mais opções"
            aria-expanded={isMoreOpen}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer flex-1 ${
              isMoreActive || isMoreOpen ? 'text-white' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div className="relative">
              <MoreHorizontal
                className="w-5 h-5 transition-transform"
                style={{
                  color: isMoreActive || isMoreOpen ? currentTheme.primaryColor : undefined,
                }}
              />
              {(isMoreActive || isMoreOpen) && (
                <span
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                />
              )}
            </div>
            <span
              className={`text-3xs font-medium mt-1 truncate ${
                isMoreActive || isMoreOpen ? 'font-bold' : ''
              }`}
              style={{
                color: isMoreActive || isMoreOpen ? currentTheme.primaryColor : undefined,
              }}
            >
              Mais
            </span>
          </button>
        </div>
      </nav>
    </>
  )
}
