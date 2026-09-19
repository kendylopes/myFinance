import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { formatMonthYear, getCurrentYearMonth } from '../../../core/formatters/date'

interface MonthSelectorProps {
  selectedMonth: string
  onPreviousMonth: () => void
  onNextMonth: () => void
  onCurrentMonth: () => void
  onToggleAllPeriods: () => void
}

export const MonthSelector = ({
  selectedMonth,
  onPreviousMonth,
  onNextMonth,
  onCurrentMonth,
  onToggleAllPeriods,
}: MonthSelectorProps) => {
  const currentMonth = getCurrentYearMonth()
  const isCurrentMonth = selectedMonth === currentMonth
  const isAllPeriods = selectedMonth === 'all'

  return (
    <nav
      aria-label="Navegação por período"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 px-5 py-3.5 rounded-2xl backdrop-blur shadow-sm"
    >
      {/* Controles de Navegação Mensal */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={onPreviousMonth}
          disabled={isAllPeriods}
          aria-label="Mês anterior"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-950/80 border border-slate-800/80 rounded-xl">
          <Calendar className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span
            data-testid="selected-month-text"
            className="text-sm font-semibold text-white tracking-tight min-w-[150px] text-center"
          >
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        <button
          type="button"
          onClick={onNextMonth}
          disabled={isAllPeriods}
          aria-label="Próximo mês"
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {!isCurrentMonth && !isAllPeriods && (
          <button
            type="button"
            onClick={onCurrentMonth}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mês Atual</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleAllPeriods}
          data-testid="toggle-all-periods-btn"
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
            isAllPeriods
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
              : 'text-slate-400 hover:text-white border-slate-800 hover:bg-slate-800/60'
          }`}
        >
          {isAllPeriods ? 'Modo Mensal' : 'Todos os Períodos'}
        </button>
      </div>
    </nav>
  )
}
