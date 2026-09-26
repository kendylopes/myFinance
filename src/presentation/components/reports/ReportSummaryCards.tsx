import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Percent,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { formatBRL } from '../../../core/formatters/currency'
import type { ReportData } from '../../../domain/services/reportCalculations'

interface ReportSummaryCardsProps {
  report: ReportData
}

export function ReportSummaryCards({ report }: ReportSummaryCardsProps) {
  const { summary, incomeChangePercent, expenseChangePercent, averageDailyExpense } = report

  const isBalancePositive = summary.balance >= 0

  const renderBadge = (percent: number, invertSentiment = false) => {
    if (percent === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 bg-white/5 px-2 py-0.5 rounded-md">
          <Minus className="w-3 h-3" />
          <span>0%</span>
        </span>
      )
    }

    const isPositiveChange = percent > 0
    // Para despesa, percentual positivo (gastar mais) é negativo (ruim)
    const isGood = invertSentiment ? !isPositiveChange : isPositiveChange

    return (
      <span
        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
          isGood
            ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
            : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
        }`}
      >
        {isPositiveChange ? (
          <ArrowUpRight className="w-3 h-3" />
        ) : (
          <ArrowDownRight className="w-3 h-3" />
        )}
        <span>
          {isPositiveChange ? '+' : ''}
          {percent}%
        </span>
      </span>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Receitas Totais */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
            Receitas
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {formatBRL(summary.totalIncome)}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {renderBadge(incomeChangePercent, false)}
            <span className="text-[11px] text-zinc-400">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* 2. Despesas Totais */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
            Despesas
          </span>
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {formatBRL(summary.totalExpense)}
          </h3>
          <div className="flex items-center gap-2 mt-2">
            {renderBadge(expenseChangePercent, true)}
            <span className="text-[11px] text-zinc-400">vs período anterior</span>
          </div>
        </div>
      </div>

      {/* 3. Saldo Líquido do Período */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
            Saldo do Período
          </span>
          <div
            className={`p-2 rounded-xl border ${
              isBalancePositive
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            <Wallet className="w-4 h-4" />
          </div>
        </div>

        <div>
          <h3
            className={`text-2xl font-bold tracking-tight ${
              isBalancePositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatBRL(summary.balance)}
          </h3>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-zinc-400">Status:</span>
            <span
              className={`font-semibold ${
                isBalancePositive ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {isBalancePositive ? 'Superávit Líquido' : 'Déficit no Período'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. Taxa de Poupança & Média Diária */}
      <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-400 tracking-wider uppercase">
            Eficiência
          </span>
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Percent className="w-4 h-4" />
          </div>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {summary.savingsRate || 0}%
            </h3>
            <span className="text-xs text-zinc-400">poupado</span>
          </div>

          <div className="flex items-center gap-1.5 mt-2 text-xs text-zinc-400">
            <span>Média diária:</span>
            <span className="font-semibold text-zinc-200">{formatBRL(averageDailyExpense)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
