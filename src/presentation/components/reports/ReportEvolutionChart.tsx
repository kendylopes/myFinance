import { AlertCircle, Calendar, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import { formatBRL } from '../../../core/formatters/currency'
import type {
  DailyEvolutionItem,
  MonthlyEvolutionItem,
  ReportData,
} from '../../../domain/services/reportCalculations'

interface ReportEvolutionChartProps {
  report: ReportData
}

export function ReportEvolutionChart({ report }: ReportEvolutionChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const isYearMode = report.periodType === 'year'

  // Dados a exibir de acordo com a granularidade
  const items: (DailyEvolutionItem | MonthlyEvolutionItem)[] = isYearMode
    ? report.monthlyEvolution
    : report.dailyEvolution

  // Valor máximo para normalização de altura no gráfico
  const maxAmount = Math.max(
    ...items.map((item) => Math.max(item.income, item.expense)),
    100, // fallback mínimo
  )

  const hasData = items.some((item) => item.income > 0 || item.expense > 0)

  return (
    <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-5">
      {/* Cabeçalho do Gráfico */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <span>{isYearMode ? 'Evolução Mensal do Ano' : 'Evolução de Fluxo no Período'}</span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {isYearMode
              ? 'Comparativo de receitas e despesas mês a mês'
              : 'Detalhamento cronológico de entradas e saídas'}
          </p>
        </div>

        {/* Legenda */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-emerald-500 shadow-xs" />
            <span className="text-zinc-300">Receitas</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-rose-500 shadow-xs" />
            <span className="text-zinc-300">Despesas</span>
          </div>
        </div>
      </div>

      {/* Gráfico Visual */}
      {!hasData ? (
        <div className="py-16 text-center text-zinc-400 space-y-2">
          <Calendar className="w-8 h-8 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm font-medium">Nenhum dado registrado para este intervalo.</p>
          <p className="text-xs text-zinc-500">
            Adicione movimentações neste período para visualizar a curva de evolução.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="h-64 sm:h-72 flex items-end gap-1.5 sm:gap-3 pt-6 pb-2 overflow-x-auto">
            {items.map((item, index) => {
              const incomeHeight = `${Math.min(100, Math.round((item.income / maxAmount) * 100))}%`
              const expenseHeight = `${Math.min(100, Math.round((item.expense / maxAmount) * 100))}%`

              const label = 'monthLabel' in item ? item.monthLabel : item.dayLabel
              const isHovered = hoveredIndex === index

              return (
                <div
                  key={'date' in item ? item.date : item.yearMonth}
                  onPointerEnter={() => setHoveredIndex(index)}
                  onPointerLeave={() => setHoveredIndex(null)}
                  className="flex-1 min-w-[32px] sm:min-w-[42px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                >
                  {/* Tooltip flutuante no hover */}
                  {isHovered && (
                    <div className="absolute -top-20 z-20 pointer-events-none p-2.5 rounded-xl bg-zinc-900/95 border border-white/15 text-white text-[11px] shadow-2xl backdrop-blur-md whitespace-nowrap animate-fade-in">
                      <p className="font-bold text-zinc-300 mb-1 border-b border-white/10 pb-0.5">
                        {label}
                      </p>
                      <p className="text-emerald-400">Receita: {formatBRL(item.income)}</p>
                      <p className="text-rose-400">Despesa: {formatBRL(item.expense)}</p>
                      <p className="text-zinc-300 font-semibold pt-0.5">
                        Saldo: {formatBRL(item.income - item.expense)}
                      </p>
                    </div>
                  )}

                  {/* Barras Lado a Lado */}
                  <div className="w-full flex items-end justify-center gap-1 h-full px-0.5">
                    {/* Barra Receita */}
                    <div
                      className="w-1/2 max-w-[14px] bg-emerald-500/80 hover:bg-emerald-400 rounded-t-md transition-all duration-300 shadow-xs"
                      style={{ height: incomeHeight }}
                    />
                    {/* Barra Despesa */}
                    <div
                      className="w-1/2 max-w-[14px] bg-rose-500/80 hover:bg-rose-400 rounded-t-md transition-all duration-300 shadow-xs"
                      style={{ height: expenseHeight }}
                    />
                  </div>

                  {/* Rótulo inferior */}
                  <span className="text-[10px] text-zinc-400 mt-2 truncate w-full text-center">
                    {label.split(' ')[0]}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Destaque do Dia de Maior Gasto (se aplicável) */}
          {report.highestSpendingDay && (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 text-xs">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-zinc-300">
                Pico de gastos do período:{' '}
                <strong className="text-white">{report.highestSpendingDay.dayLabel}</strong> com um
                total de{' '}
                <strong className="text-rose-400">
                  {formatBRL(report.highestSpendingDay.amount)}
                </strong>{' '}
                em despesas.
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
