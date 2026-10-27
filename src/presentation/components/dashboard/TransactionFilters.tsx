import { ArrowUpDown, CheckCircle2, Search, SlidersHorizontal, Tag, X } from 'lucide-react'
import { useEffect, useState } from 'react'
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
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  // Atalho de teclado para focar na busca ao pressionar "/" ou "Ctrl+K"
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) {
        return
      }
      if (e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) {
        e.preventDefault()
        const input = document.getElementById('transaction-search-input') as HTMLInputElement | null
        if (input) {
          input.focus()
          input.select()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

  // Contagem de filtros adicionais ativos (situação e categoria)
  const extraFiltersCount =
    (selectedStatus !== 'all' ? 1 : 0) + (selectedCategory !== 'all' ? 1 : 0)

  return (
    <div data-testid="transaction-filters" className="space-y-2 relative">
      {/* BARRA DE FERRAMENTAS UNIFICADA: BUSCA CONTEXTUAL + TIPO + ORDENAÇÃO + FILTROS */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        {/* BUSCA CONTEXTUAL NO EXTRATO (DISCRETA E SEM DUPLICAÇÃO COM O TOPO) */}
        <div className="relative max-w-sm w-full group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10 text-zinc-400 group-focus-within:text-emerald-400 transition-colors">
            <Search className="w-3.5 h-3.5" aria-hidden="true" />
          </div>
          <input
            id="transaction-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por descrição ou categoria..."
            className="w-full h-9 rounded-xl bg-white/3 border border-white/8 pl-8.5 pr-8 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:bg-white/5 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* CONTROLES INTEGRADOS LADO DIREITO */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap justify-end">
          {/* SEGMENTED CONTROL: TODOS / ENTRADAS / SAÍDAS */}
          <div className="h-9 flex items-center p-0.5 rounded-xl bg-white/3 border border-white/8 gap-0.5">
            <button
              type="button"
              onClick={() => handleTypeSelect('all')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'all'
                  ? 'bg-white/12 text-white font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-white hover:bg-white/4'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-emerald-300 hover:bg-white/4'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`px-3 py-1 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 font-medium shadow-xs'
                  : 'text-zinc-400 hover:text-rose-300 hover:bg-white/4'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* SELETOR DE ORDENAÇÃO */}
          {onSortChange && (
            <div className="h-9 flex items-center gap-1.5 px-2.5 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 transition-all text-xs shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" aria-hidden="true" />
              <select
                aria-label="Ordenar transações"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as TransactionSortOption)}
                className="bg-transparent text-zinc-300 text-xs focus:outline-none cursor-pointer pr-1"
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

          {/* BOTÃO DE FILTROS REFINADOS COM POPOVER */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                setIsFiltersOpen((prev) => !prev)
              }}
              aria-label="Filtros avançados"
              aria-expanded={isFiltersOpen}
              className={`h-9 flex items-center gap-1.5 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                isFiltersOpen || extraFiltersCount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/3 border-white/8 text-zinc-300 hover:border-white/15 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-400" />
              <span>Filtros</span>
              {extraFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 text-3xs font-bold flex items-center justify-center">
                  {extraFiltersCount}
                </span>
              )}
            </button>

            {/* BACKDROP DISCRETO PARA FECHAR CLICANDO FORA */}
            {isFiltersOpen && (
              <button
                type="button"
                className="fixed inset-0 z-30 cursor-default bg-transparent w-full h-full border-none"
                onClick={() => setIsFiltersOpen(false)}
                aria-label="Fechar popover"
              />
            )}

            {/* POPOVER FLUTUANTE DE FILTROS */}
            <div
              className={`${
                isFiltersOpen
                  ? 'absolute right-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-2xl border border-white/10 bg-zinc-950/95 backdrop-blur-2xl shadow-xl z-40 animate-in zoom-in-95 duration-150'
                  : 'hidden'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/8">
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  Filtros Refinados
                </span>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/8 transition-colors cursor-pointer"
                  aria-label="Fechar painel de filtros"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 pt-3">
                {/* SITUAÇÃO / STATUS */}
                {onStatusChange && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="status-filter-select"
                      className="text-2xs font-medium text-zinc-400 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Situação do Pagamento
                    </label>
                    <div className="h-9 px-2.5 rounded-xl bg-white/3 border border-white/8 flex items-center">
                      <select
                        id="status-filter-select"
                        aria-label="Filtrar por status"
                        data-testid="status-filter-select"
                        value={selectedStatus}
                        onChange={(e) => {
                          soundFX.playClick()
                          onStatusChange(e.target.value as TransactionStatusFilter)
                        }}
                        className="w-full bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="all" className="bg-zinc-900 text-white">
                          Todas as situações
                        </option>
                        <option value="paid" className="bg-zinc-900 text-white">
                          Pagas / Recebidas
                        </option>
                        <option value="pending" className="bg-zinc-900 text-white">
                          Pendentes
                        </option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CATEGORIA */}
                {onCategoryChange && categories.length > 0 && (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="category-filter-select"
                      className="text-2xs font-medium text-zinc-400 flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3 text-emerald-400" />
                      Categoria
                    </label>
                    <div className="h-9 px-2.5 rounded-xl bg-white/3 border border-white/8 flex items-center">
                      <select
                        id="category-filter-select"
                        aria-label="Filtrar por categoria"
                        value={selectedCategory}
                        onChange={(e) => {
                          soundFX.playClick()
                          onCategoryChange(e.target.value)
                        }}
                        className="w-full bg-transparent text-zinc-200 text-xs focus:outline-none cursor-pointer truncate"
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
                  </div>
                )}

                {/* BOTÃO DE LIMPAR REFINAMENTOS NO POPOVER */}
                {extraFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFX.playClick()
                      onStatusChange?.('all')
                      onCategoryChange?.('all')
                    }}
                    className="w-full py-1.5 rounded-xl bg-white/4 hover:bg-white/8 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
                  >
                    Resetar situação e categoria
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA DE PILLS / CHIPS DE FILTROS ATIVOS (QUANDO HOUVER FILTROS APLICADOS) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/8 animate-fade-in">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs text-zinc-500 font-semibold mr-1 select-none">
              Filtros ativos:
            </span>

            {selectedCategory !== 'all' && onCategoryChange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-2xs font-semibold shadow-xs shadow-emerald-950/20">
                <span>Cat: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => onCategoryChange('all')}
                  className="hover:text-white cursor-pointer ml-0.5 p-0.5 rounded-full hover:bg-emerald-500/30 transition-colors active:scale-90"
                  aria-label={`Remover filtro de categoria ${selectedCategory}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && onStatusChange && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/35 text-cyan-300 text-2xs font-semibold shadow-xs shadow-cyan-950/20">
                <span>Status: {selectedStatus === 'paid' ? 'Pagas/Recebidas' : 'Pendentes'}</span>
                <button
                  type="button"
                  onClick={() => onStatusChange('all')}
                  className="hover:text-white cursor-pointer ml-0.5 p-0.5 rounded-full hover:bg-cyan-500/30 transition-colors active:scale-90"
                  aria-label="Remover filtro de status"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-zinc-200 text-2xs font-semibold shadow-xs">
                <span className="truncate max-w-40">"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-white cursor-pointer ml-0.5 p-0.5 rounded-full hover:bg-white/20 transition-colors active:scale-90"
                  aria-label="Remover filtro de busca"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 text-xs text-zinc-400 shrink-0 ml-auto">
            <span className="text-2xs sm:text-xs">
              Exibindo{' '}
              <strong className="text-white font-mono font-bold">{totalFilteredCount}</strong> de{' '}
              <strong className="text-white font-mono font-bold">{totalPeriodCount}</strong>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/40 text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
