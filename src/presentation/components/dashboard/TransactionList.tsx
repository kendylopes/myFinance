import { Layers } from 'lucide-react'
import type { Transaction, TransactionFilterType } from '../../../domain/models/transaction'
import { TransactionFilters } from './TransactionFilters'
import { TransactionItem } from './TransactionItem'

export interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onDelete: (id: string) => void
  // Props de filtro opcionais
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedType?: TransactionFilterType
  onTypeChange?: (type: TransactionFilterType) => void
  categories?: string[]
  totalFilteredCount?: number
  totalPeriodCount?: number
  hasActiveFilters?: boolean
  onClearFilters?: () => void
}

export const TransactionList = ({
  transactions,
  isLoading,
  onDelete,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  categories,
  totalFilteredCount,
  totalPeriodCount,
  hasActiveFilters,
  onClearFilters,
}: TransactionListProps) => {
  const showFilters = Boolean(onSearchChange && onCategoryChange && onTypeChange)

  return (
    <section
      aria-labelledby="list-title"
      className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 p-6 rounded-3xl shadow-sm space-y-4"
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

      {/* ÁREA DE FILTROS & BUSCA */}
      {showFilters && onSearchChange && onCategoryChange && onTypeChange && onClearFilters && (
        <TransactionFilters
          searchQuery={searchQuery || ''}
          onSearchChange={onSearchChange}
          selectedCategory={selectedCategory || 'all'}
          onCategoryChange={onCategoryChange}
          selectedType={selectedType || 'all'}
          onTypeChange={onTypeChange}
          categories={categories || []}
          totalFilteredCount={totalFilteredCount ?? transactions.length}
          totalPeriodCount={totalPeriodCount ?? transactions.length}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onClearFilters={onClearFilters}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">
          <p>Carregando movimentações...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div
          data-testid="empty-state"
          className="text-center py-12 text-slate-400 border border-dashed border-slate-800/80 rounded-2xl p-6"
        >
          {hasActiveFilters ? (
            <>
              <p className="font-medium text-slate-300">
                Nenhuma movimentação encontrada para os filtros aplicados.
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Tente ajustar a busca textual ou selecionar outra categoria.
              </p>
              {onClearFilters && (
                <button
                  type="button"
                  onClick={onClearFilters}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition-colors"
                >
                  Limpar todos os filtros
                </button>
              )}
            </>
          ) : (
            <>
              <p className="font-medium text-slate-400">
                Nenhuma transação registrada neste período.
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Preencha o formulário para adicionar a sua primeira movimentação financeira!
              </p>
            </>
          )}
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
