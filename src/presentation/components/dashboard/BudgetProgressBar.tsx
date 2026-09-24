import { useState } from 'react'
import { formatBRL } from '../../../core/formatters/currency'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import type { BudgetProgress } from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'

export interface BudgetProgressBarProps {
  progress: BudgetProgress
  onUpdateBudget: (amount: number) => Promise<boolean>
}

export function BudgetProgressBar({ progress, onUpdateBudget }: BudgetProgressBarProps) {
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(progress.budgetAmount.toString())
  const [isSaving, setIsSaving] = useState(false)
  const cardRef = useSpotlight<HTMLDivElement>()

  const handleStartEdit = () => {
    soundFX.playClick()
    setInputValue(progress.budgetAmount.toString())
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    soundFX.playClick()
    setIsEditing(false)
    setInputValue(progress.budgetAmount.toString())
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const numeric = Number.parseFloat(inputValue)
    if (Number.isNaN(numeric) || numeric < 0) return

    setIsSaving(true)
    const success = await onUpdateBudget(numeric)
    setIsSaving(false)
    if (success) {
      soundFX.playSuccess()
      toast.success('Orçamento Atualizado', `Novo teto mensal definido para ${formatBRL(numeric)}.`)
      setIsEditing(false)
    }
  }

  // Estilos dinâmicos de acordo com o status do orçamento
  const statusConfig = {
    safe: {
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      badgeText: 'Dentro do Orçamento',
      barGradient: 'from-emerald-500 to-teal-400',
      textColor: 'text-emerald-400',
    },
    warning: {
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      badgeText: 'Alerta de Gastos',
      barGradient: 'from-amber-500 to-yellow-400',
      textColor: 'text-amber-400',
    },
    exceeded: {
      badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
      badgeText: 'Orçamento Ultrapassado',
      barGradient: 'from-rose-500 to-red-600',
      textColor: 'text-rose-400',
    },
  }[progress.status]

  const visualPercentage = Math.min(progress.spentPercentage, 100)

  return (
    <div
      ref={cardRef}
      data-testid="budget-progress-card"
      className="glass-card spotlight-card rounded-3xl p-6 relative overflow-hidden transition-all duration-300"
    >
      {/* Luz ambiente de fundo */}
      <div
        aria-hidden="true"
        className={`absolute -top-12 -right-12 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500 ${
          progress.status === 'exceeded'
            ? 'bg-rose-500'
            : progress.status === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
        }`}
      />

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-white/4 backdrop-blur-md rounded-2xl border border-white/10 text-zinc-200 shadow-sm">
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-white drop-shadow-sm">
              Teto de Gastos & Meta Mensal
            </h2>
            <p className="text-xs text-zinc-400">
              Controle seu consumo de despesas para não estourar o mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-md ${statusConfig.badgeClass}`}
          >
            {statusConfig.badgeText}
          </span>

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium glass-pill text-zinc-300 hover:text-white hover:border-white/20 transition-all duration-200 cursor-pointer shadow-sm"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                />
              </svg>
              <span>Ajustar Teto</span>
            </button>
          )}
        </div>
      </div>

      {/* FORMULÁRIO DE EDIÇÃO INLINE */}
      {isEditing ? (
        <form
          onSubmit={handleSave}
          className="mb-6 p-4 glass-pill rounded-2xl flex flex-col sm:flex-row items-center gap-3 relative z-10"
        >
          <div className="w-full sm:flex-1">
            <label htmlFor="budget-input" className="block text-xs text-zinc-300 mb-1">
              Definir teto orçamentário para o mês (R$):
            </label>
            <input
              id="budget-input"
              type="number"
              min="0"
              step="50"
              required
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2 text-sm text-white placeholder-zinc-500 transition-all"
              placeholder="Ex: 3500"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-end pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 transition-colors shadow-lg shadow-emerald-500/25 cursor-pointer"
            >
              {isSaving ? 'Salvando...' : 'Salvar Teto'}
            </button>
          </div>
        </form>
      ) : null}

      {/* MÉTRICAS DE RESUMO DO ORÇAMENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 relative z-10">
        <div className="glass-pill p-3.5 rounded-2xl">
          <span className="text-xs text-zinc-400 block mb-0.5">Gasto Realizado</span>
          <span className="text-lg font-bold text-white">{formatBRL(progress.totalExpense)}</span>
        </div>

        <div className="glass-pill p-3.5 rounded-2xl">
          <span className="text-xs text-zinc-400 block mb-0.5">Teto Orçamentário</span>
          <span className="text-lg font-bold text-white">{formatBRL(progress.budgetAmount)}</span>
        </div>

        <div className="glass-pill p-3.5 rounded-2xl">
          <span className="text-xs text-zinc-400 block mb-0.5">
            {progress.isExceeded ? 'Estouro Orçamentário' : 'Limite Restante'}
          </span>
          <span className={`text-lg font-bold ${statusConfig.textColor}`}>
            {progress.isExceeded
              ? `+${formatBRL(Math.abs(progress.remainingAmount))}`
              : formatBRL(progress.remainingAmount)}
          </span>
        </div>
      </div>

      {/* BARRA DE PROGRESSO VISUAL COM LASER SHIMMER */}
      <div className="space-y-2 relative z-10">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>Consumo da meta</span>
          <span className={`font-semibold ${statusConfig.textColor}`}>
            {progress.spentPercentage}%
          </span>
        </div>

        <div className="w-full h-3.5 bg-zinc-950/70 rounded-full overflow-hidden p-0.5 border border-white/10 shadow-inner relative">
          <div
            data-testid="budget-progress-indicator"
            className={`h-full rounded-full bg-linear-to-r ${statusConfig.barGradient} transition-all duration-700 ease-out relative overflow-hidden`}
            style={{ width: `${visualPercentage}%` }}
          >
            {/* Feixe de Laser Shimmer Especular */}
            <div
              aria-hidden="true"
              className="absolute inset-0 w-24 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer-sweep pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* MENSAGEM CONTEXTUAL MOTIVACIONAL / ALERTA */}
      <div className="mt-4 pt-4 border-t border-zinc-800/60 text-xs text-zinc-400 flex items-center justify-between">
        <span>
          {progress.budgetAmount === 0 ? (
            'Defina um teto orçamentário para acompanhar o progresso mensal.'
          ) : progress.isExceeded ? (
            <strong className="text-rose-400 font-medium">
              Atenção: Suas despesas excederam o limite planejado para este mês!
            </strong>
          ) : progress.status === 'warning' ? (
            <strong className="text-amber-400 font-medium">
              Cuidado: Você já consumiu mais de 75% do seu orçamento mensal.
            </strong>
          ) : (
            'Parabéns! Suas despesas continuam saudáveis e dentro do previsto.'
          )}
        </span>
      </div>
    </div>
  )
}
