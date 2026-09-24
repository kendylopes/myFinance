import { ChevronLeft, ChevronRight, Layers, Plus, Rocket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import type {
  FinanceSummary,
  Transaction,
  TransactionFilterType,
} from '../../../domain/models/transaction'
import { ExportActions } from './ExportActions'
import { TransactionFilters, type TransactionSortOption } from './TransactionFilters'
import { TransactionItem } from './TransactionItem'

const PAGE_SIZE = 10

export interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
  onDelete: (id: string) => void
  onEdit?: (transaction: Transaction) => void
  onOpenNewTransaction?: () => void
  onOpenOnboarding?: () => void
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
  // Props de exportação opcionais
  exportSummary?: FinanceSummary
  selectedMonth?: string
}

export const TransactionList = ({
  transactions,
  isLoading,
  onDelete,
  onEdit,
  onOpenNewTransaction,
  onOpenOnboarding,
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
  exportSummary,
  selectedMonth,
}: TransactionListProps) => {
  const showFilters = Boolean(onSearchChange && onCategoryChange && onTypeChange)
  const [sortBy, setSortBy] = useState<TransactionSortOption>('date_desc')
  const [currentPage, setCurrentPage] = useState(1)

  // Resetar para a primeira página caso os filtros, busca ou lista mudem
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset intencional ao alterar filtros ou lista
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedType, transactions.length])

  // 1. Ordenação das transações
  const sortedTransactions = useMemo(() => {
    const list = [...transactions]
    switch (sortBy) {
      case 'date_desc':
        return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      case 'date_asc':
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      case 'amount_desc':
        return list.sort((a, b) => b.amount - a.amount)
      case 'amount_asc':
        return list.sort((a, b) => a.amount - b.amount)
      default:
        return list
    }
  }, [transactions, sortBy])

  // 2. Paginação
  const totalPages = Math.max(1, Math.ceil(sortedTransactions.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE
  const paginatedTransactions = sortedTransactions.slice(startIndex, startIndex + PAGE_SIZE)

  const handlePrevPage = () => {
    if (safeCurrentPage > 1) {
      soundFX.playClick()
      setCurrentPage((prev) => Math.max(1, prev - 1))
    }
  }

  const handleNextPage = () => {
    if (safeCurrentPage < totalPages) {
      soundFX.playClick()
      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
    }
  }

  return (
    <section
      aria-labelledby="list-title"
      className="glass-card p-6 rounded-3xl space-y-4 shadow-xl"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 id="list-title" className="text-lg font-semibold text-white drop-shadow-sm">
            Histórico de Transações
          </h2>
          <span className="text-xs text-slate-400 ml-1">
            ({transactions.length} {transactions.length === 1 ? 'registro' : 'registros'})
          </span>
        </div>

        {/* AÇÕES DE EXPORTAÇÃO (CSV E PDF) */}
        {exportSummary && selectedMonth && (
          <ExportActions
            transactions={transactions}
            summary={exportSummary}
            selectedMonth={selectedMonth}
          />
        )}
      </div>

      {/* ÁREA DE FILTROS & BUSCA & ORDENAÇÃO */}
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
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {isLoading ? (
        <div className="text-center py-12 text-slate-400 animate-pulse">
          <p>Carregando movimentações...</p>
        </div>
      ) : transactions.length === 0 ? (
        <div
          data-testid="empty-state"
          className="text-center py-12 text-slate-400 border border-dashed border-white/10 rounded-2xl p-6 glass-pill"
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
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold glass-pill hover:border-white/20 text-emerald-400 transition-all cursor-pointer"
                >
                  Limpar todos os filtros
                </button>
              )}
            </>
          ) : (
            <>
              <p className="font-medium text-slate-300">
                Nenhuma transação registrada neste período.
              </p>
              <p className="text-xs mt-1 text-slate-500">
                Clique em Nova Transação para registrar a sua primeira movimentação financeira!
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                {onOpenNewTransaction && (
                  <button
                    type="button"
                    onClick={onOpenNewTransaction}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all cursor-pointer shadow-md shadow-emerald-500/20 hover:scale-105"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nova Transação</span>
                  </button>
                )}
                {onOpenOnboarding && (
                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold glass-pill hover:border-white/20 text-emerald-400 transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <Rocket className="w-3.5 h-3.5" />
                    <span>Guia de Início</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <>
          <div data-testid="transaction-list" className="space-y-2.5">
            {paginatedTransactions.map((item) => (
              <TransactionItem
                key={item.id}
                transaction={item}
                onDelete={onDelete}
                onEdit={onEdit}
              />
            ))}
          </div>

          {/* BARRA DE PAGINAÇÃO MODERNA */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/8 text-xs text-zinc-400">
              <span>
                Exibindo{' '}
                <strong className="text-zinc-200">
                  {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, sortedTransactions.length)}
                </strong>{' '}
                de <strong className="text-zinc-200">{sortedTransactions.length}</strong> transações
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  disabled={safeCurrentPage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 glass-pill hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer text-zinc-300 hover:text-white"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>

                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 font-semibold text-emerald-400">
                  {safeCurrentPage} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={safeCurrentPage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 glass-pill hover:border-white/20 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer text-zinc-300 hover:text-white"
                >
                  <span>Próxima</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
