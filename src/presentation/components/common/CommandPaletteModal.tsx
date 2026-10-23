import {
  BarChart3,
  CreditCard,
  DollarSign,
  FolderTree,
  HandCoins,
  LayoutDashboard,
  MessageSquare,
  Moon,
  Palette,
  Plus,
  Receipt,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  Upload,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import type { Transaction } from '../../../domain/models/transaction'

export interface CommandPaletteModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectSection: (section: string) => void
  onOpenNewTransaction: () => void
  onOpenImport: () => void
  onOpenSettings: () => void
  onOpenThemes: () => void
  transactions?: Transaction[]
  onSelectTransaction?: (tx: Transaction) => void
}

interface CommandItem {
  id: string
  title: string
  description: string
  group: 'navigation' | 'actions' | 'themes' | 'transactions'
  icon: typeof LayoutDashboard
  iconColor: string
  shortcut?: string
  action: () => void
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectSection,
  onOpenNewTransaction,
  onOpenImport,
  onOpenSettings,
  onOpenThemes,
  transactions = [],
  onSelectTransaction,
}: CommandPaletteModalProps) {
  const { currentTheme, setTheme } = useTheme()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Foco no input ao abrir
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Catálogo estático de comandos
  const allCommands = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      // 1. AÇÕES RÁPIDAS
      {
        id: 'action-new-tx',
        title: 'Nova Transação',
        description: 'Registrar entrada ou saída de dinheiro',
        group: 'actions',
        icon: Plus,
        iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        shortcut: 'N',
        action: () => {
          onClose()
          onOpenNewTransaction()
        },
      },
      {
        id: 'action-import',
        title: 'Importar Extrato Bancário',
        description: 'Carregar arquivo OFX, CSV ou TXT',
        group: 'actions',
        icon: Upload,
        iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        shortcut: 'I',
        action: () => {
          onClose()
          onOpenImport()
        },
      },
      {
        id: 'action-settings',
        title: 'Configurações',
        description: 'Ajustar preferências da conta e moeda',
        group: 'actions',
        icon: Settings,
        iconColor: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
        shortcut: 'S',
        action: () => {
          onClose()
          onOpenSettings()
        },
      },
      {
        id: 'action-themes',
        title: 'Temas de Desenvolvedor',
        description: 'Personalizar paleta visual da interface',
        group: 'actions',
        icon: Palette,
        iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        shortcut: 'T',
        action: () => {
          onClose()
          onOpenThemes()
        },
      },

      // 2. NAVEGAÇÃO
      {
        id: 'nav-dashboard',
        title: 'Ir para Dashboard',
        description: 'Visão geral, métricas e saldo consolidado',
        group: 'navigation',
        icon: LayoutDashboard,
        iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        shortcut: '1',
        action: () => {
          onClose()
          onSelectSection('dashboard')
        },
      },
      {
        id: 'nav-transactions',
        title: 'Ir para Transações',
        description: 'Histórico completo, filtros e busca',
        group: 'navigation',
        icon: Receipt,
        iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        shortcut: '2',
        action: () => {
          onClose()
          onSelectSection('transactions')
        },
      },
      {
        id: 'nav-cards',
        title: 'Ir para Cartões & Faturas',
        description: 'Parcelamentos e projeções de fatura',
        group: 'navigation',
        icon: CreditCard,
        iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        shortcut: '3',
        action: () => {
          onClose()
          onSelectSection('cards')
        },
      },
      {
        id: 'nav-debts',
        title: 'Ir para Dívidas & Empréstimos',
        description: 'Simulador e quitação estratégica',
        group: 'navigation',
        icon: HandCoins,
        iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        shortcut: '4',
        action: () => {
          onClose()
          onSelectSection('debts')
        },
      },
      {
        id: 'nav-budget',
        title: 'Ir para Planejamento',
        description: 'Metas e teto mensal de gastos',
        group: 'navigation',
        icon: Target,
        iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        shortcut: '5',
        action: () => {
          onClose()
          onSelectSection('budget')
        },
      },
      {
        id: 'nav-categories',
        title: 'Ir para Categorias',
        description: 'Gestão de origens e destinos financeiros',
        group: 'navigation',
        icon: FolderTree,
        iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
        shortcut: '6',
        action: () => {
          onClose()
          onSelectSection('categories')
        },
      },
      {
        id: 'nav-reports',
        title: 'Ir para Relatórios',
        description: 'Análise detalhada por período',
        group: 'navigation',
        icon: BarChart3,
        iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
        shortcut: '7',
        action: () => {
          onClose()
          onSelectSection('reports')
        },
      },
      {
        id: 'nav-whatsapp',
        title: 'Ir para WhatsApp IA',
        description: 'Assistente financeiro e transcrição de áudio',
        group: 'navigation',
        icon: MessageSquare,
        iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        action: () => {
          onClose()
          onSelectSection('whatsapp')
        },
      },

      // 3. TEMAS RÁPIDOS
      {
        id: 'theme-emerald',
        title: 'Mudar tema: Emerald Matrix',
        description: 'Verde cibernético em preto puro',
        group: 'themes',
        icon: Sparkles,
        iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        action: () => {
          setTheme('emerald')
          onClose()
        },
      },
      {
        id: 'theme-dracula',
        title: 'Mudar tema: Dracula',
        description: 'Roxo e rosa místico',
        group: 'themes',
        icon: Moon,
        iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
        action: () => {
          setTheme('dracula')
          onClose()
        },
      },
      {
        id: 'theme-tokyo-night',
        title: 'Mudar tema: Tokyo Night',
        description: 'Azul neon profundo',
        group: 'themes',
        icon: Moon,
        iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
        action: () => {
          setTheme('tokyo-night')
          onClose()
        },
      },
      {
        id: 'theme-catppuccin',
        title: 'Mudar tema: Catppuccin',
        description: 'Lavanda e tons pastéis suaves',
        group: 'themes',
        icon: Sparkles,
        iconColor: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
        action: () => {
          setTheme('catppuccin')
          onClose()
        },
      },
      {
        id: 'theme-one-dark',
        title: 'Mudar tema: One Dark',
        description: 'Clássico moderno de código',
        group: 'themes',
        icon: Moon,
        iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
        action: () => {
          setTheme('one-dark')
          onClose()
        },
      },
      {
        id: 'theme-light',
        title: 'Mudar tema: Modo Claro (Light)',
        description: 'Visual limpo de alto contraste para dia',
        group: 'themes',
        icon: Sun,
        iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        action: () => {
          setTheme('light')
          onClose()
        },
      },
    ]

    return list
  }, [
    onClose,
    onOpenNewTransaction,
    onOpenImport,
    onOpenSettings,
    onOpenThemes,
    onSelectSection,
    setTheme,
  ])

  // Filtra comandos e adiciona transações compatíveis com a busca
  const filteredItems = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase()

    if (!cleanQuery) {
      return allCommands
    }

    // Comandos filtrados
    const matchedCommands = allCommands.filter(
      (cmd) =>
        cmd.title.toLowerCase().includes(cleanQuery) ||
        cmd.description.toLowerCase().includes(cleanQuery),
    )

    // Transações que coincidem com a busca
    const matchedTransactions: CommandItem[] = transactions
      .filter((tx) => tx.title.toLowerCase().includes(cleanQuery))
      .slice(0, 5)
      .map((tx) => ({
        id: `tx-${tx.id}`,
        title: tx.title,
        description: `${tx.category} • ${formatCurrency(tx.amount)}`,
        group: 'transactions' as const,
        icon: tx.type === 'income' ? DollarSign : Receipt,
        iconColor:
          tx.type === 'income'
            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            : 'text-rose-400 bg-rose-500/10 border-rose-500/20',
        action: () => {
          onClose()
          if (onSelectTransaction) {
            onSelectTransaction(tx)
          } else {
            onSelectSection('transactions')
          }
        },
      }))

    return [...matchedCommands, ...matchedTransactions]
  }, [query, allCommands, transactions, onClose, onSelectSection, onSelectTransaction])

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredItems.length))
      scrollSelectedIntoView()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(
        (prev) => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length),
      )
      scrollSelectedIntoView()
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredItems[selectedIndex]
      if (selected) {
        soundFX.playSuccess()
        selected.action()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  const scrollSelectedIntoView = () => {
    setTimeout(() => {
      const activeEl = listRef.current?.querySelector('[data-selected="true"]')
      activeEl?.scrollIntoView({ block: 'nearest' })
    }, 10)
  }

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de Comandos"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-20 px-3 sm:px-4 animate-fade-in"
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Fechar paleta"
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-pointer transition-opacity"
      />

      {/* Janela Central Estilo Raycast / Linear */}
      <div
        className="relative z-10 w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        style={{
          backgroundColor: 'var(--bg-app)',
          backdropFilter: 'blur(32px)',
        }}
      >
        {/* Campo de Busca no Topo */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10">
          <Search className="w-5 h-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="O que você deseja fazer ou buscar?..."
            aria-label="Buscar comandos ou transações"
            className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setSelectedIndex(0)
              }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-1 text-3xs font-mono text-zinc-400 px-2 py-0.5 rounded-lg border border-white/10 bg-white/5">
              ESC
            </kbd>
          )}
        </div>

        {/* Lista de Resultados */}
        <div
          ref={listRef}
          className="max-h-96 overflow-y-auto p-2 sm:p-3 space-y-1 custom-scrollbar"
        >
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Search className="w-8 h-8 mx-auto mb-2 text-zinc-600 opacity-60" />
              <p className="text-sm font-medium text-zinc-300">Nenhum resultado para "{query}"</p>
              <p className="text-2xs text-zinc-500 mt-1">
                Tente buscar por "Nova", "Cartões", "Dracula" ou o título de um gasto.
              </p>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const Icon = item.icon
              const isSelected = index === selectedIndex

              return (
                <button
                  key={item.id}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => {
                    soundFX.playSuccess()
                    item.action()
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-white/20 bg-white/10 text-white shadow-md'
                      : 'border-transparent text-zinc-300 hover:bg-white/5'
                  }`}
                  style={{
                    backgroundColor: isSelected ? `${currentTheme.primaryColor}18` : undefined,
                    borderColor: isSelected ? `${currentTheme.primaryColor}40` : undefined,
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`p-2 rounded-xl border shrink-0 ${item.iconColor}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold truncate text-white">
                          {item.title}
                        </span>
                        {item.group === 'transactions' && (
                          <span className="text-3xs font-mono px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10">
                            Transação
                          </span>
                        )}
                      </div>
                      <p className="text-2xs text-zinc-400 truncate mt-0.5">{item.description}</p>
                    </div>
                  </div>

                  {item.shortcut && (
                    <kbd className="hidden sm:inline-flex items-center font-mono text-3xs px-2 py-0.5 rounded-lg border border-white/10 bg-white/5 text-zinc-400 shrink-0 ml-2">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              )
            })
          )}
        </div>

        {/* Rodapé com Atalhos de Navegação */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-white/10 bg-black/20 text-3xs text-zinc-400">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-zinc-300 font-mono">
                ↑↓
              </kbd>
              <span>Navegar</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/15 text-zinc-300 font-mono">
                ↵
              </kbd>
              <span>Selecionar</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-zinc-500">
            <span>myFinance Command Bar</span>
          </div>
        </div>
      </div>
    </div>
  )
}
