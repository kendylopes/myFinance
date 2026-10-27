import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Eye,
  EyeOff,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { soundFX } from '../../../core/sound/soundEffects'
import type { FinanceSummary } from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'
import { AnimatedCurrency } from '../common/AnimatedCurrency'
import { BalanceSparkline } from './BalanceSparkline'

interface SummaryCardsProps {
  summary: FinanceSummary
  onSelectType?: (type: 'income' | 'expense') => void
}

export const SummaryCards = ({ summary, onSelectType }: SummaryCardsProps) => {
  const {
    totalIncome,
    totalExpense,
    balance,
    paidIncome,
    pendingIncome,
    paidExpense,
    pendingExpense,
    liquidBalance,
  } = summary
  const isPositive = balance >= 0

  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('@myFinance:dashboard:privacy') === 'true'
    } catch {
      return false
    }
  })

  const togglePrivacy = () => {
    soundFX.playClick()
    setIsPrivacyMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem('@myFinance:dashboard:privacy', String(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const incomeRef = useSpotlight<HTMLButtonElement>()
  const expenseRef = useSpotlight<HTMLButtonElement>()
  const balanceRef = useSpotlight<HTMLDivElement>()

  // Pontos de tendência para o Sparkline exclusivo de Saldo
  const balanceSparklinePoints = isPositive
    ? [Math.max(0, balance * 0.35), balance * 0.65, balance * 0.48, balance * 0.82, balance]
    : [0, balance * 0.35, balance * 0.65, balance * 0.45, balance]

  const incomeRealizedPercent =
    totalIncome > 0 ? Math.min(100, Math.round(((paidIncome || 0) / totalIncome) * 100)) : 100
  const expenseRealizedPercent =
    totalExpense > 0 ? Math.min(100, Math.round(((paidExpense || 0) / totalExpense) * 100)) : 100

  return (
    <section
      aria-label="Resumo Financeiro"
      className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
    >
      {/* Card 1: Saldo Atual (Primeiro) */}
      <div
        ref={balanceRef}
        data-testid="card-balance"
        className={`glass-card spotlight-card p-5 sm:p-6 rounded-3xl relative overflow-hidden group transition-all duration-300 border ${
          isPositive
            ? 'border-white/10 bg-linear-to-b from-white/4 to-transparent hover:border-emerald-500/30 shadow-lg'
            : 'border-rose-500/20 bg-linear-to-b from-rose-950/15 to-transparent hover:border-rose-500/40 shadow-lg'
        }`}
      >
        {/* Glow Superior Suave */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />

        {/* Cabeçalho do Card */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-300">
              Saldo Atual
            </span>
            <button
              type="button"
              onClick={togglePrivacy}
              aria-label={isPrivacyMode ? 'Mostrar saldo' : 'Ocultar saldo'}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title={isPrivacyMode ? 'Mostrar saldo' : 'Ocultar saldo'}
            >
              {isPrivacyMode ? (
                <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <div
            className={`p-2.5 rounded-2xl border transition-all duration-300 shadow-xs ${
              isPositive
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          >
            <Wallet className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
        </div>

        {/* Valor do Saldo */}
        <div
          className={`text-2xl sm:text-3xl lg:text-3.5xl font-extrabold font-mono tabular-nums tracking-tight relative z-10 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isPrivacyMode ? (
            <span className="font-mono tracking-widest text-zinc-400 select-none">••••••••</span>
          ) : (
            <AnimatedCurrency value={balance} />
          )}
        </div>

        {/* Rodapé do Card com Sparkline refinado */}
        <div className="flex items-center justify-between mt-4 pt-1 relative z-10 gap-3">
          <div className="space-y-1 min-w-0">
            <span
              className={`glass-pill px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border shadow-2xs whitespace-nowrap ${
                isPositive
                  ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-300 animate-pulse'
              }`}
            >
              {isPositive ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Conta no azul</span>
                </>
              ) : (
                <span>Atenção ao orçamento ⚠️</span>
              )}
            </span>
            {liquidBalance !== undefined && liquidBalance !== balance && !isPrivacyMode && (
              <span className="text-2xs text-zinc-400 block font-mono tabular-nums truncate">
                Realizado: {formatCurrency(liquidBalance)}
              </span>
            )}
          </div>
          <div className="w-24 sm:w-28 h-7 shrink-0">
            <BalanceSparkline
              points={balanceSparklinePoints}
              strokeColor={isPositive ? '#10b981' : '#f43f5e'}
              gradientId="summary-balance-sparkline"
            />
          </div>
        </div>
      </div>

      {/* Card 2: Total de Entradas (Segundo) */}
      <button
        type="button"
        ref={incomeRef}
        data-testid="card-income"
        disabled={!onSelectType}
        onClick={() => {
          if (onSelectType) {
            soundFX.playClick()
            onSelectType('income')
          }
        }}
        title={onSelectType ? 'Clique para ver todas as entradas' : undefined}
        className={`glass-card spotlight-card p-5 sm:p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-linear-to-b from-white/4 to-transparent hover:border-emerald-500/30 text-left w-full transition-all duration-300 shadow-lg ${
          onSelectType ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
        }`}
      >
        {/* Glow Superior Suave */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-300">
            Total de Entradas
          </span>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-xs">
            <ArrowUpRight className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl lg:text-3.5xl font-extrabold font-mono tabular-nums text-white tracking-tight relative z-10">
          {isPrivacyMode ? (
            <span className="font-mono tracking-widest text-zinc-400 select-none">••••••••</span>
          ) : (
            <AnimatedCurrency value={totalIncome} />
          )}
        </div>

        {/* Rodapé com detalhes de realização limpo e sem poluição */}
        <div className="mt-4 pt-1 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {isPrivacyMode ? 'Recebido: ••••' : `Recebido: ${formatCurrency(paidIncome || 0)}`}
              </span>
            </div>
            {(pendingIncome ?? 0) > 0 && !isPrivacyMode && (
              <span className="text-2xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md font-medium shrink-0">
                +{formatCurrency(pendingIncome || 0)}
              </span>
            )}
          </div>
          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
              style={{ width: `${incomeRealizedPercent}%` }}
            />
          </div>
        </div>
      </button>

      {/* Card 3: Total de Saídas (Terceiro) */}
      <button
        type="button"
        ref={expenseRef}
        data-testid="card-expense"
        disabled={!onSelectType}
        onClick={() => {
          if (onSelectType) {
            soundFX.playClick()
            onSelectType('expense')
          }
        }}
        title={onSelectType ? 'Clique para ver todas as saídas' : undefined}
        className={`glass-card spotlight-card p-5 sm:p-6 rounded-3xl relative overflow-hidden group border border-white/10 bg-linear-to-b from-white/4 to-transparent hover:border-rose-500/30 text-left w-full transition-all duration-300 shadow-lg ${
          onSelectType ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99]' : ''
        }`}
      >
        {/* Glow Superior Suave */}
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />

        <div className="flex items-center justify-between mb-3 relative z-10">
          <span className="text-xs sm:text-sm font-semibold tracking-wide text-zinc-300">
            Total de Saídas
          </span>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shadow-xs">
            <ArrowDownRight className="w-4.5 h-4.5" aria-hidden="true" />
          </div>
        </div>

        <div className="text-2xl sm:text-3xl lg:text-3.5xl font-extrabold font-mono tabular-nums text-white tracking-tight relative z-10">
          {isPrivacyMode ? (
            <span className="font-mono tracking-widest text-zinc-400 select-none">••••••••</span>
          ) : (
            <AnimatedCurrency value={totalExpense} />
          )}
        </div>

        {/* Rodapé com detalhes de realização limpo e sem poluição */}
        <div className="mt-4 pt-1 relative z-10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums">
            <div className="flex items-center gap-1.5 text-rose-400">
              <TrendingDown className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {isPrivacyMode ? 'Pago: ••••' : `Pago: ${formatCurrency(paidExpense || 0)}`}
              </span>
            </div>
            {(pendingExpense ?? 0) > 0 && !isPrivacyMode && (
              <span className="inline-flex items-center gap-1 text-2xs text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md font-medium shrink-0">
                <Clock className="w-2.5 h-2.5" />
                <span>A pagar: {formatCurrency(pendingExpense || 0)}</span>
              </span>
            )}
          </div>
          <div className="w-full h-1 bg-white/8 rounded-full overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-rose-500 to-amber-500 rounded-full transition-all duration-1000"
              style={{ width: `${expenseRealizedPercent}%` }}
            />
          </div>
        </div>
      </button>
    </section>
  )
}
