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
      className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card spotlight-card px-5 py-3.5 rounded-3xl border border-white/10 shadow-lg bg-linear-to-b from-white/4 to-transparent"
    >
      {/* Controles de Navegação Mensal */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={handlePrev}
          disabled={isAllPeriods}
          aria-label="Mês anterior"
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/8 active:scale-95 rounded-2xl transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-white/10"
        >
          <ChevronLeft className="w-5 h-5" aria-hidden="true" />
        </button>

        {/* Pílula Central com Efeito de Vidro */}
        <div className="flex items-center gap-2.5 px-4 py-2 glass-pill rounded-2xl border border-white/10 shadow-inner bg-linear-to-r from-white/4 via-white/6 to-white/4 backdrop-blur-md">
          <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Calendar className="w-4 h-4" aria-hidden="true" />
          </div>
          <span
            data-testid="selected-month-text"
            className="text-sm font-bold text-white tracking-tight min-w-40 text-center capitalize"
          >
            {formatMonthYear(selectedMonth)}
          </span>
        </div>

        <button
          type="button"
          onClick={handleNext}
          disabled={isAllPeriods}
          aria-label="Próximo mês"
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/8 active:scale-95 rounded-2xl transition-all duration-200 disabled:opacity-30 disabled:pointer-events-none cursor-pointer border border-transparent hover:border-white/10"
        >
          <ChevronRight className="w-5 h-5" aria-hidden="true" />
        </button>
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
        {!isCurrentMonth && !isAllPeriods && (
          <button
            type="button"
            onClick={handleCurrent}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 active:scale-95 backdrop-blur-md rounded-2xl transition-all duration-200 cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Mês Atual</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleToggle}
          data-testid="toggle-all-periods-btn"
          className={`px-3.5 py-1.5 text-xs font-semibold rounded-2xl border backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer shadow-xs ${
            isAllPeriods
              ? 'bg-emerald-500/90 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/40'
              : 'text-zinc-300 hover:text-white border-white/10 bg-white/4 hover:bg-white/8 hover:border-white/20'
          }`}
        >
          {isAllPeriods ? 'Modo Mensal' : 'Todos os Períodos'}
        </button>
      </div>
    </nav>
  )
}
