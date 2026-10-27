import { ArrowUpDown, CheckCircle2, Clock, Search, SlidersHorizontal, Tag, X } from 'lucide-react'
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
    <div data-testid="transaction-filters" className="space-y-2.5 pb-1 relative">
      {/* LINHA 1 PRINCIPAL: BUSCA OMNIBAR + SEGMENTED CONTROL + ORDENAÇÃO + BOTÃO DE FILTROS */}
      <div className="flex flex-col lg:flex-row gap-2 items-stretch lg:items-center justify-between">
        {/* BUSCA RÁPIDA OMNIBAR COM ATALHO */}
        <div className="relative flex-1 group min-w-0">
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
            className="w-full h-10 rounded-2xl bg-white/4 border border-white/10 pl-9 pr-12 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/6 focus:ring-1 focus:ring-emerald-500/30 transition-all shadow-xs"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpar busca"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer z-10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center pointer-events-none">
              <kbd className="text-3xs font-mono font-medium px-1.5 py-0.5 rounded border border-white/10 bg-white/5 text-zinc-400">
                /
              </kbd>
            </div>
          )}
        </div>

        {/* CONTROLES INTEGRADOS LADO DIREITO */}
        <div className="flex items-center gap-1.5 self-stretch lg:self-auto shrink-0 flex-wrap sm:flex-nowrap">
          {/* SEGMENTED CONTROL: TODOS / ENTRADAS / SAÍDAS */}
          <div className="flex items-center p-1 rounded-2xl bg-white/4 border border-white/10 shadow-inner overflow-x-auto custom-scrollbar gap-1 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={() => handleTypeSelect('all')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'all'
                  ? 'bg-white/15 text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5 font-medium'
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('income')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'income'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/5'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => handleTypeSelect('expense')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap text-center ${
                selectedType === 'expense'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-rose-400 hover:bg-white/5'
              }`}
            >
              Saídas
            </button>
          </div>

          {/* SELETOR DE ORDENAÇÃO COMPACTO */}
          {onSortChange && (
            <div className="h-10 flex items-center gap-1.5 px-3 rounded-2xl bg-white/4 border border-white/10 hover:border-white/20 transition-all text-xs shadow-xs shrink-0">
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

          {/* BOTÃO UNIFICADO "FILTROS" COM POPOVER */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                setIsFiltersOpen((prev) => !prev)
              }}
              aria-label="Filtros avançados"
              aria-expanded={isFiltersOpen}
              className={`h-10 flex items-center gap-1.5 px-3.5 rounded-2xl border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isFiltersOpen || extraFiltersCount > 0
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20'
                  : 'bg-white/4 border-white/10 text-zinc-300 hover:border-white/20 hover:text-white'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
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
                  ? 'absolute right-0 top-full mt-2 w-72 sm:w-80 p-4 rounded-3xl border border-white/15 bg-zinc-950/95 backdrop-blur-2xl shadow-2xl z-40 animate-in zoom-in-95 duration-150'
                  : 'hidden'
              }`}
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
                <span className="text-xs font-bold text-white tracking-wide uppercase">
                  Filtros Refinados
                </span>
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(false)}
                  className="p-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
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
                      className="text-2xs font-semibold text-zinc-400 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Situação do Pagamento
                    </label>
                    <div className="h-9 px-2.5 rounded-xl bg-white/4 border border-white/10 flex items-center">
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
                      className="text-2xs font-semibold text-zinc-400 flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3 text-emerald-400" />
                      Categoria
                    </label>
                    <div className="h-9 px-2.5 rounded-xl bg-white/4 border border-white/10 flex items-center">
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
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-zinc-300 font-medium transition-colors cursor-pointer"
                  >
                    Resetar situação e categoria
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LINHA 2: FILTROS RÁPIDOS DE STATUS E TAGS DE CATEGORIA (ACESSO COM 1 CLIQUE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
        {/* Pílulas de Status Rápidas */}
        {onStatusChange && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 text-2xs">
            <span className="text-zinc-500 font-semibold shrink-0 mr-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Situação:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onStatusChange('all')
              }}
              className={`px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'all'
                  ? 'bg-white/15 text-white border-white/25 shadow-xs font-bold'
                  : 'bg-white/3 text-zinc-400 hover:text-white border-white/6 hover:bg-white/6'
              }`}
            >
              Todas
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onStatusChange('paid')
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-xs font-bold'
                  : 'bg-white/3 text-zinc-400 hover:text-emerald-400 border-white/6 hover:bg-white/6'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Pagas / Recebidas</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onStatusChange('pending')
              }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl border text-2xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectedStatus === 'pending'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs font-bold'
                  : 'bg-white/3 text-zinc-400 hover:text-amber-400 border-white/6 hover:bg-white/6'
              }`}
            >
              <Clock className="w-2.5 h-2.5 text-amber-400" />
              <span>Pendentes</span>
            </button>
          </div>
        )}

        {/* Carrossel de Categorias Rápidas */}
        {onCategoryChange && categories.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-0.5 text-2xs sm:justify-end">
            <span className="text-zinc-500 font-semibold shrink-0 mr-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-emerald-400" />
              <span>Categorias:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onCategoryChange('all')
              }}
              className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-white/15 text-white border-white/20 font-bold'
                  : 'bg-white/3 text-zinc-400 hover:text-white border-white/6'
              }`}
            >
              Todas
            </button>
            {categories.slice(0, 8).map((cat) => {
              const isSelected = selectedCategory === cat
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    onCategoryChange(isSelected ? 'all' : cat)
                  }}
                  className={`px-2 py-0.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : 'bg-white/3 text-zinc-400 hover:text-zinc-200 border-white/6 hover:bg-white/6'
                  }`}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* LINHA DE PILLS / CHIPS DE FILTROS ATIVOS (QUANDO HOUVER FILTROS APLICADOS) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1.5 border-t border-white/6 animate-fade-in">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-2xs text-zinc-500 font-medium mr-1">Filtros ativos:</span>

            {selectedCategory !== 'all' && onCategoryChange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-2xs font-semibold">
                <span>Cat: {selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => onCategoryChange('all')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  aria-label={`Remover filtro de categoria ${selectedCategory}`}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {selectedStatus !== 'all' && onStatusChange && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-2xs font-semibold">
                <span>Status: {selectedStatus === 'paid' ? 'Pagas/Recebidas' : 'Pendentes'}</span>
                <button
                  type="button"
                  onClick={() => onStatusChange('all')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  aria-label="Remover filtro de status"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-zinc-200 text-2xs font-semibold">
                <span>"{searchQuery}"</span>
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="hover:text-white cursor-pointer ml-0.5"
                  aria-label="Remover filtro de busca"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-zinc-400 shrink-0 ml-auto">
            <span className="text-[11px]">
              Exibindo <strong className="text-white font-semibold">{totalFilteredCount}</strong> de{' '}
              <strong className="text-white font-semibold">{totalPeriodCount}</strong>
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-medium transition-colors cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Limpar filtros</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
