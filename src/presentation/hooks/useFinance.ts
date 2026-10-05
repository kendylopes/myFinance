import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../../core/auth/authService'
import { getAdjacentMonth, getCurrentYearMonth } from '../../core/formatters/date'
import {
  createBudgetRepository,
  createCategoryRepository,
  createTransactionRepository,
} from '../../data/repositories/repositoryFactory'
import type { Category, CreateCategoryDTO } from '../../domain/models/categories'
import type {
  BudgetProgress,
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
  TransactionFilterType,
  TransactionStatusFilter,
} from '../../domain/models/transaction'
import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import {
  calculateBudgetProgress,
  calculateSummary,
  filterTransactions,
  filterTransactionsByMonth,
  generateRecurrenceTransactions,
  togglePaymentStatus,
  validateTransactionData,
} from '../../domain/services/financeCalculations'

export interface UseFinanceReturn {
  transactions: Transaction[]
  periodTransactions: Transaction[]
  filteredTransactions: Transaction[]
  availableCategories: string[]
  categories: Category[]
  addCategory: (dto: CreateCategoryDTO) => Promise<Category | null>
  deleteCategory: (id: string) => Promise<boolean>
  summary: FinanceSummary
  globalSummary: FinanceSummary
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
  budgetAmount: number
  budgetProgress: BudgetProgress
  updateBudget: (newAmount: number) => Promise<boolean>
  // Filtros de busca, categoria e status
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedType: TransactionFilterType
  setSelectedType: (type: TransactionFilterType) => void
  selectedStatus: TransactionStatusFilter
  setSelectedStatus: (status: TransactionStatusFilter) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  totalFilteredCount: number
  totalPeriodCount: number
  isLoading: boolean
  error: string | null
  dataSource: 'supabase'
  addTransaction: (dto: CreateTransactionDTO) => Promise<boolean>
  duplicateTransaction: (id: string) => Promise<boolean>
  editTransaction: (id: string, dto: Partial<CreateTransactionDTO>) => Promise<boolean>
  toggleTransactionStatus: (id: string) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  deleteMultipleTransactions: (ids: string[]) => Promise<boolean>
  importTransactions: (dtos: CreateTransactionDTO[]) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useFinance(
  customTransactionRepo?: ITransactionRepository,
  customBudgetRepo?: IBudgetRepository,
  user?: AuthUser | null,
  customCategoryRepo?: ICategoryRepository,
): UseFinanceReturn {
  const activeTransactionRepo = useMemo(() => {
    return customTransactionRepo || createTransactionRepository()
  }, [customTransactionRepo])

  const activeBudgetRepo = useMemo(() => {
    return customBudgetRepo || createBudgetRepository()
  }, [customBudgetRepo])

  const activeCategoryRepo = useMemo(() => {
    return customCategoryRepo || createCategoryRepository()
  }, [customCategoryRepo])

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth())
  const [budgetAmount, setBudgetAmount] = useState<number>(3000)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Estados dos filtros de busca, categoria e status de pagamento
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<TransactionFilterType>('all')
  const [selectedStatus, setSelectedStatus] = useState<TransactionStatusFilter>('all')

  // Carregamento de categorias personalizadas
  const refreshCategories = useCallback(async () => {
    try {
      const data = await activeCategoryRepo.getAll()
      setCategories(data)
    } catch (err) {
      console.error('[useFinance] Falha ao carregar categorias:', err)
    }
  }, [activeCategoryRepo])

