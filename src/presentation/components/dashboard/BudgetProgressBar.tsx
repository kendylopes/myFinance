import { useState } from 'react'
import { formatBRL } from '../../../core/formatters/currency'
import type { BudgetProgress } from '../../../domain/models/transaction'

export interface BudgetProgressBarProps {
  progress: BudgetProgress
  onUpdateBudget: (amount: number) => Promise<boolean>
}

export function BudgetProgressBar({ progress, onUpdateBudget }: BudgetProgressBarProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState(progress.budgetAmount.toString())
  const [isSaving, setIsSaving] = useState(false)

  const handleStartEdit = () => {
    setInputValue(progress.budgetAmount.toString())
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
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
      data-testid="budget-progress-card"
      className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300"
    >
      {/* Luz ambiente de fundo */}
      <div
        aria-hidden="true"
        className={`absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-15 ${
          progress.status === 'exceeded'
            ? 'bg-rose-500'
            : progress.status === 'warning'
              ? 'bg-amber-500'
              : 'bg-emerald-500'
        }`}
      />

      {/* CABEÇALHO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60 text-slate-300">
            <svg
              className="w-5 h-5"
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
            <h2 className="text-base font-semibold text-slate-200">Teto de Gastos & Meta Mensal</h2>
            <p className="text-xs text-slate-400">
              Controle seu consumo de despesas para não estourar o mês
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.badgeClass}`}
          >
            {statusConfig.badgeText}
          </span>

          {!isEditing && (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all duration-200"
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
          className="mb-6 p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col sm:flex-row items-center gap-3 animate-fadeIn"
        >
          <div className="w-full sm:flex-1">
            <label htmlFor="budget-input" className="block text-xs text-slate-400 mb-1">
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
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
              placeholder="Ex: 3500"
            />
          </div>
          <div className="flex items-center gap-2 self-end sm:self-end pt-2 sm:pt-0">
            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-slate-950 font-semibold transition-colors shadow-lg shadow-emerald-500/20"
            >
              {isSaving ? 'Salvando...' : 'Salvar Teto'}
            </button>
          </div>
        </form>
      ) : null}

      {/* MÉTRICAS DE RESUMO DO ORÇAMENTO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-0.5">Gasto Realizado</span>
          <span className="text-lg font-bold text-slate-100">
            {formatBRL(progress.totalExpense)}
          </span>
        </div>

        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-0.5">Teto Orçamentário</span>
          <span className="text-lg font-bold text-slate-100">
            {formatBRL(progress.budgetAmount)}
          </span>
        </div>

        <div className="bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800/60">
          <span className="text-xs text-slate-400 block mb-0.5">
            {progress.isExceeded ? 'Estouro Orçamentário' : 'Limite Restante'}
          </span>
          <span className={`text-lg font-bold ${statusConfig.textColor}`}>
            {progress.isExceeded
              ? `+${formatBRL(Math.abs(progress.remainingAmount))}`
              : formatBRL(progress.remainingAmount)}
          </span>
        </div>
      </div>

      {/* BARRA DE PROGRESSO VISUAL */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Consumo da meta</span>
          <span className={`font-semibold ${statusConfig.textColor}`}>
            {progress.spentPercentage}%
          </span>
        </div>

        <div className="w-full h-3.5 bg-slate-950/80 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            data-testid="budget-progress-indicator"
            className={`h-full rounded-full bg-gradient-to-r ${statusConfig.barGradient} transition-all duration-700 ease-out`}
            style={{ width: `${visualPercentage}%` }}
          />
        </div>
      </div>

      {/* MENSAGEM CONTEXTUAL MOTIVACIONAL / ALERTA */}
      <div className="mt-4 pt-4 border-t border-slate-800/60 text-xs text-slate-400 flex items-center justify-between">
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
