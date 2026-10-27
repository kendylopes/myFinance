import { PieChart } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import type { Transaction } from '../../../domain/models/transaction'
import { calculateExpensesByCategory } from '../../../domain/services/financeCalculations'
import { useSpotlight } from '../../hooks/useSpotlight'

interface ExpenseCategoryChartProps {
  transactions: Transaction[]
}

export const ExpenseCategoryChart = ({ transactions }: ExpenseCategoryChartProps) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)
  const spotlightRef = useSpotlight<HTMLElement>()

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
      ref={spotlightRef}
      aria-labelledby="chart-title"
      data-testid="expense-category-chart"
      className="glass-card spotlight-card p-6 sm:p-7 rounded-3xl space-y-6 @container border border-white/10 shadow-xl bg-linear-to-b from-white/4 to-transparent relative overflow-hidden"
    >
      {/* Cabeçalho */}
      <div className="flex items-center justify-between border-b border-white/8 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-xs">
            <PieChart className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="chart-title"
              className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm"
            >
              Despesas por Categorias
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">Distribuição proporcional do orçamento</p>
          </div>
        </div>
        {categoryExpenses.length > 0 && (
          <span className="text-xs text-emerald-300 font-bold px-3 py-1.5 rounded-2xl glass-pill font-mono border border-emerald-500/30 bg-emerald-500/10 shadow-xs">
            Total: {formatCurrency(totalExpense)}
          </span>
        )}
      </div>

      {categoryExpenses.length === 0 ? (
        <div
          data-testid="chart-empty-state"
          className="text-center py-14 text-zinc-400 border border-dashed border-white/10 rounded-3xl glass-pill space-y-2.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto text-zinc-500">
            <PieChart className="w-6 h-6 opacity-75" aria-hidden="true" />
          </div>
          <p className="font-semibold text-sm text-zinc-200">
            Sem despesas registradas neste período
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            As despesas adicionadas aparecerão aqui divididas por categoria com cálculo automático
            de porcentagem.
          </p>
        </div>
      ) : (
        <div className="flex flex-col @md:flex-row items-center gap-6 sm:gap-8">
          {/* Gráfico Donut SVG Interativo */}
          <div className="relative w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center shrink-0">
            <svg
              className="w-full h-full -rotate-90 transform drop-shadow-md"
              viewBox="0 0 160 160"
              role="img"
              aria-label="Gráfico de pizza de despesas por categoria"
            >
              {/* Trilha base de fundo com acabamento suave */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/8"
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
                    strokeWidth={isHovered ? 24 : 18}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    onMouseEnter={() => setHoveredCategory(slice.category)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="transition-all duration-300 ease-out cursor-pointer"
                    style={{
                      opacity: hoveredCategory ? (isHovered ? 1 : 0.4) : 1,
                      filter: isHovered ? `drop-shadow(0 0 8px ${slice.color}80)` : undefined,
                    }}
                  />
                )
              })}
            </svg>

            {/* Tooltip central do Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 transition-all">
              {hoveredSlice ? (
                <>
                  <span className="text-2xs sm:text-xs font-bold text-emerald-400 truncate max-w-full">
                    {hoveredSlice.category}
                  </span>
                  <span className="text-xs sm:text-base font-black text-white font-mono tracking-tight truncate max-w-full">
                    {formatCurrency(hoveredSlice.amount)}
                  </span>
                  <span className="text-3xs font-mono font-semibold text-zinc-400 uppercase tracking-wider mt-0.5">
                    {hoveredSlice.percentage}% do total
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xs sm:text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Total Gasto
                  </span>
                  <span className="text-xs sm:text-base font-bold text-white tracking-tight truncate max-w-full font-mono">
                    {formatCurrency(totalExpense)}
                  </span>
                  <span className="text-3xs text-zinc-500 font-medium">
                    {categoryExpenses.length}{' '}
                    {categoryExpenses.length === 1 ? 'categoria' : 'categorias'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Legenda & Barras de Progresso */}
          <div className="w-full min-w-0 flex-1 space-y-2">
            {categoryExpenses.map((item) => {
              const isHovered = hoveredCategory === item.category

              return (
                <button
                  type="button"
                  key={item.category}
                  className={`w-full text-left space-y-1.5 min-w-0 p-2 rounded-2xl transition-all duration-200 cursor-pointer ${
                    isHovered ? 'bg-white/8 shadow-sm ring-1 ring-white/15' : 'hover:bg-white/4'
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
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs transition-transform duration-200"
                        style={{
                          backgroundColor: item.color,
                          boxShadow: isHovered ? `0 0 8px ${item.color}` : undefined,
                          transform: isHovered ? 'scale(1.25)' : 'scale(1)',
                        }}
                        aria-hidden="true"
                      />
                      <span className="font-semibold text-zinc-200 truncate" title={item.category}>
                        {item.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-1.5">
                      <span className="font-bold text-zinc-300 font-mono tabular-nums whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/6 text-zinc-300 font-mono font-semibold text-2xs shrink-0 border border-white/8">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Proporcional */}
                  <div className="w-full h-1.5 bg-white/8 rounded-full overflow-hidden">
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
