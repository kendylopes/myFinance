import { PieChart } from 'lucide-react'
import { useMemo } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import type { Transaction } from '../../../domain/models/transaction'
import { calculateExpensesByCategory } from '../../../domain/services/financeCalculations'

interface ExpenseCategoryChartProps {
  transactions: Transaction[]
}

export const ExpenseCategoryChart = ({ transactions }: ExpenseCategoryChartProps) => {
  const categoryExpenses = useMemo(() => {
    return calculateExpensesByCategory(transactions)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return categoryExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  }, [categoryExpenses])

  // Configuração geométrica do Donut SVG
  const radius = 60
  const circumference = 2 * Math.PI * radius

  // Pré-calcula os offsets das fatias circulares
  let accumulatedPercent = 0
  const chartSlices = categoryExpenses.map((cat) => {
    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`
    const strokeDashoffset = -((accumulatedPercent / 100) * circumference)
    accumulatedPercent += cat.percentage
    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
    }
  })

  return (
    <section
      aria-labelledby="chart-title"
      data-testid="expense-category-chart"
      className="glass-card p-5 sm:p-6 rounded-3xl space-y-6 @container"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <PieChart className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 id="chart-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
            Despesas por Categorias
          </h2>
        </div>
        {categoryExpenses.length > 0 && (
          <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-xl glass-pill">
            Total: {formatCurrency(totalExpense)}
          </span>
        )}
      </div>

      {categoryExpenses.length === 0 ? (
        <div
          data-testid="chart-empty-state"
          className="text-center py-10 text-slate-400 border border-dashed border-white/10 rounded-2xl glass-pill"
        >
          <PieChart
            className="w-10 h-10 mx-auto mb-2 text-slate-500 opacity-60"
            aria-hidden="true"
          />
          <p className="font-medium text-sm text-slate-300">
            Sem despesas registradas neste período
          </p>
          <p className="text-xs text-slate-400 mt-1">
            As despesas adicionadas aparecerão aqui divididas por categoria.
          </p>
        </div>
      ) : (
        <div className="flex flex-col @md:flex-row items-center gap-6">
          {/* Gráfico Donut SVG */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full -rotate-90 transform"
              viewBox="0 0 160 160"
              role="img"
              aria-label="Gráfico de pizza de despesas por categoria"
            >
              {/* Trilha base de fundo */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-slate-800/60"
                strokeWidth="18"
                fill="transparent"
              />

              {/* Fatias das categorias */}
              {chartSlices.map((slice) => (
                <circle
                  key={slice.category}
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={slice.color}
                  strokeWidth="18"
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out hover:opacity-80"
                />
              ))}
            </svg>

            {/* Texto central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span className="text-[11px] sm:text-xs font-medium text-slate-400">Total Gasto</span>
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-full">
                {formatCurrency(totalExpense)}
              </span>
            </div>
          </div>

          {/* Legenda & Barras de Progresso */}
          <div className="w-full min-w-0 flex-1 space-y-3">
            {categoryExpenses.map((item) => (
              <div
                key={item.category}
                className="space-y-1.5 min-w-0"
                data-testid={`cat-row-${item.category}`}
              >
                <div className="flex items-center justify-between text-xs gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: item.color }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-200 truncate" title={item.category}>
                      {item.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                    <span className="font-bold text-slate-300 font-mono whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-mono text-[10px] shrink-0 border border-white/5">
                      {item.percentage}%
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso Proporcional */}
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/60">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
