import {
  AlertCircle,
  Calendar,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  Flame,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { getCategoryIcon } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'
import {
  getInstallmentGroups,
  getMonthlyInstallmentForecast,
} from '../../../domain/services/installmentForecast'

interface InstallmentsForecastModalProps {
  isOpen: boolean
  onClose: () => void
  transactions: Transaction[]
  onOpenNewInstallment: () => void
}

export function InstallmentsForecastModal({
  isOpen,
  onClose,
  transactions,
  onOpenNewInstallment,
}: InstallmentsForecastModalProps) {
  const { currentTheme } = useTheme()
  const { formatValue } = useCurrency()

  const [activeTab, setActiveTab] = useState<'timeline' | 'purchases'>('timeline')
  const [searchQuery, setSearchQuery] = useState('')
  const [purchaseFilter, setPurchaseFilter] = useState<'all' | 'active' | 'completed'>('all')
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-white/10 glass-card shadow-2xl relative overflow-hidden"
        style={{
          boxShadow: `0 25px 60px -15px ${currentTheme.primaryColor}25`,
        }}
      >
        {/* Glow sutil no topo do modal */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
          style={{ backgroundColor: currentTheme.primaryColor }}
        />

        {/* 1. Header do Modal (Estilo Fintech Premium) */}
        <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-center justify-between gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="p-3 rounded-2xl border shadow-lg shrink-0 flex items-center justify-center"
              style={{
                backgroundColor: `${currentTheme.primaryColor}15`,
                borderColor: `${currentTheme.primaryColor}35`,
                color: currentTheme.primaryColor,
              }}
            >
              <CreditCard className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Gestão de Faturas & Parcelamentos
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activePurchasesCount}{' '}
                  {activePurchasesCount === 1 ? 'compra ativa' : 'compras ativas'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                Previsão exata do comprometimento do seu limite e faturas nos próximos 12 meses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onOpenNewInstallment()
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-zinc-950 shadow-md cursor-pointer hover:scale-105 active:scale-95 transition-all"
              style={{ backgroundColor: currentTheme.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5 stroke-3" />
              <span>Nova Compra</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onClose()
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Fechar modal"
              title="Pressione Esc para fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Área Rolável Principal */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 custom-scrollbar min-w-0">
          {/* 2. Cards de Resumo Executivo (Fintech Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Card 1: Saldo Comprometido Futuro */}
            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-rose-500/30 transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Futuro Comprometido
                </span>
                <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Flame className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-rose-300 font-mono tracking-tight block">
                {formatValue(totalPendingAmount)}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                <span>Parcelas ainda a vencer no cartão</span>
              </p>
            </div>

            {/* Card 2: Compras Ativas vs Histórico */}
            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-cyan-500/30 transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Parcelamentos Ativos
                </span>
                <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShoppingBag className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {activePurchasesCount}
                </span>
                <span className="text-xs text-zinc-400 font-medium">
                  de {installmentGroups.length} no histórico
                </span>
              </div>
              <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>{completedPurchasesCount} compras 100% quitadas</span>
              </p>
            </div>

            {/* Card 3: Fatura do Ciclo Atual */}
            <div className="p-4 rounded-2xl bg-white/2 border border-white/5 hover:border-amber-500/30 transition-all group relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  Fatura do Mês Atual
                </span>
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <CalendarClock className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-amber-300 font-mono tracking-tight block">
                {formatValue(monthlyForecasts[0]?.totalAmount || 0)}
              </span>
              <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
                <span className="text-zinc-300 font-semibold font-mono">
                  {monthlyForecasts[0]?.itemsCount || 0}
                </span>
                <span>parcelas caindo neste ciclo</span>
              </p>
            </div>
          </div>

          {/* 3. Segmented Control de Abas (Estilo Apple / Linear) */}
          <div className="flex items-center justify-between gap-3 flex-wrap border-b border-white/8 pb-3">
            <div className="inline-flex p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setActiveTab('timeline')
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'timeline'
                    ? 'bg-white/15 text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-emerald-400" />
                <span>Projeção Mês a Mês (12 Meses)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setActiveTab('purchases')
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'purchases'
                    ? 'bg-white/15 text-white shadow-sm border border-white/10'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Minhas Compras Parceladas</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[10px] font-mono text-zinc-300">
                  {installmentGroups.length}
                </span>
              </button>
            </div>

            {/* Dica contextual discreta */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Calculado em tempo real com base nos seus lançamentos</span>
            </div>
          </div>

          {/* 4. Conteúdo: ABA 1 - PROJEÇÃO MÊS A MÊS (TIMELINE) */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              {/* Gráfico Visual Interativo das Faturas Futuras */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white/2 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Curva de Comprometimento das Faturas (12 Meses)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Passe o mouse ou toque nas barras para ver os valores de cada mês
                    </span>
                  </div>
                  {hoveredMonth && (
                    <div className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-bold animate-fade-in">
                      {hoveredMonth}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-32 pt-5 pb-1">
                  {monthlyForecasts.map((m, index) => {
                    const heightPercent =
                      maxForecastAmount > 0
                        ? Math.max(12, Math.round((m.totalAmount / maxForecastAmount) * 100))
                        : 12
                    const hasAmount = m.totalAmount > 0
                    const isFirstMonth = index === 0

                    return (
                      // biome-ignore lint/a11y/noStaticElementInteractions: Interação de hover visual para exibir valor do mês
                      <div
                        key={m.yearMonth}
                        className="flex flex-col items-center gap-1.5 group h-full justify-end cursor-pointer"
                        onMouseEnter={() =>
                          setHoveredMonth(
                            `${m.monthLabel}: ${formatValue(m.totalAmount)} (${m.itemsCount} ${m.itemsCount === 1 ? 'parcela' : 'parcelas'})`,
                          )
                        }
                        onMouseLeave={() => setHoveredMonth(null)}
                        title={`${m.monthLabel}: ${formatValue(m.totalAmount)} (${m.itemsCount} parcelas)`}
                      >
                        <div
                          className={`w-full rounded-xl transition-all duration-300 relative group-hover:scale-105 group-hover:shadow-lg ${
                            hasAmount
                              ? isFirstMonth
                                ? 'bg-linear-to-t from-emerald-600/50 to-teal-400/80 border border-teal-400/50 shadow-xs shadow-teal-500/20'
                                : 'bg-linear-to-t from-rose-500/40 via-amber-500/50 to-amber-400/70 border border-amber-400/30'
                              : 'bg-white/5 border border-white/5 opacity-50'
                          }`}
                          style={{ height: `${hasAmount ? heightPercent : 6}%` }}
                        >
                          {/* Mini indicador no topo da barra com valor */}
                          {hasAmount && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold text-white whitespace-nowrap bg-zinc-900/90 px-1 rounded border border-white/10 pointer-events-none z-20">
                              {formatValue(m.totalAmount)}
                            </div>
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-mono truncate max-w-full ${
                            isFirstMonth ? 'text-emerald-400 font-bold' : 'text-zinc-400'
                          }`}
                        >
                          {m.monthLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Lista Detalhada de Cada Mês */}
              <div className="space-y-3">
                {monthlyForecasts
                  .filter((m) => m.totalAmount > 0)
                  .map((m, index) => {
                    const isFirstMonth = index === 0

                    return (
                      <div
                        key={m.yearMonth}
                        className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                          isFirstMonth
                            ? 'bg-emerald-950/15 border-emerald-500/30 shadow-md'
                            : 'bg-white/2 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`p-1.5 rounded-xl border ${
                                isFirstMonth
                                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                                  : 'bg-white/5 text-zinc-300 border-white/10'
                              }`}
                            >
                              <Calendar className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">
                                  Fatura de {m.monthLabel}
                                </span>
                                {isFirstMonth && (
                                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                    Próxima Fatura
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-zinc-400 block">
                                {m.itemsCount} {m.itemsCount === 1 ? 'parcela' : 'parcelas'}{' '}
                                programadas para este mês
                              </span>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-base sm:text-lg font-black text-rose-300 font-mono tracking-tight block">
                              {formatValue(m.totalAmount)}
                            </span>
                            <span className="text-[10px] text-zinc-500">Total previsto</span>
                          </div>
                        </div>

                        {/* Itens detalhados desta fatura */}
                        <div className="pt-2 border-t border-white/5 divide-y divide-white/4">
                          {m.purchases.map((p, idx) => (
                            <div
                              // biome-ignore lint/suspicious/noArrayIndexKey: Lista renderizada estática sem reordenação
                              key={`${p.title}-${idx}`}
                              className="py-2 flex items-center justify-between text-xs gap-3 group"
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                                <span className="text-zinc-200 font-medium truncate">
                                  {p.title}
                                </span>
                                <span className="text-[10px] font-bold font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 shrink-0">
                                  {p.installment}
                                </span>
                              </div>
                              <span className="font-mono text-white font-bold shrink-0">
                                {formatValue(p.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}

                {monthlyForecasts.every((m) => m.totalAmount === 0) && (
                  <div className="text-center py-12 text-zinc-400 border border-dashed border-white/10 rounded-2xl glass-pill space-y-2">
                    <TrendingDown className="w-10 h-10 mx-auto text-emerald-400/60 mb-2" />
                    <p className="text-sm font-semibold text-white">
                      Nenhuma parcela futura no cartão de crédito!
                    </p>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                      Suas faturas dos próximos meses estão 100% livres de parcelas a vencer.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 5. Conteúdo: ABA 2 - LISTA DE COMPRAS PARCELADAS (DESIGN DE ALTA FIDELIDADE) */}
          {activeTab === 'purchases' && (
            <div className="space-y-4">
              {/* Barra de Filtros e Busca */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por compra ou categoria..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-white text-xs cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick()
                      setPurchaseFilter('all')
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                      purchaseFilter === 'all'
                        ? 'bg-white/15 border-white/20 text-white'
                        : 'border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Todas ({installmentGroups.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick()
                      setPurchaseFilter('active')
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                      purchaseFilter === 'active'
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Em Andamento ({activePurchasesCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick()
                      setPurchaseFilter('completed')
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
                      purchaseFilter === 'completed'
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'border-white/5 text-zinc-400 hover:text-white'
                    }`}
                  >
                    Quitadas ({completedPurchasesCount})
                  </button>
                </div>
              </div>

              {/* Cards das Compras */}
              {filteredGroups.length === 0 ? (
                <div className="text-center py-12 text-zinc-400 border border-dashed border-white/10 rounded-2xl glass-pill space-y-2">
                  <Clock className="w-10 h-10 mx-auto text-zinc-500 opacity-50 mb-2" />
                  <p className="text-sm font-semibold text-white">Nenhuma compra encontrada</p>
                  <p className="text-xs text-zinc-400">
                    {searchQuery
                      ? 'Nenhum resultado para os termos digitados na busca.'
                      : 'Nenhuma compra parcelada registrada nesta categoria.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGroups.map((group) => {
                    const CategoryIcon = getCategoryIcon(group.category)
                    const remainingAmount = group.pendingCount * group.installmentAmount
                    const isExpanded = expandedGroupId === group.id

                    return (
                      <div
                        key={group.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          group.isCompleted
                            ? 'border-white/5 bg-white/1 hover:border-white/10'
                            : 'border-white/10 bg-white/2 hover:border-white/20 shadow-md'
                        }`}
                      >
                        {/* Linha Principal da Compra */}
                        <div className="p-4 sm:p-5 space-y-3.5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div
                                className={`p-2.5 rounded-xl border shrink-0 shadow-sm ${
                                  group.isCompleted
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                                }`}
                              >
                                <CategoryIcon className="w-5 h-5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="text-sm sm:text-base font-bold text-white truncate">
                                    {group.title}
                                  </h4>
                                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                                    {group.category}
                                  </span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {group.totalInstallments} parcelas de aprox.{' '}
                                  <strong className="text-zinc-200 font-mono">
                                    {formatValue(group.installmentAmount)}
                                  </strong>{' '}
                                  • Total:{' '}
                                  <strong className="text-zinc-200 font-mono">
                                    {formatValue(group.totalAmount)}
                                  </strong>
                                </p>
                              </div>
                            </div>

                            {/* Badge de Status & Valor Restante */}
                            <div className="flex items-center sm:flex-col items-start sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0">
                              {group.isCompleted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> 100% Quitada
                                </span>
                              ) : (
                                <>
                                  <div className="text-left sm:text-right">
                                    <span className="text-[10px] text-zinc-400 uppercase tracking-wider block font-semibold">
                                      Resta Pagar
                                    </span>
                                    <span className="text-sm sm:text-base font-black text-rose-300 font-mono">
                                      {formatValue(remainingAmount)}
                                    </span>
                                  </div>
                                  <span className="text-[11px] text-zinc-400 font-medium">
                                    {group.paidCount} de {group.totalInstallments} parcelas pagas
                                  </span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Barra de Progresso com Gradiente */}
                          <div className="space-y-1.5 pt-1">
                            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  group.isCompleted
                                    ? 'bg-emerald-500'
                                    : 'bg-linear-to-r from-emerald-500 via-teal-400 to-cyan-400'
                                }`}
                                style={{ width: `${group.progressPercent}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-zinc-400">
                              <span className="font-mono font-medium">
                                {group.progressPercent}% concluído
                              </span>
                              {group.nextDueDate && !group.isCompleted && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-amber-400" />
                                  <span>
                                    Próximo vencimento:{' '}
                                    <strong className="text-white">
                                      {group.nextDueDate.split('-').reverse().join('/')}
                                    </strong>
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Botão de Accordion para Ver Histórico das Parcelas */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => {
                                soundFX.playClick()
                                setExpandedGroupId(isExpanded ? null : group.id)
                              }}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                            >
                              <span>
                                {isExpanded ? 'Ocultar parcelas' : 'Ver parcelas detalhadas'}
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <span className="text-[11px] text-zinc-500 font-mono">
                              {group.pendingCount}{' '}
                              {group.pendingCount === 1 ? 'pendente' : 'pendentes'}
                            </span>
                          </div>
                        </div>

                        {/* Accordion Detalhado das Parcelas Individuais */}
                        {isExpanded && (
                          <div className="bg-black/30 p-4 border-t border-white/8 space-y-2 animate-fade-in">
                            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
                              Detalhamento de Todas as Parcelas:
                            </span>
                            <div className="space-y-1.5">
                              {group.items.map((item) => {
                                const isItemPaid = item.status === 'paid'

                                return (
                                  <div
                                    key={item.id}
                                    className="p-2.5 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between text-xs gap-3"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                          isItemPaid ? 'bg-emerald-400' : 'bg-amber-400'
                                        }`}
                                      />
                                      <span className="text-white font-medium truncate">
                                        {item.title}
                                      </span>
                                      <span className="text-zinc-400 text-[11px]">
                                        {item.date.split('-').reverse().join('/')}
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-3 shrink-0">
                                      <span className="font-mono font-bold text-white">
                                        {formatValue(item.amount)}
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                          isItemPaid
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                        }`}
                                      >
                                        {isItemPaid ? 'Paga' : 'Pendente'}
                                      </span>
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

        {/* 6. Footer do Modal */}
        <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between gap-3 bg-black/20 shrink-0">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <AlertCircle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
            <span className="hidden sm:inline">
              Parcelas sincronizadas automaticamente com o fluxo financeiro mensal.
            </span>
            <span className="sm:hidden">Sincronizado com o fluxo financeiro.</span>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onClose()
              }}
              className="px-5 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
