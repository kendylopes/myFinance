import { Calendar, ChevronLeft, ChevronRight, Clock, SlidersHorizontal } from 'lucide-react'
import { soundFX } from '../../../core/sound/soundEffects'
import type { DateRange, ReportPeriodType } from '../../../domain/services/reportCalculations'

interface ReportPeriodSelectorProps {
  periodType: ReportPeriodType
  onPeriodTypeChange: (type: ReportPeriodType) => void
  currentRange: DateRange
  onPreviousPeriod: () => void
  onNextPeriod: () => void
  onCurrentPeriod: () => void
  customStart: string
  customEnd: string
  onCustomRangeChange: (start: string, end: string) => void
}

export function ReportPeriodSelector({
  periodType,
  onPeriodTypeChange,
  currentRange,
  onPreviousPeriod,
  onNextPeriod,
  onCurrentPeriod,
  customStart,
  customEnd,
  onCustomRangeChange,
}: ReportPeriodSelectorProps) {
  const tabs: { id: ReportPeriodType; label: string; icon: typeof Clock }[] = [
    { id: 'week', label: 'Semanal', icon: Clock },
    { id: 'month', label: 'Mensal', icon: Calendar },
    { id: 'year', label: 'Anual', icon: Calendar },
    { id: 'custom', label: 'Personalizado', icon: SlidersHorizontal },
  ]

  const handleTabChange = (type: ReportPeriodType) => {
    soundFX.playClick()
    onPeriodTypeChange(type)
  }

  const handleQuickPreset = (days: number) => {
    soundFX.playClick()
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - (days - 1))

    const toISO = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    onCustomRangeChange(toISO(start), toISO(end))
  }

  return (
    <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-4">
      {/* Linha Superior: Abas de Período e Navegação */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Abas Pílula */}
        <div
          role="tablist"
          aria-label="Granularidade do Relatório"
          className="inline-flex p-1 rounded-2xl glass-pill border border-white/10 self-start sm:self-auto"
        >
          {tabs.map((tab) => {
            const isActive = periodType === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                type="button"
                aria-selected={isActive}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-zinc-950 shadow-md font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Controles de Navegação (Anterior / Atual / Próximo) */}
        {periodType !== 'custom' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onPreviousPeriod()
              }}
              aria-label="Período anterior"
              className="p-1.5 rounded-xl border border-white/10 glass-pill text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onCurrentPeriod()
              }}
              className="px-3 py-1 rounded-xl border border-white/10 glass-pill text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              Hoje
            </button>

            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onNextPeriod()
              }}
              aria-label="Próximo período"
              className="p-1.5 rounded-xl border border-white/10 glass-pill text-zinc-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Rótulo do Período Atual Ativo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm font-semibold text-white tracking-wide">
            {currentRange.label}
          </span>
          <span className="text-xs text-zinc-400 font-mono">
            ({currentRange.startDate} a {currentRange.endDate})
          </span>
        </div>

        {/* Controles do Modo Personalizado */}
        {periodType === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0">
            <div className="flex items-center gap-1.5 text-xs text-zinc-300">
              <label htmlFor="report-custom-start" className="sr-only">
                Data Inicial
              </label>
              <input
                id="report-custom-start"
                type="date"
                value={customStart}
                onChange={(e) => onCustomRangeChange(e.target.value, customEnd)}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-500/50"
              />
              <span className="text-zinc-500">até</span>
              <label htmlFor="report-custom-end" className="sr-only">
                Data Final
              </label>
              <input
                id="report-custom-end"
                type="date"
                value={customEnd}
                onChange={(e) => onCustomRangeChange(customStart, e.target.value)}
                className="px-2.5 py-1 rounded-xl bg-white/5 border border-white/10 text-xs text-white focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>

            {/* Presets Rápidos */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => handleQuickPreset(7)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                7d
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(30)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                30d
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(90)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                90d
              </button>
              <button
                type="button"
                onClick={() => handleQuickPreset(180)}
                className="px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                180d
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
