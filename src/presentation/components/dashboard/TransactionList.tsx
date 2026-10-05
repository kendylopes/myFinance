import { ChevronLeft, ChevronRight, Layers, Plus, Rocket, Trash2, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../../../core/formatters/currency'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import type {
  FinanceSummary,
  Transaction,
  TransactionFilterType,
  TransactionStatusFilter,
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
  onDuplicate?: (id: string) => void
  onToggleStatus?: (id: string) => void
  onDeleteMultiple?: (ids: string[]) => Promise<boolean>
  onOpenNewTransaction?: () => void
  onOpenOnboarding?: () => void
  // Props de filtro opcionais
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedType?: TransactionFilterType
  onTypeChange?: (type: TransactionFilterType) => void
  selectedStatus?: TransactionStatusFilter
  onStatusChange?: (status: TransactionStatusFilter) => void
  categories?: string[]
  totalFilteredCount?: number
  totalPeriodCount?: number
  hasActiveFilters?: boolean
  onClearFilters?: () => void
  // Props de exportação opcionais
  exportSummary?: FinanceSummary
  selectedMonth?: string
  onOpenImport?: () => void
  onOpenForecastModal?: () => void
}

export const TransactionList = ({
  transactions,
  isLoading,
  onDelete,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDeleteMultiple,
  onOpenNewTransaction,
  onOpenOnboarding,
  onOpenImport,
  onOpenForecastModal,
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedType,
  onTypeChange,
  selectedStatus,
  onStatusChange,
  categories,
  totalFilteredCount,
  totalPeriodCount,
  hasActiveFilters,
  onClearFilters,
  exportSummary,
  selectedMonth,
}: TransactionListProps) => {
  const toast = useToast()
  const showFilters = Boolean(onSearchChange && onCategoryChange && onTypeChange)
  const [sortBy, setSortBy] = useState<TransactionSortOption>('date_desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeletingBulk, setIsDeletingBulk] = useState(false)
  const [showConfirmBulkModal, setShowConfirmBulkModal] = useState(false)

  // Limpar IDs selecionados que não existem mais na lista
  useEffect(() => {
    setSelectedIds((prev) => prev.filter((id) => transactions.some((t) => t.id === id)))
  }, [transactions])

  // Resetar para a primeira página caso os filtros, busca ou lista mudem
  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset intencional ao alterar filtros ou lista
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, selectedCategory, selectedType, selectedStatus, transactions.length])

  // 1. Ordenação estável das transações com critério de desempate
  const sortedTransactions = useMemo(() => {
    const list = [...transactions]
    switch (sortBy) {
      case 'date_desc':
        return list.sort((a, b) => {
          const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
          return diff !== 0 ? diff : b.id.localeCompare(a.id)
        })
      case 'date_asc':
        return list.sort((a, b) => {
          const diff = new Date(a.date).getTime() - new Date(b.date).getTime()
          return diff !== 0 ? diff : a.id.localeCompare(b.id)
        })
      case 'amount_desc':
        return list.sort((a, b) =>
          b.amount !== a.amount ? b.amount - a.amount : b.id.localeCompare(a.id),
        )
      case 'amount_asc':
        return list.sort((a, b) =>
          a.amount !== b.amount ? a.amount - b.amount : a.id.localeCompare(b.id),
        )
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

  // Lógica de seleção individual e em massa
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const isAllPageSelected =
    paginatedTransactions.length > 0 &&
    paginatedTransactions.every((tx) => selectedIds.includes(tx.id))

  const handleToggleSelectAllPage = () => {
    soundFX.playClick()
    if (isAllPageSelected) {
      const pageIds = new Set(paginatedTransactions.map((tx) => tx.id))
      setSelectedIds((prev) => prev.filter((id) => !pageIds.has(id)))
    } else {
      const pageIds = paginatedTransactions.map((tx) => tx.id)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleClearSelection = () => {
    soundFX.playClick()
    setSelectedIds([])
  }

  const handleConfirmDeleteMultiple = async () => {
    if (!onDeleteMultiple || selectedIds.length === 0) return
    setIsDeletingBulk(true)
    const count = selectedIds.length
    const success = await onDeleteMultiple(selectedIds)
    setIsDeletingBulk(false)
    if (success) {
      soundFX.playSuccess()
      toast.info(
        'Transações excluídas',
        `${count} ${count === 1 ? 'movimentação foi removida' : 'movimentações foram removidas'}.`,
      )
      setSelectedIds([])
      setShowConfirmBulkModal(false)
    }
  }

  const selectedTransactions = useMemo(() => {
    return transactions.filter((tx) => selectedIds.includes(tx.id))
  }, [transactions, selectedIds])

  const selectedNetTotal = useMemo(() => {
    return selectedTransactions.reduce((acc, tx) => {
      return tx.type === 'income' ? acc + tx.amount : acc - tx.amount
    }, 0)
  }, [selectedTransactions])

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
            onOpenImport={onOpenImport}
            onOpenForecastModal={onOpenForecastModal}
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
          selectedStatus={selectedStatus || 'all'}
          onStatusChange={onStatusChange}
          categories={categories || []}
          totalFilteredCount={totalFilteredCount ?? transactions.length}
          totalPeriodCount={totalPeriodCount ?? transactions.length}
          hasActiveFilters={Boolean(hasActiveFilters)}
          onClearFilters={onClearFilters}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {/* BARRA DE AÇÕES EM MASSA (QUANDO HOUVER ITENS SELECIONADOS) */}
      {selectedIds.length > 0 && (
        <div
          data-testid="bulk-action-bar"
          className="p-3.5 sm:p-4 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/30 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-emerald-950/20 animate-fadeIn"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <div>
              <p className="text-sm font-bold text-white">
                {selectedIds.length}{' '}
                {selectedIds.length === 1 ? 'transação selecionada' : 'transações selecionadas'}
              </p>
              <p className="text-xs text-zinc-400">
                Impacto líquido no período:{' '}
                <strong className={selectedNetTotal >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                  {selectedNetTotal >= 0 ? '+' : ''}
                  {formatCurrency(selectedNetTotal)}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleClearSelection}
              className="px-3 py-1.5 rounded-xl border border-white/10 glass-pill text-xs font-medium text-zinc-300 hover:text-white hover:border-white/25 transition cursor-pointer"
            >
              Desmarcar todas
            </button>

            {onDeleteMultiple && (
              <button
                type="button"
                data-testid="bulk-delete-btn"
                onClick={() => {
                  soundFX.playClick()
                  setShowConfirmBulkModal(true)
                }}
                disabled={isDeletingBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 hover:border-rose-500/60 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir {selectedIds.length}</span>
              </button>
            )}
          </div>
        </div>
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
                {onOpenImport && (
                  <button
                    type="button"
                    onClick={onOpenImport}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold glass-pill hover:border-white/20 text-cyan-300 transition-all cursor-pointer shadow-sm hover:scale-105"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Importar Extrato</span>
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
          {/* SELETOR EM MASSA DA PÁGINA */}
          {onDeleteMultiple && (
            <div className="flex items-center justify-between px-1 text-xs text-zinc-400">
              <label className="flex items-center gap-2 cursor-pointer hover:text-zinc-200 transition-colors select-none">
                <input
                  type="checkbox"
                  checked={isAllPageSelected}
                  onChange={handleToggleSelectAllPage}
                  data-testid="select-all-page-checkbox"
                  className="w-4 h-4 rounded-md border border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/30 transition cursor-pointer accent-emerald-500"
                />
                <span>Selecionar todos desta página ({paginatedTransactions.length})</span>
              </label>
              {selectedIds.length > 0 && (
                <span className="text-[11px] text-emerald-400 font-medium">
                  {selectedIds.length} marcado(s)
                </span>
              )}
            </div>
          )}

          <div data-testid="transaction-list" className="space-y-2.5">
            {paginatedTransactions.map((item) => (
              <TransactionItem
                key={item.id}
                transaction={item}
                onDelete={onDelete}
                onEdit={onEdit}
                onDuplicate={onDuplicate ? () => onDuplicate(item.id) : undefined}
                onToggleStatus={onToggleStatus}
                isSelected={selectedIds.includes(item.id)}
                onToggleSelect={onDeleteMultiple ? handleToggleSelect : undefined}
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO EM MASSA */}
      {showConfirmBulkModal && (
        <div
          role="alertdialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn"
        >
          <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-rose-500/30 bg-zinc-900/95 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Excluir Transações Selecionadas</h3>
                <p className="text-xs text-zinc-400">Esta ação não poderá ser desfeita.</p>
              </div>
            </div>

            <p className="text-sm text-zinc-300">
              Você tem certeza que deseja remover permanentemente{' '}
              <strong className="text-white">{selectedIds.length}</strong>{' '}
              {selectedIds.length === 1 ? 'movimentação' : 'movimentações'}?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={isDeletingBulk}
                onClick={() => setShowConfirmBulkModal(false)}
                className="px-4 py-2 rounded-xl border border-white/10 glass-pill text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="confirm-bulk-delete-btn"
                disabled={isDeletingBulk}
                onClick={handleConfirmDeleteMultiple}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/40 cursor-pointer disabled:opacity-50"
              >
                {isDeletingBulk ? 'Excluindo...' : `Sim, excluir ${selectedIds.length}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
