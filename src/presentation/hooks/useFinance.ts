import { useCallback, useEffect, useMemo, useState } from 'react'
import { LocalStorageTransactionRepository } from '../../data/repositories/LocalStorageTransactionRepository'
import type {
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
} from '../../domain/models/transaction'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import {
  calculateSummary,
  validateTransactionData,
} from '../../domain/services/financeCalculations'

// Instância padrão do repositório
const defaultRepository = new LocalStorageTransactionRepository()

export interface UseFinanceReturn {
  transactions: Transaction[]
  summary: FinanceSummary
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

  // Cálculo memorizado de métricas financeiras (Alta performance, sem re-cálculos à toa)
  const summary = useMemo<FinanceSummary>(() => {
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
    summary,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
    refresh,
  }
}
