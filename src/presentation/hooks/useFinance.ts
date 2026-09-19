import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAdjacentMonth, getCurrentYearMonth } from '../../core/formatters/date'
import { LocalStorageTransactionRepository } from '../../data/repositories/LocalStorageTransactionRepository'
import type {
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
} from '../../domain/models/transaction'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import {
  calculateSummary,
  filterTransactionsByMonth,
  validateTransactionData,
} from '../../domain/services/financeCalculations'

// Instância padrão do repositório
const defaultRepository = new LocalStorageTransactionRepository()

export interface UseFinanceReturn {
  transactions: Transaction[]
  filteredTransactions: Transaction[]
  summary: FinanceSummary
  globalSummary: FinanceSummary
  selectedMonth: string
  setSelectedMonth: (month: string) => void
  goToPreviousMonth: () => void
  goToNextMonth: () => void
  goToCurrentMonth: () => void
  isLoading: boolean
  error: string | null
  addTransaction: (dto: CreateTransactionDTO) => Promise<boolean>
  deleteTransaction: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useFinance(
  repository: ITransactionRepository = defaultRepository,
): UseFinanceReturn {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth())
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Carregamento inicial de dados
  const refresh = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await repository.getAll()
      setTransactions(data)
    } catch (err) {
      console.error('[useFinance] Falha ao carregar transações:', err)
      setError('Não foi possível carregar os lançamentos financeiros.')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    refresh()
  }, [refresh])

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

  // Filtragem reativa por mês selecionado
  const filteredTransactions = useMemo<Transaction[]>(() => {
    return filterTransactionsByMonth(transactions, selectedMonth)
  }, [transactions, selectedMonth])

  // Cálculo memorizado de métricas financeiras do período selecionado
  const summary = useMemo<FinanceSummary>(() => {
    return calculateSummary(filteredTransactions)
  }, [filteredTransactions])

  // Resumo global de todos os períodos
  const globalSummary = useMemo<FinanceSummary>(() => {
    return calculateSummary(transactions)
  }, [transactions])

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
        const created = await repository.create(dto)
        setTransactions((prev) => [created, ...prev])
        return true
      } catch (err) {
        console.error('[useFinance] Falha ao criar transação:', err)
        setError('Erro ao salvar movimentação.')
        return false
      }
    },
    [repository],
  )

  // Deletar transação
  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        setError(null)
        const success = await repository.delete(id)
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
    [repository],
  )

  return {
    transactions,
    filteredTransactions,
    summary,
    globalSummary,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
    refresh,
  }
}
