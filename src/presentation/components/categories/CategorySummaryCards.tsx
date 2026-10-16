import { Flame, FolderTree, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import type { Transaction } from '../../../domain/models/transaction'

export interface CategorySummaryCardsProps {
  transactions: Transaction[]
}

export function CategorySummaryCards({ transactions }: CategorySummaryCardsProps) {
  const { formatValue } = useCurrency()

  const summary = useMemo(() => {
    let totalExpense = 0
    let totalIncome = 0
    const expenseCategoryMap: Record<string, number> = {}
    const activeCategories = new Set<string>()

    for (const tx of transactions) {
      if (tx.category) {
        activeCategories.add(tx.category)
      }

      if (tx.type === 'expense') {
        totalExpense += tx.amount
        expenseCategoryMap[tx.category] = (expenseCategoryMap[tx.category] || 0) + tx.amount
      } else if (tx.type === 'income') {
        totalIncome += tx.amount
      }
    }

    let topCategory = 'Nenhuma'
    let topCategoryAmount = 0

    for (const [cat, amt] of Object.entries(expenseCategoryMap)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt
        topCategory = cat
      }
    }

    const topCategoryPercent = totalExpense > 0 ? (topCategoryAmount / totalExpense) * 100 : 0

    return {
      totalExpense,
      totalIncome,
      topCategory,
      topCategoryAmount,
      topCategoryPercent,
      activeCategoriesCount: activeCategories.size,
    }
  }, [transactions])

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total em Despesas */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Total em Despesas
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-rose-300 font-mono tracking-tight">
          {formatValue(summary.totalExpense)}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          Saídas categorizadas do mês
        </p>
      </div>

      {/* 2. Total em Receitas */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Total em Receitas
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
          {formatValue(summary.totalIncome)}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          Entradas categorizadas do mês
        </p>
      </div>

      {/* 3. Maior Categoria de Gastos */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 truncate">
            Maior Gasto
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight truncate">
          {summary.topCategory}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          {summary.topCategoryAmount > 0
            ? `${formatValue(summary.topCategoryAmount)} (${summary.topCategoryPercent.toFixed(1)}% do total)`
            : 'Sem lançamentos no período'}
        </p>
      </div>

      {/* 4. Categorias Ativas */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Categorias Ativas
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <FolderTree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
          {summary.activeCategoriesCount}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          Com movimentação neste mês
        </p>
      </div>
    </div>
  )
}
