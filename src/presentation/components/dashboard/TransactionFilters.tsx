import { soundFX } from '../../../core/sound/soundEffects'
import type { TransactionFilterType } from '../../../domain/models/transaction'

export interface TransactionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  selectedType: TransactionFilterType
  onTypeChange: (type: TransactionFilterType) => void
  categories: string[]
  totalFilteredCount: number
  totalPeriodCount: number
  hasActiveFilters: boolean
  onClearFilters: () => void
}

export function TransactionFilters({
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
}: TransactionFiltersProps) {
  const handleTypeSelect = (type: TransactionFilterType) => {
    soundFX.playClick()
    onTypeChange(type)
  }

  const handleCategorySelect = (category: string) => {
    soundFX.playClick()
    onCategoryChange(category)
  }

  const handleClear = () => {
    soundFX.playClick()
    onClearFilters()
  }

  return (
    <div
      data-testid="transaction-filters"
      className="glass-pill rounded-3xl p-5 shadow-lg space-y-4 mb-6"
    >
      {/* LINHA SUPERIOR: BARRA DE PESQUISA + SELETOR DE TIPO */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* INPUT DE BUSCA TEXTUAL */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </div>
          <input
            id="transaction-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full glass-input rounded-2xl pl-10 pr-10 py-2.5 text-sm placeholder:text-zinc-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* SELETOR DE TIPO (TODOS / ENTRADAS / SAÍDAS) */}
        <div className="flex glass-pill p-1 rounded-2xl self-start sm:self-auto shrink-0 shadow-sm">
          <button
            type="button"
            onClick={() => handleTypeSelect('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
              selectedType === 'all'
                ? 'bg-white/10 text-white shadow-sm border border-white/15'
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
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
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
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            Saídas
          </button>
        </div>
      </div>

      {/* LINHA INFERIOR: CHIPS DE CATEGORIA */}
      <div className="pt-2 border-t border-white/8">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-white text-zinc-950 font-semibold shadow-md'
                : 'glass-pill text-zinc-300 hover:text-white hover:border-white/20'
            }`}
          >
            Todas
          </button>

          {categories.map((category) => {
            const isSelected = selectedCategory === category
            return (
              <button
                key={category}
                type="button"
                onClick={() => handleCategorySelect(category)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500 text-zinc-950 font-semibold shadow-md shadow-emerald-500/25'
                    : 'glass-pill text-zinc-300 hover:text-white hover:border-white/20'
                }`}
              >
                {category}
              </button>
            )
          })}
        </div>
      </div>

      {/* RODAPÉ DO FILTRO: CONTADOR E BOTÃO LIMPAR FILTROS */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-zinc-400 pt-2 border-t border-white/8">
          <span>
            Exibindo <strong className="text-white">{totalFilteredCount}</strong> de{' '}
            <strong className="text-white">{totalPeriodCount}</strong> movimentações
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
