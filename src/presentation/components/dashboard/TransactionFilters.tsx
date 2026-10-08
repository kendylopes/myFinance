import { ArrowUpDown, CheckCircle2, Clock, Search, Tag, X } from 'lucide-react'
import { soundFX } from '../../../core/sound/soundEffects'
import type {
  TransactionFilterType,
  TransactionStatusFilter,
} from '../../../domain/models/transaction'

export type TransactionSortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

export interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedType: TransactionFilterType
  onTypeChange: (type: TransactionFilterType) => void
  selectedStatus?: TransactionStatusFilter
  onStatusChange?: (status: TransactionStatusFilter) => void
  categories?: string[]
  totalFilteredCount: number
  totalPeriodCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
  sortBy?: TransactionSortOption
  onSortChange?: (sort: TransactionSortOption) => void
}

export function TransactionFilters({
  searchQuery,
  onSearchChange,
  selectedCategory = 'all',
  onCategoryChange,
  categories = [],
  selectedType,
  onTypeChange,
  selectedStatus = 'all',
  onStatusChange,
  totalFilteredCount,
  totalPeriodCount,
  hasActiveFilters,
  onClearFilters,
  sortBy = 'date_desc',
  onSortChange,
}: TransactionFiltersProps) {
  const handleTypeSelect = (type: TransactionFilterType) => {
    soundFX.playClick()
    onTypeChange(type)
  }

  const handleClear = () => {
    soundFX.playClick()
    onClearFilters()
  }

  const handleSortChange = (newSort: TransactionSortOption) => {
    soundFX.playClick()
    onSortChange?.(newSort)
  }

  return (
    <div data-testid="transaction-filters" className="space-y-2.5 pb-1">
      {/* LINHA 1: BUSCADOR INTEGRADO + DROPDOWNS COMPACTOS */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        {/* BUSCA RÁPIDA */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 text-emerald-400">
            <Search
              className="w-4 h-4 text-emerald-400/80 group-focus-within:text-emerald-400 transition-colors"
              aria-hidden="true"
            />
          </div>
          <input
            id="transaction-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full h-10 rounded-xl bg-white/[0.04] border border-white/10 pl-9 pr-9 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/[0.06] transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SELECTS DE REFINAMENTO */}
        <div className="flex items-center gap-2 self-stretch sm:self-auto shrink-0">
          {/* SELETOR DE CATEGORIA */}
          {onCategoryChange && categories.length > 0 && (
            <div className="flex-1 sm:flex-initial h-10 flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all text-xs shadow-xs">
              <Tag className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <select
                aria-label="Filtrar por categoria"
                value={selectedCategory}
                onChange={(e) => {
                  soundFX.playClick()
                  onCategoryChange(e.target.value)
                }}
                className="w-full sm:w-auto bg-transparent text-zinc-300 font-medium text-xs focus:outline-none cursor-pointer pr-1 max-w-36 truncate"
              >
                <option value="all" className="bg-zinc-900 text-white">
                  Todas as categorias
                </option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SELETOR DE ORDENAÇÃO */}
          {onSortChange && (
            <div className="flex-1 sm:flex-initial h-10 flex items-center gap-1.5 px-3 rounded-xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all text-xs shadow-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <select
                aria-label="Ordenar transações"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as TransactionSortOption)}
                className="w-full sm:w-auto bg-transparent text-zinc-300 font-medium text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="date_desc" className="bg-zinc-900 text-white">
                  Mais recentes
                </option>
                <option value="date_asc" className="bg-zinc-900 text-white">
                  Mais antigas
                </option>
                <option value="amount_desc" className="bg-zinc-900 text-white">
                  Maior valor
                </option>
                <option value="amount_asc" className="bg-zinc-900 text-white">
                  Menor valor
                </option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* LINHA 2: SEGMENTED CONTROL FLUIDO (TIPO + STATUS EM UMA ÚNICA BARRA HARMONIOSA) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-0.5">
        {/* TRILHO DE ABAS UNIFICADO */}
        <div className="flex items-center p-1 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-inner overflow-x-auto custom-scrollbar gap-1 max-w-full">
          {/* GRUPO DE FLUXO / TIPO */}
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => handleTypeSelect('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedType === 'all'
                  ? 'bg-white/15 text-white shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/5'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-xs font-semibold'
                  : 'text-zinc-400 hover:text-rose-400 hover:bg-white/5'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* DIVISOR VERTICAL SUAVE */}
          {onStatusChange && (
            <div className="h-4 w-px bg-white/10 mx-1 shrink-0" aria-hidden="true" />
          )}

          {/* GRUPO DE SITUAÇÃO / STATUS */}
          {onStatusChange && (
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                data-testid="status-filter-all"
                onClick={() => {
                  soundFX.playClick()
                  onStatusChange('all')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'all'
                    ? 'bg-white/15 text-white shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                data-testid="status-filter-paid"
                onClick={() => {
                  soundFX.playClick()
                  onStatusChange('paid')
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'paid'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Pagas / Recebidas</span>
              </button>
              <button
                type="button"
                data-testid="status-filter-pending"
                onClick={() => {
                  soundFX.playClick()
                  onStatusChange('pending')
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  selectedStatus === 'pending'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-xs font-semibold'
                    : 'text-zinc-400 hover:text-amber-400 hover:bg-white/5'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>Pendentes</span>
              </button>
            </div>
          )}
        </div>

        {/* FEEDBACK DE FILTROS ATIVOS E BOTÃO LIMPAR */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-zinc-400 animate-fade-in shrink-0">
            <span className="text-[11px]">
              Exibindo <strong className="text-white font-semibold">{totalFilteredCount}</strong> de{' '}
              <strong className="text-white font-semibold">{totalPeriodCount}</strong>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
