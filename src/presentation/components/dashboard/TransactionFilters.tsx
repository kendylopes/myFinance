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
  return (
    <div
      data-testid="transaction-filters"
      className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 shadow-lg space-y-4 mb-6"
    >
      {/* LINHA SUPERIOR: BARRA DE PESQUISA + SELETOR DE TIPO */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* INPUT DE BUSCA TEXTUAL */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg
              className="w-4 h-4"
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
            className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
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
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800/80 self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => onTypeChange('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('income')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            Entradas
          </button>
          <button
            type="button"
            onClick={() => onTypeChange('expense')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedType === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-400'
            }`}
          >
            Saídas
          </button>
        </div>
      </div>

      {/* LINHA INFERIOR: CHIPS DE CATEGORIA */}
      <div className="pt-2 border-t border-slate-800/40">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            type="button"
            onClick={() => onCategoryChange('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-slate-100 text-slate-900 font-semibold shadow-md'
                : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/50'
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
                onClick={() => onCategoryChange(category)}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-slate-950 font-semibold shadow-md shadow-emerald-500/20'
                    : 'bg-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-700/60 border border-slate-700/50'
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
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/40">
          <span>
            Exibindo <strong className="text-slate-200">{totalFilteredCount}</strong> de{' '}
            <strong className="text-slate-200">{totalPeriodCount}</strong> movimentações
          </span>

          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium hover:underline transition-colors"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </div>
  )
}
