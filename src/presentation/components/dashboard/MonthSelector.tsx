import { Calendar, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { formatMonthYear, getCurrentYearMonth } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useSpotlight } from '../../hooks/useSpotlight'

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
  const navRef = useSpotlight<HTMLElement>()

  const handlePrev = () => {
    soundFX.playClick()
    onPreviousMonth()
  }

  const handleNext = () => {
    soundFX.playClick()
    onNextMonth()
  }

  const handleCurrent = () => {
    soundFX.playClick()
    onCurrentMonth()
  }

  const handleToggle = () => {
    soundFX.playClick()
    onToggleAllPeriods()
  }

  return (
    <nav
      ref={navRef}
      aria-label="Navegação por período"
      className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card spotlight-card px-5 py-3.5 rounded-2xl"
    >
      {/* Controles de Navegação Mensal */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isAllPeriods}
          aria-label="Mês anterior"
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2.5 px-3.5 py-1.5 glass-pill rounded-xl border-white/10 shadow-inner">
          <Calendar className="w-4 h-4 text-emerald-400" aria-hidden="true" />
          <span
            data-testid="selected-month-text"
            className="text-sm font-semibold text-white tracking-tight min-w-37.5 text-center"
          >
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isAllPeriods}
          aria-label="Próximo mês"
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        {!isCurrentMonth && !isAllPeriods && (
          <button
            type="button"
            onClick={handleCurrent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 backdrop-blur-md rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mês Atual</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleToggle}
          data-testid="toggle-all-periods-btn"
          className={`px-3.5 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-all cursor-pointer shadow-sm ${
            isAllPeriods
              ? 'bg-emerald-600/90 text-white border-emerald-400 shadow-emerald-950/40'
              : 'text-zinc-300 hover:text-white border-white/10 bg-white/4 hover:bg-white/10 hover:border-white/20'
          }`}
        >
          {isAllPeriods ? 'Modo Mensal' : 'Todos os Períodos'}
        </button>
      </div>
    </nav>
  )
}
