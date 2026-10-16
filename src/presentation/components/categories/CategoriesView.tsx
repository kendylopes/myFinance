import {
  FolderTree,
  PieChart,
  Plus,
  Search,
  Sparkles,
  Tag,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { useToast } from '../../../core/toast/toastContext'
import type { Category, CreateCategoryDTO } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'
import { ExpenseCategoryChart } from '../dashboard/ExpenseCategoryChart'
import { CategoryAnalysisGrid } from './CategoryAnalysisGrid'
import { CategoryCreateModal } from './CategoryCreateModal'
import { CategorySummaryCards } from './CategorySummaryCards'
import { getCategoryIcon } from './categoryIcons'

export interface CategoriesViewProps {
  transactions: Transaction[]
  periodTransactions: Transaction[]
  categories: Category[]
  onAddCategory: (dto: CreateCategoryDTO) => Promise<Category | null>
  onDeleteCategory: (id: string) => Promise<boolean>
  onSelectCategory?: (category: string) => void
}

export function CategoriesView({
  transactions,
  periodTransactions,
  categories,
  onAddCategory,
  onDeleteCategory,
  onSelectCategory,
}: CategoriesViewProps) {
  const { currentTheme } = useTheme()
  const toast = useToast()

  const [activeTab, setActiveTab] = useState<'analysis' | 'manage'>('manage')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income' | 'custom'>('all')
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mapa de contagem de transações por categoria
  const usageCountMap = useMemo(() => {
    const map: Record<string, number> = {}
    for (const tx of transactions) {
      if (tx.category) {
        map[tx.category.toLowerCase()] = (map[tx.category.toLowerCase()] || 0) + 1
      }
    }
    return map
  }, [transactions])

  // Contagens para os filtros
  const counts = useMemo(() => {
    const expenseCount = categories.filter((c) => c.type === 'expense').length
    const incomeCount = categories.filter((c) => c.type === 'income').length
    const customCount = categories.filter((c) => c.isCustom).length
    return {
      all: categories.length,
      expense: expenseCount,
      income: incomeCount,
      custom: customCount,
    }
  }, [categories])

  // Categorias filtradas por busca e tipo
  const filteredCategories = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase()

    return categories.filter((c) => {
      const matchesSearch =
        !searchLower ||
        c.name.toLowerCase().includes(searchLower) ||
        c.type.toLowerCase().includes(searchLower)

      if (!matchesSearch) return false

      if (filterType === 'expense') return c.type === 'expense'
      if (filterType === 'income') return c.type === 'income'
      if (filterType === 'custom') return Boolean(c.isCustom)

      return true
    })
  }, [categories, searchQuery, filterType])

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return

    setIsDeleting(true)
    try {
      const success = await onDeleteCategory(categoryToDelete.id)
      if (success) {
        soundFX.playSuccess()
        toast.success(
          'Categoria Removida',
          `A categoria "${categoryToDelete.name}" foi excluída com sucesso.`,
        )
      } else {
        toast.error('Erro ao excluir', 'Não foi possível remover a categoria.')
      }
    } catch {
      toast.error('Erro ao excluir', 'Ocorreu uma falha ao remover a categoria.')
    } finally {
      setIsDeleting(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in" id="section-categories">
      {/* 1. CARDS ANALÍTICOS DE KPI DE CATEGORIAS */}
      <CategorySummaryCards transactions={periodTransactions} />

      {/* 2. SELETOR DE ABAS & BOTÃO DE AÇÃO PRIMÁRIO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Abas Segmentadas Canônicas */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/10 w-fit shadow-inner">
          <button
            type="button"
            data-testid="tab-manage-categories"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('manage')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            <span>Gerenciar Categorias ({categories.length})</span>
          </button>

          <button
            type="button"
            data-testid="tab-analysis-categories"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('analysis')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'analysis'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>Distribuição & Métricas</span>
          </button>
        </div>

        {/* Botão de Nova Categoria Estilizado com Tema */}
        <button
          type="button"
          data-testid="btn-open-create-category"
          onClick={() => {
            soundFX.playClick()
            setIsCreateModalOpen(true)
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
          style={{
            backgroundColor: currentTheme.primaryColor,
            boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      {/* 3. CONTEÚDO DA ABA SELECIONADA */}
      {activeTab === 'analysis' ? (
        /* ABA 1: DISTRIBUIÇÃO & MÉTRICAS (Gráfico + Tabela Detalhada) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-5 space-y-6 min-w-0">
            <ExpenseCategoryChart transactions={periodTransactions} />
          </div>

          <div className="xl:col-span-7 space-y-6 min-w-0">
            <div className="glass-card p-5 sm:p-6 rounded-3xl shadow-xl">
              <CategoryAnalysisGrid
                transactions={periodTransactions}
                onSelectCategory={onSelectCategory}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ABA 2: GERENCIADOR COMPLETO DE CATEGORIAS */
        <div className="space-y-5">
          {/* Barra de Filtros e Busca de Categorias */}
          <div className="glass-card p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Input de Busca */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                data-testid="input-search-categories"
                type="text"
                placeholder="Buscar categoria por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input rounded-xl pl-10 pr-3.5 py-2 text-xs placeholder:text-zinc-500 border-white/10 focus:border-emerald-500 text-white"
              />
            </div>

            {/* Pílulas de Filtro de Tipo */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterType('all')
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer ${
                  filterType === 'all'
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                Todas ({counts.all})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterType('expense')
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Despesas ({counts.expense})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterType('income')
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Receitas ({counts.income})</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterType('custom')
                }}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  filterType === 'custom'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Criadas por Mim ({counts.custom})</span>
              </button>
            </div>
          </div>

          {/* Grid de Cards de Categorias */}
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredCategories.map((cat) => {
                const IconComponent = getCategoryIcon(cat.icon || cat.name)
                const usage = usageCountMap[cat.name.toLowerCase()] || 0
                const isExpense = cat.type === 'expense'

                return (
                  <div
                    key={cat.id}
                    data-testid={`category-card-${cat.id}`}
                    className="glass-card p-4 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group space-y-3"
                  >
                    {/* Topo do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`p-2.5 rounded-2xl border flex items-center justify-center ${
                          isExpense
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Badge de Tipo */}
                        <span
                          className={`px-2 py-0.5 rounded-lg text-2xs font-bold border ${
                            isExpense
                              ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                          }`}
                        >
                          {isExpense ? 'Despesa' : 'Receita'}
                        </span>

                        {/* Badge de Origem */}
                        {cat.isCustom ? (
                          <span className="px-2 py-0.5 rounded-lg text-2xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            <span>Minha</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-2xs font-medium bg-white/5 text-zinc-400 border border-white/10">
                            Padrão
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Centro do Card: Nome e Uso */}
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
                        {cat.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {usage > 0
                          ? `${usage} ${usage === 1 ? 'lançamento registrado' : 'lançamentos registrados'}`
                          : 'Nenhum lançamento vinculado'}
                      </p>
                    </div>

                    {/* Rodapé do Card: Ação */}
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                      {cat.isCustom ? (
                        <button
                          type="button"
                          data-testid={`btn-delete-category-${cat.id}`}
                          onClick={() => {
                            soundFX.playClick()
                            setCategoryToDelete(cat)
                          }}
                          className="inline-flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1 rounded-xl transition-all cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Excluir</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-zinc-500 italic">
                          Sistema (Integrada)
                        </span>
                      )}

                      {onSelectCategory && (
                        <button
                          type="button"
                          onClick={() => onSelectCategory(cat.name)}
                          className="text-[11px] text-zinc-400 hover:text-white transition-colors cursor-pointer"
                        >
                          Filtrar transações →
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Estado Vazio */
            <div className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-zinc-400">
                <Tag className="w-6 h-6" />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-white">
                Nenhuma categoria encontrada
              </h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                Não localizamos nenhuma categoria com os filtros aplicados. Crie uma nova categoria
                personalizada ou ajuste sua busca.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setFilterType('all')
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
              >
                Limpar Filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO DE NOVA CATEGORIA */}
      {isCreateModalOpen && (
        <CategoryCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          existingCategories={categories}
          onAddCategory={onAddCategory}
        />
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {categoryToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <button
            type="button"
            aria-label="Cancelar exclusão e fechar modal"
            className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-fade-in w-full h-full cursor-default"
            onClick={() => setCategoryToDelete(null)}
          />
          <div className="relative z-10 max-w-sm w-full glass-card border border-rose-500/30 p-5 rounded-3xl space-y-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Excluir Categoria?</h3>
                <p className="text-xs text-zinc-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300">
              Tem certeza que deseja remover a categoria{' '}
              <strong className="text-white font-semibold">"{categoryToDelete.name}"</strong>? Suas
              transações antigas ainda manterão o registro do nome.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                data-testid="btn-confirm-delete-category"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-400 text-zinc-950 transition-all cursor-pointer shadow-lg shadow-rose-500/20 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
