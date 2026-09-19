import { ArrowDownCircle, ArrowUpCircle, Trash2 } from 'lucide-react'
import { formatCurrency } from '../../../core/formatters/currency'
import { formatDate } from '../../../core/formatters/date'
import type { Transaction } from '../../../domain/models/transaction'

interface TransactionItemProps {
  transaction: Transaction
  onDelete: (id: string) => void
}

export const TransactionItem = ({ transaction, onDelete }: TransactionItemProps) => {
  const isIncome = transaction.type === 'income'

  return (
    <div
      data-testid={`transaction-item-${transaction.id}`}
      className="flex items-center justify-between p-4 bg-slate-950/60 border border-slate-800/60 rounded-xl hover:border-slate-700/80 transition-all group"
    >
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-xl ${
            isIncome
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}
        >
          {isIncome ? (
            <ArrowUpCircle className="w-5 h-5" aria-hidden="true" />
          ) : (
            <ArrowDownCircle className="w-5 h-5" aria-hidden="true" />
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-white">{transaction.title}</p>
          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
            <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
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
          onClick={() => onDelete(transaction.id)}
          aria-label={`Excluir transação ${transaction.title}`}
          title="Excluir transação"
          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-500"
        >
          <Trash2 className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
