import { PieChart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import type { Transaction } from '../../../domain/models/transaction'
import { calculateExpensesByCategory } from '../../../domain/services/financeCalculations'

interface ExpenseCategoryChartProps {
  transactions: Transaction[]
}

export const ExpenseCategoryChart = ({ transactions }: ExpenseCategoryChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  const categoryExpenses = useMemo(() => {
    return calculateExpensesByCategory(transactions)
  }, [transactions])

  const totalExpense = useMemo(() => {
    return categoryExpenses.reduce((acc, curr) => acc + curr.amount, 0)
  }, [categoryExpenses])

  const hoveredSlice = useMemo(() => {
    if (!hoveredCategory) return null
    return categoryExpenses.find((c) => c.category === hoveredCategory) || null
  }, [hoveredCategory, categoryExpenses])

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
          <span className="text-xs text-slate-300 font-medium px-2.5 py-1 rounded-xl glass-pill font-mono">
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
          {/* Gráfico Donut SVG Interativo */}
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

              {/* Fatias das categorias com hover interativo */}
              {chartSlices.map((slice) => {
                const isHovered = hoveredCategory === slice.category

                return (
                  // biome-ignore lint/a11y/noStaticElementInteractions: Arco SVG com hover para tooltip visual; controle semântico acessível é provido pelos botões da legenda
                  <circle
                    key={slice.category}
                    cx="80"
                    cy="80"
                    r={radius}
                    stroke={slice.color}
                    strokeWidth={isHovered ? 23 : 18}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="transition-all duration-300 ease-out cursor-pointer"
                    style={{
                      opacity: hoveredCategory ? (isHovered ? 1 : 0.45) : 1,
                      filter: isHovered
                        ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.35))'
                        : undefined,
                    }}
                  />
                )
              })}
            </svg>

            {/* Tooltip central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 transition-all">
              {hoveredSlice ? (
                <>
                  <span className="text-2xs sm:text-xs font-semibold text-emerald-400 truncate max-w-full">
                    {hoveredSlice.category}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white font-mono tracking-tight truncate max-w-full">
                    {formatCurrency(hoveredSlice.amount)}
                  </span>
                  <span className="text-3xs font-mono text-zinc-400">
                    {hoveredSlice.percentage}% do total
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xs sm:text-xs font-medium text-slate-400">
                    Total Gasto
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white tracking-tight truncate max-w-full font-mono">
                    {formatCurrency(totalExpense)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legenda & Barras de Progresso */}
          <div className="w-full min-w-0 flex-1 space-y-2.5">
            {categoryExpenses.map((item) => {
              const isHovered = hoveredCategory === item.category

              return (
                <button
                  type="button"
                  key={item.category}
                  className={`w-full text-left space-y-1.5 min-w-0 p-1.5 -mx-1.5 rounded-xl transition-all cursor-pointer ${
                    isHovered ? 'bg-white/8 shadow-xs ring-1 ring-white/10' : 'hover:bg-white/4'
                  }`}
                  data-testid={`cat-row-${item.category}`}
                  onMouseEnter={() => setHoveredCategory(item.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() =>
                    setHoveredCategory((prev) => (prev === item.category ? null : item.category))
                  }
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
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-800/80 text-slate-400 font-mono text-2xs shrink-0 border border-white/5">
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
                        filter: isHovered ? 'brightness(1.2)' : undefined,
                      }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
