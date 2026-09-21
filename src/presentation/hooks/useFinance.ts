import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdjacentMonth, getCurrentYearMonth } from '../../core/formatters/date'
import {
  createBudgetRepository,
  createTransactionRepository,
  getActiveDataSource,
} from '../../data/repositories/repositoryFactory'
import type {
  BudgetProgress,
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
  TransactionFilterType,
} from '../../domain/models/transaction'
import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import {
  calculateBudgetProgress,
  calculateSummary,
  filterTransactions,
  filterTransactionsByMonth,
  validateTransactionData,
} from '../../domain/services/financeCalculations'

// Instâncias padrão dos repositórios (Nuvem com Supabase ou Fallback Seguro LocalStorage)
const defaultTransactionRepository = createTransactionRepository()
const defaultBudgetRepository = createBudgetRepository()

export interface UseFinanceReturn {
  transactions: Transaction[]
  periodTransactions: Transaction[]
  filteredTransactions: Transaction[]
  availableCategories: string[]
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
  // Filtros de busca e categoria
  searchQuery: string
  setSearchQuery: (query: string) => void
  selectedCategory: string
  setSelectedCategory: (category: string) => void
  selectedType: TransactionFilterType
  setSelectedType: (type: TransactionFilterType) => void
  clearFilters: () => void
  hasActiveFilters: boolean
  totalFilteredCount: number
  totalPeriodCount: number
  isLoading: boolean
  error: string | null
  dataSource: 'supabase' | 'localStorage'
  addTransaction: (dto: CreateTransactionDTO) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useFinance(
  transactionRepo: ITransactionRepository = defaultTransactionRepository,
  budgetRepo: IBudgetRepository = defaultBudgetRepository,
): UseFinanceReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth())
  const [budgetAmount, setBudgetAmount] = useState<number>(3000)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Estados dos filtros de busca e categoria
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedType, setSelectedType] = useState<TransactionFilterType>('all')

  // Carregamento inicial de dados de transações
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await transactionRepo.getAll()
      setTransactions(data)
    } catch (err) {
      console.error('[useFinance] Falha ao carregar transações:', err)
      setError('Não foi possível carregar os lançamentos financeiros.')
    } finally {
      setIsLoading(false)
    }
  }, [transactionRepo])

  useEffect(() => {
    refresh()
  }, [refresh])

  // Carregamento reativo do orçamento para o mês selecionado
  useEffect(() => {
    let isMounted = true
    budgetRepo.getBudget(selectedMonth).then((amount) => {
      if (isMounted) {
        setBudgetAmount(amount)
      }
    })
    return () => {
      isMounted = false
    }
  }, [selectedMonth, budgetRepo])

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

  // Extração das categorias distintas disponíveis no período/base
  const availableCategories = useMemo<string[]>(() => {
    const set = new Set<string>()
    for (const item of transactions) {
      if (item.category?.trim()) {
        set.add(item.category.trim())
      }
    }
    return Array.from(set).sort()
  }, [transactions])

  // Filtragem reativa das transações com base na busca textual, categoria e tipo
  const filteredTransactions = useMemo<Transaction[]>(() => {
    return filterTransactions(periodTransactions, {
      searchQuery,
      category: selectedCategory,
      type: selectedType,
    })
  }, [periodTransactions, searchQuery, selectedCategory, selectedType])

  // Limpar todos os filtros de busca
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedCategory('all')
    setSelectedType('all')
  }, [])

  const hasActiveFilters =
    searchQuery.trim().length > 0 || selectedCategory !== 'all' || selectedType !== 'all'

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
        await budgetRepo.setBudget(selectedMonth, newAmount)
        setBudgetAmount(newAmount)
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao atualizar orçamento:', err)
        setError('Erro ao salvar novo orçamento.')
        return false
      }
    },
    [selectedMonth, budgetRepo],
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
        const created = await transactionRepo.create(dto)
        setTransactions((prev) => [created, ...prev])
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao criar transação:', err)
        setError('Erro ao salvar movimentação.')
        return false
      }
    },
    [transactionRepo],
  )

  // Deletar transação
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        const success = await transactionRepo.delete(id)
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
    [transactionRepo],
  )

  return {
    transactions,
    periodTransactions,
    filteredTransactions,
    availableCategories,
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
    clearFilters,
    hasActiveFilters,
    totalFilteredCount: filteredTransactions.length,
    totalPeriodCount: periodTransactions.length,
    isLoading,
    error,
    dataSource: getActiveDataSource(),
    addTransaction,
    deleteTransaction,
    refresh,
  }
}
