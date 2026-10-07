import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  Pencil,
  Repeat,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { formatDate } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import { getCategoryIcon } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'
import { isOverdue, parseInstallment } from '../../../domain/services/financeCalculations'

interface TransactionItemProps {
  transaction: Transaction
  onDelete: (id: string) => void
  onEdit?: (transaction: Transaction) => void
  onDuplicate?: (transaction: Transaction) => void
  onToggleStatus?: (id: string) => void
  isSelected?: boolean
  onToggleSelect?: (id: string) => void
}

export const TransactionItem = ({
  transaction,
  onDelete,
  onEdit,
  onDuplicate,
  onToggleStatus,
  isSelected,
  onToggleSelect,
}: TransactionItemProps) => {
  const toast = useToast()
  const isIncome = transaction.type === 'income'
  const isPending = (transaction.status || 'paid') === 'pending'
  const isExpired = !isIncome && isOverdue(transaction)
  const CategoryIcon = getCategoryIcon(transaction.category)

  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggleExpand = () => {
    soundFX.playClick()
    setIsExpanded((prev) => !prev)
  }

  const handleDelete = () => {
    soundFX.playClick()
    onDelete(transaction.id)
    toast.info('Transação excluída', `"${transaction.title}" foi removida.`)
  }

  const handleDuplicate = () => {
    soundFX.playClick()
    onDuplicate?.(transaction)
  }

  const handleToggleStatus = () => {
    const nextStatus = isPending ? 'paid' : 'pending'
    if (nextStatus === 'paid') {
      soundFX.playSuccess()
      toast.success(
        isIncome ? 'Recebimento confirmado!' : 'Pagamento confirmado!',
        `"${transaction.title}" marcado como ${isIncome ? 'recebido' : 'pago'}.`,
      )
    } else {
      soundFX.playClick()
      toast.info(
        'Status alterado',
        `"${transaction.title}" marcado como ${isIncome ? 'a receber' : 'a pagar'}.`,
      )
    }
    onToggleStatus?.(transaction.id)
  }

  const installmentInfo = parseInstallment(transaction.title)
  const isRecurring = transaction.recurrence === 'recurring'

  return (
    <div
      data-testid={`transaction-item-${transaction.id}`}
      className={`p-3.5 sm:p-4 glass-pill rounded-2xl hover:border-white/20 hover:bg-white/6 transition-all group shadow-sm ${
        isSelected ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Lado Esquerdo: Checkbox + Ícone + Título e Metadados */}
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          {onToggleSelect && (
            <input
              type="checkbox"
              checked={Boolean(isSelected)}
              onChange={() => onToggleSelect(transaction.id)}
              aria-label={`Selecionar ${transaction.title}`}
              data-testid={`checkbox-select-${transaction.id}`}
              className="w-4 h-4 rounded-md border border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 transition cursor-pointer accent-emerald-500 shrink-0 mt-1 sm:mt-0"
            />
          )}

          <div className="relative shrink-0 mt-0.5 sm:mt-0">
            <div
              className={`p-2 sm:p-2.5 rounded-xl border backdrop-blur-md shadow-sm transition-transform group-hover:scale-105 ${
                isIncome
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
              }`}
            >
              <CategoryIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" aria-hidden="true" />
            </div>
            {/* Mini-badge discreto indicando tipo (+ para entrada, - para saída) */}
            <div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center border text-[9px] font-bold shadow-xs ${
                isIncome
                  ? 'bg-emerald-500 text-zinc-950 border-zinc-900'
                  : 'bg-rose-500 text-white border-zinc-900'
              }`}
              aria-hidden="true"
              title={isIncome ? 'Entrada' : 'Saída'}
            >
              {isIncome ? '+' : '-'}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                <p
                  className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors truncate"
                  title={installmentInfo ? installmentInfo.baseTitle : transaction.title}
                >
                  {installmentInfo ? installmentInfo.baseTitle : transaction.title}
                </p>
                {installmentInfo && (
                  <span
                    data-testid={`installment-badge-${transaction.id}`}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-emerald-300 border border-white/10 shrink-0"
                    title={`Parcela ${installmentInfo.current} de ${installmentInfo.total}`}
                  >
                    {installmentInfo.current}/{installmentInfo.total}
                  </span>
                )}
                {isRecurring && (
                  <span
                    data-testid={`recurring-badge-${transaction.id}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0"
                    title="Lançamento Recorrente"
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span>Recorrente</span>
                  </span>
                )}
              </div>

              {/* Botão de expansão no mobile */}
              <button
                type="button"
                onClick={handleToggleExpand}
                aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                aria-expanded={isExpanded}
                className="sm:hidden p-1 rounded-lg text-zinc-400 hover:text-white bg-white/5 border border-white/5 transition-colors cursor-pointer shrink-0"
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs text-zinc-400 mt-1">
              <span className="glass-pill px-2 py-0.5 rounded-lg text-[11px] text-zinc-300 font-medium">
                {transaction.category}
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">{formatDate(transaction.date)}</span>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                data-testid={`status-toggle-${transaction.id}`}
                onClick={handleToggleStatus}
                aria-label={`Status: ${isPending ? (isIncome ? 'A Receber' : 'Pendente') : isIncome ? 'Recebido' : 'Pago'}. Clique para alternar.`}
                title={
                  isPending
                    ? isIncome
                      ? 'Pendente de recebimento. Clique para confirmar recebimento.'
                      : isExpired
                        ? 'Despesa vencida! Clique para marcar como paga.'
                        : 'Pendente de pagamento. Clique para marcar como paga.'
                    : isIncome
                      ? 'Recebido. Clique para marcar como pendente.'
                      : 'Pago. Clique para marcar como pendente.'
                }
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer hover:scale-105 active:scale-95 shrink-0 ${
                  isPending
                    ? isExpired
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/40 animate-pulse ring-1 ring-rose-500/30'
                      : isIncome
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                }`}
              >
                {isPending ? (
                  <>
                    <Clock className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>{isExpired ? 'Vencido' : isIncome ? 'A Receber' : 'Pendente'}</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>{isIncome ? 'Recebido' : 'Pago'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Lado Direito: Valor Monetário + Ações */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 shrink-0 pt-2 sm:pt-0 border-t border-white/5 sm:border-t-0 pl-11 sm:pl-0">
          <span
            className={`font-bold font-mono text-sm sm:text-base whitespace-nowrap tracking-tight ${
              isIncome ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
          </span>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {onDuplicate && (
              <button
                type="button"
                data-testid={`duplicate-btn-${transaction.id}`}
                onClick={handleDuplicate}
                aria-label={`Duplicar transação ${transaction.title}`}
                title="Duplicar transação"
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                data-testid={`edit-btn-${transaction.id}`}
                onClick={() => {
                  soundFX.playClick()
                  onEdit(transaction)
                }}
                aria-label={`Editar transação ${transaction.title}`}
                title="Editar transação"
                className="p-1.5 sm:p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <Pencil className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              </button>
            )}

            <button
              type="button"
              data-testid={`delete-btn-${transaction.id}`}
              onClick={handleDelete}
              aria-label={`Excluir transação ${transaction.title}`}
              title="Excluir transação"
              className="p-1.5 sm:p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Painel Expansível no Mobile */}
      {isExpanded && (
        <div className="sm:hidden pt-2.5 mt-2.5 border-t border-white/10 space-y-1.5 text-xs text-zinc-400 pl-11 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span>Data da movimentação:</span>
            <strong className="text-zinc-200 font-medium">{formatDate(transaction.date)}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Categoria:</span>
            <strong className="text-zinc-200 font-medium">{transaction.category}</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>ID:</span>
            <span className="font-mono text-[10px] text-zinc-500 truncate max-w-36">
              {transaction.id}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
