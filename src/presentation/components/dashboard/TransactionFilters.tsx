import { ArrowUpDown, Search, X } from 'lucide-react'
import { soundFX } from '../../../core/sound/soundEffects'
import type { TransactionFilterType } from '../../../domain/models/transaction'

export type TransactionSortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'

export interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory?: string
  onCategoryChange?: (category: string) => void
  selectedType: TransactionFilterType
  onTypeChange: (type: TransactionFilterType) => void
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
  selectedType,
  onTypeChange,
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
    <div data-testid="transaction-filters" className="space-y-3 pb-1">
      {/* BARRA DE PESQUISA INTELIGENTE + SELETOR DE TIPO + ORDENAÇÃO */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* BUSCADOR TEXTUAL AMPLO (DESCRICÃO OU CATEGORIA) */}
        <div className="relative flex-1 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10 text-emerald-400">
            <Search
              className="w-4 h-4 text-emerald-400 group-focus-within:text-emerald-300 group-focus-within:scale-110 transition-all duration-300 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]"
              aria-hidden="true"
            />
          </div>
          <input
            id="transaction-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full glass-input rounded-2xl pl-10 pr-10 py-2.5 text-sm placeholder:text-zinc-500 focus:border-emerald-500/80 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* CONTROLES: SELETOR DE TIPO + ORDENAÇÃO */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
          {/* SELETOR DE TIPO (SEGMENTED CONTROL) */}
          <div className="flex glass-pill p-1 rounded-2xl shadow-sm border border-white/10">
            <button
              type="button"
              onClick={() => handleTypeSelect('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedType === 'all'
                  ? 'bg-white/15 text-white shadow-sm border border-white/15 font-semibold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-emerald-400'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm font-semibold'
                  : 'text-zinc-400 hover:text-rose-400'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* SELETOR DE ORDENAÇÃO */}
          {onSortChange && (
            <div className="flex items-center gap-1.5 glass-pill px-2.5 py-1.5 rounded-2xl border border-white/10 text-xs shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
              <select
                aria-label="Ordenar transações"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as TransactionSortOption)}
                className="bg-transparent text-zinc-300 font-medium text-xs focus:outline-none cursor-pointer pr-1"
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

      {/* RODAPÉ DO FILTRO: CONTADOR DISCRETO E BOTÃO LIMPAR FILTROS */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-zinc-400 px-1 pt-1 animate-fade-in">
          <span>
            Exibindo <strong className="text-white font-semibold">{totalFilteredCount}</strong> de{' '}
            <strong className="text-white font-semibold">{totalPeriodCount}</strong> transações
          </span>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors cursor-pointer"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}
