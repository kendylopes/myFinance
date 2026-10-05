import { Calendar, CheckCircle2, Clock, CreditCard, Plus, TrendingDown, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
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

  // Calcula projeção mensal para os próximos 12 meses
  const monthlyForecasts = useMemo(() => {
    return getMonthlyInstallmentForecast(transactions, 12)
  }, [transactions])

  // Total geral ainda a pagar em parcelas futuras
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

  // Maior valor mensal para calcular a altura das barras no gráfico
  const maxForecastAmount = useMemo(() => {
    return Math.max(...monthlyForecasts.map((f) => f.totalAmount), 100)
  }, [monthlyForecasts])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl border border-white/10 glass-card p-6 shadow-2xl relative"
        style={{
          boxShadow: `0 20px 50px -10px ${currentTheme.primaryColor}20`,
        }}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border"
              style={{
                backgroundColor: `${currentTheme.primaryColor}15`,
                borderColor: `${currentTheme.primaryColor}30`,
                color: currentTheme.primaryColor,
              }}
            >
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Faturas & Compras Parceladas
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Projeção do comprometimento do seu cartão de crédito nos próximos meses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onOpenNewInstallment()
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-black shadow-md cursor-pointer hover:scale-105 transition-all"
              style={{ backgroundColor: currentTheme.primaryColor }}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nova Compra</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onClose()
              }}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cards de Resumo Superior */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Futuro Comprometido
            </span>
            <span className="text-lg font-black text-rose-300 font-mono mt-0.5 block">
              {formatValue(totalPendingAmount)}
            </span>
            <span className="text-[10px] text-zinc-500">Parcelas ainda a vencer no cartão</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Compras Parceladas Ativas
            </span>
            <span className="text-lg font-black text-white font-mono mt-0.5 block">
              {activePurchasesCount}
            </span>
            <span className="text-[10px] text-zinc-500">
              {installmentGroups.length} no histórico total
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Fatura Mês Atual
            </span>
            <span className="text-lg font-black text-amber-300 font-mono mt-0.5 block">
              {formatValue(monthlyForecasts[0]?.totalAmount || 0)}
            </span>
            <span className="text-[10px] text-zinc-500">
              {monthlyForecasts[0]?.itemsCount || 0} parcelas neste mês
            </span>
          </div>
        </div>

        {/* Seletor de Aba: Linha do Tempo vs Compras */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('timeline')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'timeline'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Projeção Mês a Mês (12 Meses)
          </button>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('purchases')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'purchases'
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                : 'border-transparent text-zinc-400 hover:text-white'
            }`}
          >
            Lista de Compras ({installmentGroups.length})
          </button>
        </div>

        {/* Conteúdo das Abas */}
        <div className="flex-1 overflow-y-auto mt-4 pr-1 space-y-4">
          {activeTab === 'timeline' ? (
            <div className="space-y-4">
              {/* Gráfico Visual de Barras com as Faturas Futuras */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-xs font-semibold text-zinc-300 block">
                  Curva de Comprometimento das Faturas:
                </span>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 items-end h-28 pt-4 pb-1">
                  {monthlyForecasts.map((m) => {
                    const heightPercent =
                      maxForecastAmount > 0
                        ? Math.max(10, Math.round((m.totalAmount / maxForecastAmount) * 100))
                        : 10
                    const hasAmount = m.totalAmount > 0

                    return (
                      <div
                        key={m.yearMonth}
                        className="flex flex-col items-center gap-1.5 group h-full justify-end"
                        title={`${m.monthLabel}: ${formatValue(m.totalAmount)} (${m.itemsCount} parcelas)`}
                      >
                        <div
                          className={`w-full rounded-lg transition-all duration-300 relative group-hover:scale-105 ${
                            hasAmount
                              ? 'bg-gradient-to-t from-rose-500/40 to-amber-500/60 border border-amber-500/30'
                              : 'bg-white/5 border border-white/5'
                          }`}
                          style={{ height: `${hasAmount ? heightPercent : 6}%` }}
                        />
                        <span className="text-[10px] font-mono text-zinc-400 truncate max-w-full">
                          {m.monthLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Lista Detalhada de Cada Mês Futuro */}
              <div className="space-y-2.5">
                {monthlyForecasts
                  .filter((m) => m.totalAmount > 0)
                  .map((m) => (
                    <div
                      key={m.yearMonth}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span className="text-sm font-bold text-white">{m.monthLabel}</span>
                          <span className="text-[11px] text-zinc-400">
                            ({m.itemsCount} {m.itemsCount === 1 ? 'parcela' : 'parcelas'})
                          </span>
                        </div>
                        <span className="text-sm font-black text-rose-300 font-mono">
                          {formatValue(m.totalAmount)}
                        </span>
                      </div>

                      {/* Itens do Mês */}
                      <div className="divide-y divide-white/5 pt-1">
                        {m.purchases.map((p, idx) => (
                          <div
                            // biome-ignore lint/suspicious/noArrayIndexKey: Lista renderizada estática sem reordenação
                            key={`${p.title}-${idx}`}
                            className="py-1.5 flex items-center justify-between text-xs text-zinc-300"
                          >
                            <div className="flex items-center gap-1.5 truncate pr-2">
                              <span className="truncate">{p.title}</span>
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                {p.installment}
                              </span>
                            </div>
                            <span className="font-mono text-zinc-200 font-semibold shrink-0">
                              {formatValue(p.amount)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                {monthlyForecasts.every((m) => m.totalAmount === 0) && (
                  <div className="text-center py-10 text-zinc-500 space-y-1">
                    <TrendingDown className="w-8 h-8 mx-auto opacity-40 mb-2" />
                    <p className="text-sm">
                      Você não possui parcelas futuras no cartão de crédito.
                    </p>
                    <p className="text-xs">
                      Suas próximas faturas estão completamente livres de compromissos!
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Lista de Compras Parceladas */
            <div className="space-y-3">
              {installmentGroups.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Clock className="w-8 h-8 mx-auto opacity-40 mb-2" />
                  <p className="text-sm">Nenhuma compra parcelada registrada até o momento.</p>
                </div>
              ) : (
                installmentGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      group.isCompleted
                        ? 'border-white/5 bg-white/[0.01] opacity-75'
                        : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{group.title}</h4>
                          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300">
                            {group.category}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          {group.totalInstallments}x de aprox.{' '}
                          <strong className="text-zinc-200 font-mono">
                            {formatValue(group.installmentAmount)}
                          </strong>{' '}
                          • Total:{' '}
                          <strong className="font-mono">{formatValue(group.totalAmount)}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        {group.isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Paga
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-300 font-semibold font-mono">
                            {group.paidCount} de {group.totalInstallments} pagas
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="space-y-1">
                      <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                          style={{ width: `${group.progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-zinc-400">
                        <span>{group.progressPercent}% concluído</span>
                        {group.nextDueDate && !group.isCompleted && (
                          <span>
                            Próxima parcela em:{' '}
                            <strong className="text-white">
                              {group.nextDueDate.split('-').reverse().join('/')}
                            </strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-3 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400 hidden sm:inline">
            Compras parceladas impactam automaticamente as métricas de cada mês futuro.
          </span>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onClose()
            }}
            className="px-5 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer ml-auto"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
