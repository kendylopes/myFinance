import { CheckCircle2, Clock, Copy, Pencil, Repeat, Trash2 } from 'lucide-react'
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

  return (
    <div
      data-testid={`transaction-item-${transaction.id}`}
      className={`flex items-center justify-between p-4 glass-pill rounded-2xl hover:border-white/20 hover:bg-white/6 transition-all group shadow-sm ${
        isSelected ? 'border-emerald-500/40 bg-emerald-500/5 ring-1 ring-emerald-500/20' : ''
      }`}
    >
      <div className="flex items-center gap-3.5">
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={Boolean(isSelected)}
            onChange={() => onToggleSelect(transaction.id)}
            aria-label={`Selecionar ${transaction.title}`}
            data-testid={`checkbox-select-${transaction.id}`}
            className="w-4 h-4 rounded-md border border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 transition cursor-pointer accent-emerald-500 shrink-0"
          />
        )}
        <div className="relative">
          <div
            className={`p-2.5 rounded-xl border backdrop-blur-md shadow-sm transition-transform group-hover:scale-105 ${
              isIncome
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
            }`}
          >
            <CategoryIcon className="w-5 h-5" aria-hidden="true" />
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
        <div>
          {(() => {
            const installmentInfo = parseInstallment(transaction.title)
            const isRecurring = transaction.recurrence === 'recurring'

            return (
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                  {installmentInfo ? installmentInfo.baseTitle : transaction.title}
                </p>
                {installmentInfo && (
                  <span
                    data-testid={`installment-badge-${transaction.id}`}
                    className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-white/10 text-emerald-300 border border-white/10"
                    title={`Parcela ${installmentInfo.current} de ${installmentInfo.total}`}
                  >
                    {installmentInfo.current}/{installmentInfo.total}
                  </span>
                )}
                {isRecurring && (
                  <span
                    data-testid={`recurring-badge-${transaction.id}`}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                    title="Lançamento Recorrente"
                  >
                    <Repeat className="w-2.5 h-2.5" />
                    <span>Recorrente</span>
                  </span>
                )}
              </div>
            )
          })()}
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span className="glass-pill px-2 py-0.5 rounded-lg text-[11px] text-zinc-300">
              {transaction.category}
            </span>
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
            <span>•</span>
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
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
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

      <div className="flex items-center gap-2 sm:gap-3">
        <span
          className={`font-bold text-sm sm:text-base mr-1 sm:mr-2 ${
            isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>

        {onDuplicate && (
          <button
            type="button"
            data-testid={`duplicate-btn-${transaction.id}`}
            onClick={handleDuplicate}
            aria-label={`Duplicar transação ${transaction.title}`}
            title="Duplicar transação"
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Copy className="w-4 h-4" aria-hidden="true" />
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
            className="p-2 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <Pencil className="w-4 h-4" aria-hidden="true" />
          </button>
        )}

        <button
          type="button"
          data-testid={`delete-btn-${transaction.id}`}
          onClick={handleDelete}
          aria-label={`Excluir transação ${transaction.title}`}
          title="Excluir transação"
          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
