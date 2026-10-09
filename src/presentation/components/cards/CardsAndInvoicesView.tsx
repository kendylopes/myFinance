import {
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Flame,
  Plus,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { getCategoryIcon } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'
import {
  getInstallmentGroups,
  getMonthlyInstallmentForecast,
} from '../../../domain/services/installmentForecast'

export interface CardsAndInvoicesViewProps {
  transactions: Transaction[]
  onOpenNewInstallment?: () => void
  onToggleStatus?: (id: string) => void
}

export function CardsAndInvoicesView({
  transactions,
  onOpenNewInstallment,
  onToggleStatus,
}: CardsAndInvoicesViewProps) {
  const { currentTheme } = useTheme()
  const { formatValue } = useCurrency()

  const [activeTab, setActiveTab] = useState<'timeline' | 'purchases'>('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)

  // Agrupa compras parceladas
  const installmentGroups = useMemo(() => {
    return getInstallmentGroups(transactions)
  }, [transactions])

  // Projeção das faturas para os próximos 12 meses
  const monthlyForecasts = useMemo(() => {
    return getMonthlyInstallmentForecast(transactions, 12)
  }, [transactions])

  // Total geral ainda a pagar em parcelas futuras pendentes
  const totalPendingAmount = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.type === 'expense' &&
          (t.recurrence === 'installment' || t.title.includes('/')) &&
          (t.status || 'paid') === 'pending',
      )
      .reduce((acc, t) => acc + t.amount, 0)
  }, [transactions])

  const activePurchasesCount = useMemo(() => {
    return installmentGroups.filter((g) => !g.isCompleted).length
  }, [installmentGroups])

  const completedPurchasesCount = useMemo(() => {
    return installmentGroups.filter((g) => g.isCompleted).length
  }, [installmentGroups])

  // Maior valor mensal para calcular a altura proporcional das barras no gráfico
  const maxForecastAmount = useMemo(() => {
    return Math.max(...monthlyForecasts.map((f) => f.totalAmount), 100)
  }, [monthlyForecasts])

  // Filtragem de compras por busca e status
  const filteredGroups = useMemo(() => {
    return installmentGroups.filter((g) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.category.toLowerCase().includes(searchQuery.toLowerCase())

      if (!matchesSearch) return false

      if (purchaseFilter === 'active') return !g.isCompleted
      if (purchaseFilter === 'completed') return g.isCompleted
      return true
    })
  }, [installmentGroups, searchQuery, purchaseFilter])

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Resumo Analítico dos Parcelamentos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Total Futuro a Pagar
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
            {formatValue(totalPendingAmount)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400">Soma de parcelas em aberto</p>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Compras Ativas
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
            {activePurchasesCount}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400">
            Contratos com parcelas pendentes
          </p>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-rose-400 truncate">
              Maior Fatura Prevista
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-rose-400 font-mono tracking-tight">
            {formatValue(maxForecastAmount)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400">Mês de maior peso no orçamento</p>
        </div>

        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 truncate">
              Compras Quitadas
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
            {completedPurchasesCount}
          </div>
          <p className="text-[10px] sm:text-[11px] text-zinc-400">100% liquidadas e finalizadas</p>
        </div>
      </div>

      {/* 2. Seletor de Abas & Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/10 w-fit shadow-inner">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('timeline')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Evolução das Faturas (12 Meses)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('purchases')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Compras Parceladas ({installmentGroups.length})</span>
          </button>
        </div>

        {onOpenNewInstallment && (
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onOpenNewInstallment()
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
            style={{
              backgroundColor: currentTheme.primaryColor,
              boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Compra Parcelada</span>
          </button>
        )}
      </div>

      {/* 4. Conteúdo da Aba Ativa */}
      {activeTab === 'timeline' ? (
        /* Aba 1: Gráfico e Timeline das Faturas de 12 Meses */
        <div className="space-y-4">
          <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-emerald-400" />
                  <span>Projeção de Gastos com Cartão de Crédito</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Previsão mês a mês calculada a partir de compras parceladas e recorrentes
                </p>
              </div>
              <span className="text-xs text-zinc-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 hidden sm:inline-block">
                Próximos 12 Meses
              </span>
            </div>

            {/* Gráfico de Barras com rolagem suave no mobile */}
            <div className="overflow-x-auto custom-scrollbar pb-3 pt-2">
              <div className="flex items-end justify-between gap-2.5 sm:gap-3 min-w-170 h-52 px-2 border-b border-white/10 pb-2">
                {monthlyForecasts.map((item) => {
                  const heightPercent =
                    maxForecastAmount > 0
                      ? Math.max(8, (item.totalAmount / maxForecastAmount) * 100)
                      : 8
                  const isHighest = item.totalAmount === maxForecastAmount && item.totalAmount > 0
                  const isHovered = hoveredMonth === item.yearMonth

                  return (
                    // biome-ignore lint/a11y/noStaticElementInteractions: Interação de hover visual para exibir projeção do mês
                    <div
                      key={item.yearMonth}
                      onMouseEnter={() => setHoveredMonth(item.yearMonth)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    >
                      {/* Tooltip flutuante */}
                      <div
                        className={`absolute -top-12 z-20 px-2.5 py-1 rounded-xl bg-zinc-900 border border-white/20 text-center shadow-xl transition-all pointer-events-none whitespace-nowrap ${
                          isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                      >
                        <span className="text-[10px] text-zinc-400 block">{item.monthLabel}</span>
                        <span className="text-xs font-bold font-mono text-emerald-400">
                          {formatValue(item.totalAmount)}
                        </span>
                      </div>

                      {/* Barra */}
                      <div className="w-full max-w-10.5 flex flex-col items-center justify-end h-full">
                        <div
                          className={`w-full rounded-2xl transition-all duration-300 relative ${
                            isHighest
                              ? 'bg-linear-to-t from-rose-500 to-amber-400 shadow-lg shadow-rose-500/25'
                              : item.totalAmount > 0
                                ? 'bg-linear-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300 shadow-md shadow-emerald-500/15'
                                : 'bg-white/5'
                          }`}
                          style={{ height: `${heightPercent}%` }}
                        >
                          {isHighest && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold px-1 rounded bg-rose-500 text-white">
                              Pico
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Legenda do Mês */}
                      <span className="text-[11px] font-medium text-zinc-400 group-hover:text-white mt-2 truncate max-w-14 text-center">
                        {item.monthLabel.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 group-hover:text-emerald-400">
                        {formatValue(item.totalAmount).split(',')[0]}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Aba 2: Lista de Compras Parceladas e Parcelas Individuais */
        <div className="space-y-4">
          {/* Controles de Busca e Filtro */}
          <div className="glass-card p-3 sm:p-4 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/10 text-xs w-fit">
              <button
                type="button"
                onClick={() => setPurchaseFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  purchaseFilter === 'all'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todas ({installmentGroups.length})
              </button>
              <button
                type="button"
                onClick={() => setPurchaseFilter('active')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  purchaseFilter === 'active'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ativas ({activePurchasesCount})
              </button>
              <button
                type="button"
                onClick={() => setPurchaseFilter('completed')}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                  purchaseFilter === 'completed'
                    ? 'bg-emerald-500 text-zinc-950 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Concluídas ({completedPurchasesCount})
              </button>
            </div>

            <div className="relative min-w-56">
              <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar compra ou loja..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>

          {/* Lista de Compras Parceladas */}
          {filteredGroups.length === 0 ? (
            <div className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-2">
              <ShoppingBag className="w-8 h-8 text-zinc-500 mx-auto" />
              <h4 className="text-sm font-bold text-white">Nenhuma compra parcelada encontrada</h4>
              <p className="text-xs text-zinc-400">
                {searchQuery
                  ? 'Ajuste os termos de busca para encontrar suas compras.'
                  : 'Suas transações parceladas aparecerão aqui automaticamente.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGroups.map((group) => {
                const isExpanded = expandedGroupId === group.id
                const CategoryIcon = getCategoryIcon(group.category)
                const percentDone =
                  group.totalInstallments > 0
                    ? Math.round((group.paidCount / group.totalInstallments) * 100)
                    : 100

                return (
                  <div
                    key={group.id}
                    className="glass-card rounded-2xl border border-white/10 overflow-hidden transition-all"
                  >
                    {/* Linha Resumo da Compra */}
                    <button
                      type="button"
                      onClick={() => {
                        soundFX.playClick()
                        setExpandedGroupId(isExpanded ? null : group.id)
                      }}
                      className="w-full p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:bg-white/4 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-white/5 text-zinc-300 border border-white/10 shrink-0">
                          <CategoryIcon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{group.title}</span>
                            {group.isCompleted ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Concluída
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                {group.paidCount}/{group.totalInstallments} pagas
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                            <span>{group.category}</span>
                            <span>•</span>
                            <span className="font-mono text-white">
                              {formatValue(group.installmentAmount)}/mês
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                        {/* Barra de Progresso */}
                        <div className="w-28 hidden md:block">
                          <div className="flex items-center justify-between text-[10px] text-zinc-400 mb-1">
                            <span>Progresso</span>
                            <span className="font-bold text-emerald-400">{percentDone}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${percentDone}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-zinc-400 block text-[10px] uppercase">
                            Total da Compra
                          </span>
                          <span className="text-sm font-bold font-mono text-white">
                            {formatValue(group.totalAmount)}
                          </span>
                        </div>

                        <div className="p-1 rounded-lg bg-white/5 text-zinc-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Detalhe Expansível das Parcelas Individuais */}
                    {isExpanded && (
                      <div className="p-4 bg-black/20 border-t border-white/5 space-y-2">
                        <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                          Detalhamento das Parcelas
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {group.items.map((tx) => {
                            const isPaid = tx.status === 'paid'

                            return (
                              <div
                                key={tx.id}
                                className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-colors ${
                                  isPaid
                                    ? 'bg-emerald-500/5 border-emerald-500/20 text-zinc-300'
                                    : 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                                }`}
                              >
                                <div>
                                  <span className="font-semibold text-white block truncate max-w-36">
                                    {tx.title}
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    {tx.date.split('-').reverse().join('/')}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="font-bold font-mono text-white">
                                    {formatValue(tx.amount)}
                                  </span>
                                  {onToggleStatus && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundFX.playClick()
                                        onToggleStatus(tx.id)
                                      }}
                                      title={isPaid ? 'Marcar como Pendente' : 'Marcar como Paga'}
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition ${
                                        isPaid
                                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                                          : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                      }`}
                                    >
                                      {isPaid ? 'Paga' : 'Pendente'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
