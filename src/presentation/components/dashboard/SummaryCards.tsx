import { ArrowDownCircle, ArrowUpCircle, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { formatCurrency } from '../../../core/formatters/currency'
import type { FinanceSummary } from '../../../domain/models/transaction'

interface SummaryCardsProps {
  summary: FinanceSummary
}

export const SummaryCards = ({ summary }: SummaryCardsProps) => {
  const { totalIncome, totalExpense, balance } = summary
  const isPositive = balance >= 0

  return (
    <section aria-label="Resumo Financeiro" className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Card 1: Entradas */}
      <div
        data-testid="card-income"
        className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur shadow-sm transition-all hover:border-emerald-500/40"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Total de Entradas</span>
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <ArrowUpCircle className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {formatCurrency(totalIncome)}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-emerald-400">
          <TrendingUp className="w-4 h-4" aria-hidden="true" />
          <span>Receitas acumuladas</span>
        </div>
      </div>

      {/* Card 2: Saídas */}
      <div
        data-testid="card-expense"
        className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl backdrop-blur shadow-sm transition-all hover:border-rose-500/40"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-400">Total de Saídas</span>
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
            <ArrowDownCircle className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {formatCurrency(totalExpense)}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-rose-400">
          <TrendingDown className="w-4 h-4" aria-hidden="true" />
          <span>Despesas acumuladas</span>
        </div>
      </div>

      {/* Card 3: Saldo Atual */}
      <div
        data-testid="card-balance"
        className={`p-6 rounded-2xl backdrop-blur shadow-sm border transition-all ${
          isPositive
            ? 'bg-emerald-950/20 border-emerald-800/50 hover:border-emerald-500/60'
            : 'bg-rose-950/20 border-rose-800/50 hover:border-rose-500/60'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-300">Saldo Atual</span>
          <div
            className={`p-2 rounded-xl ${
              isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            <DollarSign className="w-6 h-6" aria-hidden="true" />
          </div>
        </div>
        <div
          className={`text-2xl sm:text-3xl font-bold tracking-tight ${
            isPositive ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {formatCurrency(balance)}
        </div>
        <div className="flex items-center gap-1 mt-3 text-xs text-slate-400">
          <span>{isPositive ? 'Conta no azul 🚀' : 'Atenção ao orçamento ⚠️'}</span>
        </div>
      </div>
    </section>
  )
}
