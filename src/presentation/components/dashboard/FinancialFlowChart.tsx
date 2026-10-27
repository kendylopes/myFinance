import { ArrowDownRight, ArrowUpRight, BarChart3, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { getAdjacentMonth, getCurrentYearMonth } from '../../../core/formatters/date'
import type { Transaction } from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'

interface FinancialFlowChartProps {
  transactions: Transaction[]
  selectedMonth?: string
}

interface MonthFlowData {
  key: string
  label: string
  year: number
  income: number
  expense: number
  balance: number
  isCurrentPeriod: boolean
}

export const FinancialFlowChart = ({ transactions, selectedMonth }: FinancialFlowChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const spotlightRef = useSpotlight<HTMLElement>()

  // Determina os 6 meses a serem comparados
  const flowData: MonthFlowData[] = useMemo(() => {
    const baseMonth =
      selectedMonth && selectedMonth !== 'all' ? selectedMonth : getCurrentYearMonth()

    const list: MonthFlowData[] = []

    for (let i = 5; i >= 0; i--) {
      const monthKey = getAdjacentMonth(baseMonth, -i)
      const [yearNum, monthNum] = monthKey.split('-').map(Number)
      const dateObj = new Date(yearNum, monthNum - 1, 1)
      const label = dateObj
        .toLocaleDateString('pt-BR', { month: 'short' })
        .replace('.', '')
        .toUpperCase()

      const monthTxs = transactions.filter((tx) => tx.date.startsWith(monthKey))
      const income = monthTxs
        .filter((tx) => tx.type === 'income')
        .reduce((acc, curr) => acc + curr.amount, 0)
      const expense = monthTxs
        .filter((tx) => tx.type === 'expense')
        .reduce((acc, curr) => acc + curr.amount, 0)

      list.push({
        key: monthKey,
        label,
        year: yearNum,
        income,
        expense,
        balance: income - expense,
        isCurrentPeriod: monthKey === baseMonth,
      })
    }

    return list
  }, [transactions, selectedMonth])

  // Identifica o valor máximo para escala vertical proporcional
  const maxVal = useMemo(() => {
    let highest = 0
    for (const item of flowData) {
      if (item.income > highest) highest = item.income
      if (item.expense > highest) highest = item.expense
    }
    return Math.max(highest, 100) * 1.15 // 15% de margem no topo
  }, [flowData])

  const totalPeriodIncome = useMemo(
    () => flowData.reduce((acc, curr) => acc + curr.income, 0),
    [flowData],
  )
  const totalPeriodExpense = useMemo(
    () => flowData.reduce((acc, curr) => acc + curr.expense, 0),
    [flowData],
  )
  const hasAnyData = totalPeriodIncome > 0 || totalPeriodExpense > 0

  // Configurações do Grid SVG
  const svgWidth = 600
  const svgHeight = 230
  const chartBottom = 185
  const chartTop = 25
  const chartHeight = chartBottom - chartTop
  const colWidth = svgWidth / flowData.length
  const barWidth = 18

  // Coordenadas calculadas para as barras e para os pontos da linha de saldo
  const renderedItems = flowData.map((item, index) => {
    const colCenter = index * colWidth + colWidth / 2
    const incomeHeight = Math.max((item.income / maxVal) * chartHeight, item.income > 0 ? 5 : 0)
    const expenseHeight = Math.max((item.expense / maxVal) * chartHeight, item.expense > 0 ? 5 : 0)

    const incomeY = chartBottom - incomeHeight
    const expenseY = chartBottom - expenseHeight

    const balanceNormalized =
      chartBottom - Math.max(0, Math.min(chartHeight, (item.balance / maxVal) * chartHeight))

    return {
      ...item,
      index,
      colCenter,
      incomeX: colCenter - barWidth - 3,
      incomeY,
      incomeHeight,
      expenseX: colCenter + 3,
      expenseY,
      expenseHeight,
      balancePoint: { x: colCenter, y: balanceNormalized },
    }
  })

  // Gera o path SVG para a linha de saldo
  const balancePath = renderedItems.reduce((acc, curr, idx) => {
    const command = idx === 0 ? 'M' : 'L'
    return `${acc} ${command} ${curr.balancePoint.x} ${curr.balancePoint.y}`
  }, '')

  const activeItem = hoveredIndex !== null ? renderedItems[hoveredIndex] : null

  return (
    <section
      ref={spotlightRef}
      aria-labelledby="flow-chart-title"
      data-testid="financial-flow-chart"
      className="glass-card spotlight-card p-6 sm:p-7 rounded-3xl space-y-6 border border-white/10 shadow-xl bg-linear-to-b from-white/4 to-transparent relative overflow-hidden"
    >
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h2
              id="flow-chart-title"
              className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-sm truncate"
            >
              Fluxo Financeiro Semestral
            </h2>
            <p className="text-xs text-zinc-400 truncate mt-0.5">
              Comparativo de entradas, saídas e resultado líquido mês a mês
            </p>
          </div>
        </div>

        {/* Legenda visual interativa */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold shrink-0 flex-wrap">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-3 h-3 rounded-md bg-linear-to-b from-emerald-400 to-emerald-600 shadow-xs shadow-emerald-500/40" />
            <span>Entradas</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-3 h-3 rounded-md bg-linear-to-b from-rose-400 to-rose-600 shadow-xs shadow-rose-500/40" />
            <span>Saídas</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-300">
            <span className="w-3.5 h-1 rounded-full bg-cyan-400 shadow-xs shadow-cyan-400/50" />
            <span>Saldo</span>
          </div>
        </div>
      </div>

      {!hasAnyData ? (
        <div
          data-testid="flow-empty-state"
          className="text-center py-14 text-zinc-400 border border-dashed border-white/10 rounded-3xl glass-pill space-y-2.5"
        >
          <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto text-zinc-500">
            <TrendingUp className="w-6 h-6 opacity-75" aria-hidden="true" />
          </div>
          <p className="font-semibold text-sm text-zinc-200">
            Sem movimentações nos últimos 6 meses
          </p>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Assim que você registrar transações, este gráfico exibirá as barras de receitas,
            despesas e a curva de evolução do seu patrimônio.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Gráfico SVG Responsivo */}
          <div className="relative w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto max-h-68 overflow-visible"
              role="img"
              aria-label="Gráfico de fluxo financeiro dos últimos 6 meses"
            >
              <defs>
                {/* Gradiente Entrada (Verde Esmeralda) */}
                <linearGradient id="flowIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#059669" stopOpacity="0.5" />
                </linearGradient>

                {/* Gradiente Saída (Rosa/Vermelho) */}
                <linearGradient id="flowExpenseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#e11d48" stopOpacity="0.5" />
                </linearGradient>

                {/* Filtro de Glow Suave */}
                <filter id="flowGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Linhas de Grade de Fundo */}
              {[0.25, 0.5, 0.75, 1].map((pct) => {
                const y = chartBottom - pct * chartHeight
                return (
                  <line
                    key={pct}
                    x1="20"
                    y1={y}
                    x2={svgWidth - 20}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.06)"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                )
              })}

              {/* Linha Base Zero */}
              <line
                x1="15"
                y1={chartBottom}
                x2={svgWidth - 15}
                y2={chartBottom}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1.5"
              />

              {/* Colunas e Barras */}
              {renderedItems.map((item) => {
                const isHovered = hoveredIndex === item.index
                return (
                  /* biome-ignore lint/a11y/noStaticElementInteractions: Interação de foco e hover nas colunas SVG */
                  <g
                    key={item.key}
                    tabIndex={0}
                    aria-label={`${item.label}: Receitas ${formatCurrency(item.income)}, Despesas ${formatCurrency(item.expense)}`}
                    className="cursor-pointer transition-opacity duration-200 outline-none"
                    onMouseEnter={() => setHoveredIndex(item.index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onFocus={() => setHoveredIndex(item.index)}
                    onBlur={() => setHoveredIndex(null)}
                  >
                    {/* Área de Hover da Coluna */}
                    <rect
                      x={item.colCenter - colWidth / 2 + 6}
                      y={chartTop}
                      width={colWidth - 12}
                      height={chartHeight + 35}
                      fill={
                        isHovered
                          ? 'rgba(255, 255, 255, 0.08)'
                          : item.isCurrentPeriod
                            ? 'rgba(255, 255, 255, 0.035)'
                            : 'transparent'
                      }
                      rx="16"
                      className="transition-colors duration-150"
                    />

                    {/* Barra de Entrada (Receitas) */}
                    {item.income > 0 && (
                      <rect
                        x={item.incomeX}
                        y={item.incomeY}
                        width={barWidth}
                        height={item.incomeHeight}
                        rx="5"
                        fill="url(#flowIncomeGrad)"
                        className="transition-all duration-300 hover:brightness-125"
                      />
                    )}

                    {/* Barra de Saída (Despesas) */}
                    {item.expense > 0 && (
                      <rect
                        x={item.expenseX}
                        y={item.expenseY}
                        width={barWidth}
                        height={item.expenseHeight}
                        rx="5"
                        fill="url(#flowExpenseGrad)"
                        className="transition-all duration-300 hover:brightness-125"
                      />
                    )}

                    {/* Rótulo do Mês no Rodapé */}
                    <text
                      x={item.colCenter}
                      y={chartBottom + 22}
                      textAnchor="middle"
                      fill={item.isCurrentPeriod ? '#34d399' : isHovered ? '#ffffff' : '#a1a1aa'}
                      fontSize="11.5"
                      fontWeight={item.isCurrentPeriod || isHovered ? '700' : '500'}
                      letterSpacing="0.06em"
                    >
                      {item.label}
                    </text>
                  </g>
                )
              })}

              {/* Curva de Tendência de Saldo (Linha SVG) */}
              <path
                d={balancePath}
                fill="none"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#flowGlow)"
                className="opacity-85 pointer-events-none"
              />

              {/* Pontos da Curva de Saldo */}
              {renderedItems.map((item) => (
                <circle
                  key={`pt-${item.key}`}
                  cx={item.balancePoint.x}
                  cy={item.balancePoint.y}
                  r={hoveredIndex === item.index ? 5.5 : 3.5}
                  fill="#0b1120"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                  className="transition-all duration-150 pointer-events-none"
                />
              ))}
            </svg>
          </div>

          {/* Card Detalhado do Mês Focado ou Resumo Geral */}
          <div className="glass-pill p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs bg-linear-to-r from-white/3 via-white/5 to-white/3 shadow-sm">
            {activeItem ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-lg font-mono">
                    {activeItem.label} {activeItem.year}
                  </span>
                  {activeItem.isCurrentPeriod && (
                    <span className="text-2xs text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                      Mês Ativo
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium">
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                    <span>Entradas: {formatCurrency(activeItem.income)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-400 font-mono font-medium">
                    <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                    <span>Saídas: {formatCurrency(activeItem.expense)}</span>
                  </div>
                  <div
                    className={`font-bold font-mono ${
                      activeItem.balance >= 0 ? 'text-cyan-400' : 'text-amber-400'
                    }`}
                  >
                    Líquido: {formatCurrency(activeItem.balance)}
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-zinc-400 text-xs">
                <span>Passe o mouse sobre as colunas para ver detalhes de cada mês.</span>
                <span className="text-zinc-300 font-semibold whitespace-nowrap font-mono">
                  Saldo Líquido 6M: {formatCurrency(totalPeriodIncome - totalPeriodExpense)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
