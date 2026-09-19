import { Layers } from 'lucide-react'
import type { Transaction } from '../../../domain/models/transaction'
import { TransactionItem } from './TransactionItem'

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onDelete: (id: string) => void
}

export const TransactionList = ({ transactions, isLoading, onDelete }: TransactionListProps) => {
  return (
    <section
      aria-labelledby="list-title"
      className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-4"
    >
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 id="list-title" className="text-lg font-semibold text-white">
            Histórico de Transações
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          {transactions.length} {transactions.length === 1 ? 'registro' : 'registros'}
        </span>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">
          <p>Carregando movimentações...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div
          data-testid="empty-state"
          className="text-center py-12 text-slate-500 border border-dashed border-slate-800/80 rounded-xl"
        >
          <p className="font-medium">Nenhuma transação registrada ainda.</p>
          <p className="text-xs mt-1 text-slate-600">
            Preencha o formulário para adicionar a sua primeira movimentação financeira!
          </p>
        </div>
      ) : (
        <div data-testid="transaction-list" className="space-y-2.5">
          {transactions.map((item) => (
            <TransactionItem key={item.id} transaction={item} onDelete={onDelete} />
          ))}
        </div>
      )}
    </section>
  )
}
