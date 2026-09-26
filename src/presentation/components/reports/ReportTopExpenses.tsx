import { Flame } from 'lucide-react'
import { formatBRL } from '../../../core/formatters/currency'
import { formatDate } from '../../../core/formatters/date'
import { getCategoryIcon } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'

interface ReportTopExpensesProps {
  expenses: Transaction[]
  totalExpense: number
}

export function ReportTopExpenses({ expenses, totalExpense }: ReportTopExpensesProps) {
  if (expenses.length === 0) {
    return (
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 text-center py-10 text-zinc-400">
        <p className="text-sm">Nenhuma despesa registrada neste período.</p>
      </div>
    )
  }

  return (
    <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-rose-400" />
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
            Maiores Despesas do Período
          </h3>
        </div>
        <span className="text-xs text-zinc-400">Top {expenses.length} gastos</span>
      </div>

      <div className="space-y-3">
        {expenses.map((tx, index) => {
          const CategoryIcon = getCategoryIcon(tx.category)
          const percentOfTotal =
            totalExpense > 0 ? Math.round(((Number(tx.amount) || 0) / totalExpense) * 100) : 0

          return (
            <div
              key={tx.id}
              className="p-3.5 rounded-2xl glass-pill border border-white/5 hover:border-white/15 transition-all space-y-2"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-white/5 text-zinc-400 text-xs font-bold shrink-0">
                    #{index + 1}
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                    <CategoryIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-white truncate">{tx.title}</h4>
                    <p className="text-xs text-zinc-400">
                      {tx.category} • {formatDate(tx.date)}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-rose-400">{formatBRL(tx.amount)}</p>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    {percentOfTotal}% do total
                  </p>
                </div>
              </div>

              {/* Barra de Proporção Visual */}
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(2, percentOfTotal))}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