  // Carregamento de dados de transações do repositório ativo
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [transData] = await Promise.all([activeTransactionRepo.getAll(), refreshCategories()])
      setTransactions(transData)
    } catch (err) {
      console.error('[useFinance] Falha ao carregar transações:', err)
      setError('Não foi possível carregar as transações financeiras.')
    } finally {
      setIsLoading(false)
    }
  }, [activeTransactionRepo, refreshCategories])

  useEffect(() => {
    if (user === null) {
      setTransactions([])
      setCategories([])
    }
    refresh()
  }, [refresh, user])

  // Carregamento reativo do orçamento para o mês selecionado
  useEffect(() => {
    let isMounted = true
    if (user !== undefined) {
      activeBudgetRepo.getBudget(selectedMonth).then((amount) => {
        if (isMounted) {
          setBudgetAmount(amount)
        }
      })
    }
    return () => {
      isMounted = false
    }
  }, [selectedMonth, activeBudgetRepo, user])

  // Navegação de Meses
  const goToPreviousMonth = useCallback(() => {
    setSelectedMonth((curr) =>
      curr === 'all' ? getCurrentYearMonth() : getAdjacentMonth(curr, -1),
    )
  }, [])

  const goToNextMonth = useCallback(() => {
    setSelectedMonth((curr) => (curr === 'all' ? getCurrentYearMonth() : getAdjacentMonth(curr, 1)))
  }, [])

  const goToCurrentMonth = useCallback(() => {
    setSelectedMonth(getCurrentYearMonth())
  }, [])

  // Filtragem temporal das transações pelo mês selecionado
  const periodTransactions = useMemo<Transaction[]>(() => {
    return filterTransactionsByMonth(transactions, selectedMonth)
  }, [transactions, selectedMonth])

  // Extração das categorias distintas disponíveis no período/base e cadastradas
  const availableCategories = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const item of transactions) {
      if (item.category?.trim()) {
        set.add(item.category.trim())
      }
    }
    for (const cat of categories) {
      if (cat.name?.trim()) {
        set.add(cat.name.trim())
      }
    }
    return Array.from(set).sort()
  }, [transactions, categories])

  // Filtragem reativa das transações com base na busca textual, categoria, tipo e status
  const filteredTransactions = useMemo<Transaction[]>(() => {
    return filterTransactions(periodTransactions, {
      searchQuery,
      category: selectedCategory,
      type: selectedType,
      status: selectedStatus,
    })
  }, [periodTransactions, searchQuery, selectedCategory, selectedType, selectedStatus])

  // Limpar todos os filtros de busca
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedType('all')
    setSelectedStatus('all')
  }, [])

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    selectedCategory !== 'all' ||
    selectedType !== 'all' ||
    selectedStatus !== 'all'

  // Cálculo memorizado de métricas financeiras do período selecionado
  const summary = useMemo<FinanceSummary>(() => {
    return calculateSummary(periodTransactions)
  }, [periodTransactions])

  // Resumo global de todos os períodos
  const globalSummary = useMemo<FinanceSummary>(() => {
    return calculateSummary(transactions)
  }, [transactions])

  // Cálculo memorizado do progresso do orçamento mensal
  const budgetProgress = useMemo<BudgetProgress>(() => {
    return calculateBudgetProgress(summary.totalExpense, budgetAmount)
  }, [summary.totalExpense, budgetAmount])

  // Atualizar orçamento mensal
  const updateBudget = useCallback(
    async (newAmount: number): Promise<boolean> => {
      if (Number.isNaN(newAmount) || newAmount < 0) {
        setError('O teto orçamentário deve ser um valor válido e positivo.')
        return false
      }

      try {
        setError(null)
        await activeBudgetRepo.setBudget(selectedMonth, newAmount)
        setBudgetAmount(newAmount)
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao atualizar orçamento:', err)
        setError('Erro ao salvar novo orçamento.')
        return false
      }
    },
    [selectedMonth, activeBudgetRepo],
  )

  // Adicionar transação com validação de domínio prévia
  const addTransaction = useCallback(
    async (dto: CreateTransactionDTO): Promise<boolean> => {
      const validation = validateTransactionData(dto)
      if (!validation.isValid) {
        setError(validation.error || 'Dados inválidos.')
        return false
      }

      try {
        setError(null)
        const dtosToCreate = generateRecurrenceTransactions(dto)

        if (dtosToCreate.length > 1) {
          const createdList = activeTransactionRepo.createMany
            ? await activeTransactionRepo.createMany(dtosToCreate)
            : await Promise.all(dtosToCreate.map((d) => activeTransactionRepo.create(d)))

          setTransactions((prev) => [...createdList, ...prev])
          return true
        }

        const created = await activeTransactionRepo.create(dtosToCreate[0] || dto)
        setTransactions((prev) => [created, ...prev])
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao criar transação:', err)
        setError('Erro ao salvar movimentação.')
        return false
      }
    },
    [activeTransactionRepo],
  )

  // Deletar transação
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        const success = await activeTransactionRepo.delete(id)
        if (success) {
          setTransactions((prev) => prev.filter((item) => item.id !== id))
        }
        return success
      } catch (err) {
        console.error('[useFinance] Falha ao excluir transação:', err)
        setError('Erro ao excluir movimentação.')
        return false
      }
    },
    [activeTransactionRepo],
  )

  // Excluir múltiplas transações (Exclusão em Massa)
  const deleteMultipleTransactions = useCallback(
    async (ids: string[]): Promise<boolean> => {
      if (ids.length === 0) return true
      try {
        setError(null)
        await Promise.all(ids.map((id) => activeTransactionRepo.delete(id)))
        setTransactions((prev) => prev.filter((item) => !ids.includes(item.id)))
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao excluir transações em massa:', err)
        setError('Erro ao excluir as movimentações selecionadas.')
        return false
      }
    },
    [activeTransactionRepo],
  )

  // Importar múltiplas transações (ex: de extrato bancário OFX/CSV)
  const importTransactions = useCallback(
    async (dtos: CreateTransactionDTO[]): Promise<boolean> => {
      if (dtos.length === 0) return true
      try {
        setError(null)
        const createdList = activeTransactionRepo.createMany
          ? await activeTransactionRepo.createMany(dtos)
          : await Promise.all(dtos.map((d) => activeTransactionRepo.create(d)))

        setTransactions((prev) => [...createdList, ...prev])
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao importar transações:', err)
        setError('Erro ao importar movimentações do extrato.')
        return false
      }
    },
    [activeTransactionRepo],
  )

  // Duplicar transação existente com 1 clique
  const duplicateTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      const target = transactions.find((item) => item.id === id)
      if (!target) {
        setError('Transação não encontrada para duplicação.')
        return false
      }

      const dto: CreateTransactionDTO = {
        title: target.title,
        amount: target.amount,
        type: target.type,
        category: target.category,
        date: target.date,
        status: target.status,
      }

      return addTransaction(dto)
    },
    [transactions, addTransaction],
  )

  // Atualizar transação existente
  const editTransaction = useCallback(
    async (id: string, dto: Partial<CreateTransactionDTO>): Promise<boolean> => {
      try {
        setError(null)
        const updated = await activeTransactionRepo.update(id, dto)
        setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)))
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao atualizar transação:', err)
        setError('Erro ao salvar as alterações da transação.')
        return false
      }
    },
    [activeTransactionRepo],
  )

  // Alternar status de pagamento com atualização otimista imediata na UI
  const toggleTransactionStatus = useCallback(
    async (id: string): Promise<boolean> => {
      const target = transactions.find((item) => item.id === id)
      if (!target) {
        setError('Transação não encontrada para alteração de status.')
        return false
      }

      const newStatus = togglePaymentStatus(target.status)

      // Atualização otimista
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))

      try {
        setError(null)
        await activeTransactionRepo.update(id, { status: newStatus })
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao alternar status da transação:', err)
        // Rollback otimista
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: target.status } : t)),
        )
        setError('Erro ao atualizar status de pagamento.')
        return false
      }
    },
    [transactions, activeTransactionRepo],
  )

  // Adicionar categoria personalizada
  const addCategory = useCallback(
    async (dto: CreateCategoryDTO): Promise<Category | null> => {
      try {
        setError(null)
        const created = await activeCategoryRepo.create(dto)
        setCategories((prev) => {
          const exists = prev.some((c) => c.id === created.id)
          return exists ? prev : [...prev, created]
        })
        return created
      } catch (err) {
        console.error('[useFinance] Falha ao criar categoria:', err)
        setError('Erro ao salvar categoria personalizada.')
        return null
      }
    },
    [activeCategoryRepo],
  )

  // Deletar categoria personalizada
  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        await activeCategoryRepo.delete(id)
        setCategories((prev) => prev.filter((item) => item.id !== id))
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao excluir categoria:', err)
        setError('Erro ao excluir categoria personalizada.')
        return false
      }
    },
    [activeCategoryRepo],
  )

  return {
    transactions,
    periodTransactions,
    filteredTransactions,
    availableCategories,
    categories,
    addCategory,
    deleteCategory,
    summary,
    globalSummary,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    budgetAmount,
    budgetProgress,
    updateBudget,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    clearFilters,
    hasActiveFilters,
    totalFilteredCount: filteredTransactions.length,
    totalPeriodCount: periodTransactions.length,
    isLoading,
    error,
    dataSource: 'supabase',
    addTransaction,
    duplicateTransaction,
    editTransaction,
    toggleTransactionStatus,
    deleteTransaction,
    deleteMultipleTransactions,
    importTransactions,
    refresh,
  }
}
