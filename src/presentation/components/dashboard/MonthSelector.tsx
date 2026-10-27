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
      className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-2.5 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md transition-all duration-200"
    >
      {/* Controles de Navegação Mensal */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isAllPeriods}
          aria-label="Mês anterior"
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/6 active:scale-95 rounded-xl transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-white/8"
        >
          <ChevronLeft className="w-4.5 h-4.5" aria-hidden="true" />
        </button>

        {/* Pílula Central com Efeito de Vidro */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-white/8 bg-white/3 backdrop-blur-md">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <span
            data-testid="selected-month-text"
            className="text-xs sm:text-sm font-semibold text-white tracking-tight min-w-36 text-center capitalize"
          >
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isAllPeriods}
          aria-label="Próximo mês"
          className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/6 active:scale-95 rounded-xl transition-all duration-200 disabled:opacity-20 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-white/8"
        >
          <ChevronRight className="w-4.5 h-4.5" aria-hidden="true" />
        </button>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
        {!isCurrentMonth && !isAllPeriods && (
          <button
            type="button"
            onClick={handleCurrent}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/15 active:scale-95 backdrop-blur-md rounded-xl transition-all duration-200 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mês Atual</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleToggle}
          data-testid="toggle-all-periods-btn"
          className={`px-3 py-1.5 text-xs font-medium rounded-xl border backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer ${
            isAllPeriods
              ? 'bg-emerald-500/80 hover:bg-emerald-500 text-white border-emerald-400/80 shadow-xs'
              : 'text-zinc-400 hover:text-white border-white/8 bg-white/3 hover:bg-white/6 hover:border-white/15'
          }`}
        >
          {isAllPeriods ? 'Modo Mensal' : 'Todos os Períodos'}
        </button>
      </div>
    </nav>
  )
}
