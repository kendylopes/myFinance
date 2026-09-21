import { ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import type { FinanceSummary } from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'
import { AnimatedCurrency } from '../common/AnimatedCurrency'
import { BalanceSparkline } from './BalanceSparkline'

interface SummaryCardsProps {
  summary: FinanceSummary
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const { totalIncome, totalExpense, balance } = summary
  const isPositive = balance >= 0

  const incomeRef = useSpotlight<HTMLDivElement>()
  const expenseRef = useSpotlight<HTMLDivElement>()
  const balanceRef = useSpotlight<HTMLDivElement>()

  // Pontos de visualização de tendência para o Sparkline
  const sparklinePoints = isPositive
    ? [Math.max(0, balance * 0.4), balance * 0.65, balance * 0.5, balance * 0.85, balance]
    : [0, balance * 0.3, balance * 0.6, balance * 0.4, balance]

  return (
    <section aria-label="Resumo Financeiro" className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Card 1: Entradas */}
      <div
        ref={incomeRef}
        data-testid="card-income"
        className="glass-card glass-card-interactive spotlight-card p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40"
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-300"
        />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-medium text-zinc-400">Total de Entradas</span>
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 shadow-sm">
            <ArrowUpCircle className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative z-10">
          <AnimatedCurrency value={totalIncome} />
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-emerald-400 relative z-10">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          <span>Receitas acumuladas</span>
        </div>
      </div>

      {/* Card 2: Saídas */}
      <div
        ref={expenseRef}
        data-testid="card-expense"
        className="glass-card glass-card-interactive spotlight-card p-6 rounded-3xl relative overflow-hidden group hover:border-rose-500/40"
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-rose-500/20 transition-all duration-300"
        />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-medium text-zinc-400">Total de Saídas</span>
          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 shadow-sm">
            <ArrowDownCircle className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight relative z-10">
          <AnimatedCurrency value={totalExpense} />
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-xs text-rose-400 relative z-10">
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
          <span>Despesas acumuladas</span>
        </div>
      </div>

      {/* Card 3: Saldo Atual */}
      <div
        ref={balanceRef}
        data-testid="card-balance"
        className={`glass-card glass-card-interactive spotlight-card p-6 rounded-3xl relative overflow-hidden group ${
          isPositive ? 'hover:border-emerald-500/50' : 'hover:border-rose-500/50'
        }`}
      >
        <div
          aria-hidden="true"
          className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        />
        <div
          aria-hidden="true"
          className={`absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all duration-300 ${
            isPositive
              ? 'bg-emerald-500/15 group-hover:bg-emerald-500/25'
              : 'bg-rose-500/15 group-hover:bg-rose-500/25'
          }`}
        />
        <div className="flex items-center justify-between mb-4 relative z-10">
          <span className="text-sm font-medium text-zinc-300">Saldo Atual</span>
          <div
            className={`p-2.5 rounded-2xl border shadow-sm ${
              isPositive
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}
          >
            <DollarSign className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight relative z-10 ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          <AnimatedCurrency value={balance} />
        </div>
        <div className="flex items-center justify-between mt-3 relative z-10">
          <span className="text-xs text-zinc-400">
            {isPositive ? 'Conta no azul 🚀' : 'Atenção ao orçamento ⚠️'}
          </span>
          <div className="w-24 h-7">
            <BalanceSparkline
              points={sparklinePoints}
              strokeColor={isPositive ? '#10b981' : '#f43f5e'}
              gradientId="summary-balance-sparkline"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
