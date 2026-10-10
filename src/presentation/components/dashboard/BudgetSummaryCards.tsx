import { AlertTriangle, CalendarDays, ShieldCheck, Target, TrendingDown } from 'lucide-react'
import { useCurrency } from '../../../core/currency/currencyContext'
import type { BudgetProgress } from '../../../domain/models/transaction'

export interface BudgetSummaryCardsProps {
  progress: BudgetProgress
  selectedMonth?: string // formato YYYY-MM
}

export function BudgetSummaryCards({ progress, selectedMonth }: BudgetSummaryCardsProps) {
  const { formatValue } = useCurrency()
  const { budgetAmount, totalExpense, remainingAmount, spentPercentage, status } = progress

  // Cálculo dos dias restantes no mês para sugerir limite diário seguro
  const today = new Date()
  const [yearStr, monthStr] = (selectedMonth || '').split('-')
  const targetYear = yearStr ? Number.parseInt(yearStr, 10) : today.getFullYear()
  const targetMonthIndex = monthStr ? Number.parseInt(monthStr, 10) - 1 : today.getMonth()

  const daysInMonth = new Date(targetYear, targetMonthIndex + 1, 0).getDate()
  const isCurrentMonth = targetYear === today.getFullYear() && targetMonthIndex === today.getMonth()

  const remainingDays = isCurrentMonth
    ? Math.max(1, daysInMonth - today.getDate() + 1)
    : daysInMonth

  const isExceeded = status === 'exceeded' || remainingAmount < 0
  const dailyBudget = !isExceeded && remainingAmount > 0 ? remainingAmount / remainingDays : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Teto Mensal Definido */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Teto Mensal
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-cyan-300 font-mono tracking-tight">
          {formatValue(budgetAmount)}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">Meta de gastos definida</p>
      </div>

      {/* 2. Total Gasto no Mês */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Total Gasto
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
            <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-rose-300 font-mono tracking-tight">
          {formatValue(totalExpense)}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          {spentPercentage.toFixed(1)}% do teto consumido
        </p>
      </div>

      {/* 3. Margem Disponível ou Excesso */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span
            className={`text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate ${
              isExceeded ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {isExceeded ? 'Teto Excedido' : 'Margem Livre'}
          </span>
          <div
            className={`p-1.5 sm:p-2 rounded-xl ${
              isExceeded ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'
            }`}
          >
            {isExceeded ? (
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            )}
          </div>
        </div>
        <div
          className={`text-lg sm:text-2xl font-black font-mono tracking-tight ${
            isExceeded ? 'text-rose-400' : 'text-emerald-300'
          }`}
        >
          {formatValue(Math.abs(remainingAmount))}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          {isExceeded ? 'Gastos além da meta estipulada' : 'Saldo restante para não estourar'}
        </p>
      </div>

      {/* 4. Ritmo Diário Seguro */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
        <div className="flex items-center justify-between text-zinc-400">
          <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
            Meta Diária Segura
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-400">
            <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
          {formatValue(dailyBudget)}
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 truncate">
          {isExceeded
            ? 'Orçamento já ultrapassado'
            : `Média/dia para ${remainingDays} dia(s) restante(s)`}
        </p>
      </div>
    </div>
  )
}
