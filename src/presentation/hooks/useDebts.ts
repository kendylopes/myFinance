import { useCallback, useEffect, useMemo, useState } from 'react'
import { createDebtRepository } from '../../data/repositories/repositoryFactory'
import type {
  CreateDebtDTO,
  Debt,
  DebtPayment,
  RecordDebtPaymentDTO,
} from '../../domain/models/debt'
import type { CreateTransactionDTO } from '../../domain/models/transaction'

const PRIVACY_MODE_STORAGE_KEY = '@myFinance:debts:privacyMode'

interface UseDebtsProps {
  onAddTransaction?: (tx: CreateTransactionDTO) => Promise<unknown>
}

export function useDebts({ onAddTransaction }: UseDebtsProps = {}) {
  const [debts, setDebts] = useState<Debt[]>([])
  const [payments, setPayments] = useState<DebtPayment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPrivacyMode, setIsPrivacyMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRIVACY_MODE_STORAGE_KEY) === 'true'
    } catch {
      return false
    }
  })

  const repository = useMemo(() => createDebtRepository(), [])

  const togglePrivacyMode = useCallback(() => {
    setIsPrivacyMode((prev) => {
      const next = !prev
      try {
        localStorage.setItem(PRIVACY_MODE_STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [debtsData, paymentsData] = await Promise.all([
        repository.getAll(),
        repository.getPayments(),
      ])
      setDebts(debtsData)
      setPayments(paymentsData)
    } catch (err) {
      console.error('[useDebts] Erro ao carregar dados:', err)
      setError('Não foi possível carregar os dados de dívidas e empréstimos.')
    } finally {
      setIsLoading(false)
    }
  }, [repository])

  useEffect(() => {
    loadData()
  }, [loadData])

  const addDebt = useCallback(
    async (dto: CreateDebtDTO): Promise<Debt> => {
      const created = await repository.create(dto)
      setDebts((prev) => [created, ...prev])
      return created
    },
    [repository],
  )

  const updateDebt = useCallback(
    async (id: string, dto: Partial<CreateDebtDTO>): Promise<Debt> => {
      const updated = await repository.update(id, dto)
      setDebts((prev) => prev.map((d) => (d.id === id ? updated : d)))
      return updated
    },
    [repository],
  )

  const deleteDebt = useCallback(
    async (id: string): Promise<boolean> => {
      const success = await repository.delete(id)
      if (success) {
        setDebts((prev) => prev.filter((d) => d.id !== id))
        setPayments((prev) => prev.filter((p) => p.debtId !== id))
      }
      return success
    },
    [repository],
  )

  const payDebt = useCallback(
    async (dto: RecordDebtPaymentDTO): Promise<{ payment: DebtPayment; updatedDebt: Debt }> => {
      const result = await repository.recordPayment(dto)
      const { payment, updatedDebt } = result

      // Atualiza lista em memória
      setDebts((prev) => prev.map((d) => (d.id === updatedDebt.id ? updatedDebt : d)))
      setPayments((prev) => [payment, ...prev])

      // Se solicitado, registra automaticamente como despesa no extrato do myFinance
      if (dto.registerAsExpense && onAddTransaction && dto.amount > 0) {
        try {
          const typeLabelMap = {
            renewal: 'Renovação / Juros',
            amortization: 'Amortização de Dívida',
            installment: 'Parcela de Empréstimo',
            full_payoff: 'Quitação Total de Dívida',
          }
          const label = typeLabelMap[dto.type] || 'Pagamento de Dívida'

          await onAddTransaction({
            title: `${label}: ${updatedDebt.lenderName}`,
            amount: Number(dto.amount),
            type: 'expense',
            category: 'Dívidas & Juros',
            date: dto.paymentDate,
            status: 'paid',
          })
        } catch (txErr) {
          console.error('[useDebts] Não foi possível lançar no extrato:', txErr)
        }
      }

      return result
    },
    [repository, onAddTransaction],
  )

  // Estatísticas calculadas
  const activeDebts = useMemo(() => debts.filter((d) => d.status !== 'paid'), [debts])
  const paidDebts = useMemo(() => debts.filter((d) => d.status === 'paid'), [debts])
  const overdueDebts = useMemo(() => debts.filter((d) => d.status === 'overdue'), [debts])

  const totalDebtBalance = useMemo(() => {
    return activeDebts.reduce((acc, curr) => acc + curr.currentBalance, 0)
  }, [activeDebts])

  const totalInterestPaid = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (curr.interestPaid || 0), 0)
  }, [payments])

  const totalPrincipalPaid = useMemo(() => {
    return payments.reduce((acc, curr) => acc + (curr.principalPaid || 0), 0)
  }, [payments])

  const totalAmountPaid = useMemo(() => {
    return payments.reduce((acc, curr) => acc + curr.amount, 0)
  }, [payments])

  return {
    debts,
    payments,
    activeDebts,
    paidDebts,
    overdueDebts,
    totalDebtBalance,
    totalInterestPaid,
    totalPrincipalPaid,
    totalAmountPaid,
    isLoading,
    error,
    isPrivacyMode,
    togglePrivacyMode,
    loadData,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebt,
  }
}
