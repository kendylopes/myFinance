import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../../core/formatters/currency'
import { formatDate } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Transaction } from '../../../domain/models/transaction'

interface TransactionItemProps {
  transaction: Transaction
  onDelete: (id: string) => void
}

export const TransactionItem = ({ transaction, onDelete }: TransactionItemProps) => {
  const isIncome = transaction.type === 'income'

  const handleDelete = () => {
    soundFX.playClick()
    onDelete(transaction.id)
  }

  return (
    <div
      data-testid={`transaction-item-${transaction.id}`}
      className="flex items-center justify-between p-4 glass-pill rounded-2xl hover:border-white/20 hover:bg-white/6 transition-all group shadow-sm"
    >
      <div className="flex items-center gap-3.5">
        <div
          className={`p-2.5 rounded-xl border backdrop-blur-md shadow-sm ${
            isIncome
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/25'
          }`}
        >
          {isIncome ? (
            <ArrowUpCircle className="w-5 h-5" aria-hidden="true" />
          ) : (
            <ArrowDownCircle className="w-5 h-5" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {transaction.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
            <span className="glass-pill px-2 py-0.5 rounded-lg text-[11px] text-zinc-300">
              {transaction.category}
            </span>
            <span>•</span>
            <span>{formatDate(transaction.date)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span
          className={`font-bold text-sm sm:text-base ${
            isIncome ? 'text-emerald-400' : 'text-rose-400'
          }`}
        >
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </span>

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
