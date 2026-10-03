import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CreateTransactionDTO, Transaction } from '../../domain/models/transaction'
import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { useFinance } from '../../presentation/hooks/useFinance'

describe('useFinance (Ações Rápidas: Duplicação & Exclusão em Massa)', () => {
  const initialTransactions: Transaction[] = [
    {
      id: 'tx-100',
      title: 'Mercado Semanal',
      amount: 250,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-10',
    },
    {
      id: 'tx-101',
      title: 'Consultoria Frontend',
      amount: 1500,
      type: 'income',
      category: 'Trabalho',
      date: '2026-09-12',
    },
    {
      id: 'tx-102',
      title: 'Combustível',
      amount: 180,
      type: 'expense',
      category: 'Transporte',
      date: '2026-09-15',
    },
  ]

  const createMockRepos = () => {
    let store = [...initialTransactions]

    const transactionRepo: ITransactionRepository = {
      getAll: vi.fn().mockImplementation(() => Promise.resolve([...store])),
      create: vi.fn().mockImplementation((dto: CreateTransactionDTO) => {
        const created: Transaction = {
          id: `tx-${Date.now()}-${Math.random()}`,
          ...dto,
        }
        store = [created, ...store]
        return Promise.resolve(created)
      }),
      delete: vi.fn().mockImplementation((id: string) => {
        store = store.filter((t) => t.id !== id)
        return Promise.resolve(true)
      }),
      update: vi.fn().mockImplementation((id: string, dto: Partial<CreateTransactionDTO>) => {
        const item = store.find((t) => t.id === id)
        const updated = { ...item, ...dto } as Transaction
        store = store.map((t) => (t.id === id ? updated : t))
        return Promise.resolve(updated)
      }),
      clear: vi.fn().mockImplementation(() => {
        store = []
        return Promise.resolve()
      }),
    }

    const budgetRepo: IBudgetRepository = {
      getBudget: vi.fn().mockResolvedValue(5000),
      setBudget: vi.fn().mockResolvedValue(undefined),
    }

    const categoryRepo: ICategoryRepository = {
      getAll: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockImplementation((dto) => Promise.resolve({ id: 'cat-1', ...dto })),
      delete: vi.fn().mockResolvedValue(true),
    }

    return { transactionRepo, budgetRepo, categoryRepo }
  }

  it('deve duplicar uma transação com sucesso mantendo seus dados', async () => {
    const { transactionRepo, budgetRepo, categoryRepo } = createMockRepos()
    const { result } = renderHook(() => useFinance(transactionRepo, budgetRepo, null, categoryRepo))

    // Aguardar carregamento inicial
    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.transactions.length).toBe(3)

    // Duplicar a transação tx-100
    let success = false
    await act(async () => {
      success = await result.current.duplicateTransaction('tx-100')
    })

    expect(success).toBe(true)
    expect(result.current.transactions.length).toBe(4)
    expect(result.current.transactions[0].title).toBe('Mercado Semanal')
    expect(result.current.transactions[0].amount).toBe(250)
    expect(result.current.transactions[0].category).toBe('Alimentação')
    expect(transactionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Mercado Semanal',
        amount: 250,
        category: 'Alimentação',
      }),
    )
  })

  it('deve falhar ao tentar duplicar transação inexistente', async () => {
    const { transactionRepo, budgetRepo, categoryRepo } = createMockRepos()
    const { result } = renderHook(() => useFinance(transactionRepo, budgetRepo, null, categoryRepo))

    let success = true
    await act(async () => {
      success = await result.current.duplicateTransaction('id-inexistente')
    })

    expect(success).toBe(false)
    expect(result.current.error).toBe('Transação não encontrada para duplicação.')
  })

  it('deve excluir múltiplas transações com sucesso (Bulk Delete)', async () => {
    const { transactionRepo, budgetRepo, categoryRepo } = createMockRepos()
    const { result } = renderHook(() => useFinance(transactionRepo, budgetRepo, null, categoryRepo))

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.transactions.length).toBe(3)

    // Excluir duas transações de uma vez
    let success = false
    await act(async () => {
      success = await result.current.deleteMultipleTransactions(['tx-100', 'tx-102'])
    })

    expect(success).toBe(true)
    expect(result.current.transactions.length).toBe(1)
    expect(result.current.transactions[0].id).toBe('tx-101')
    expect(transactionRepo.delete).toHaveBeenCalledWith('tx-100')
    expect(transactionRepo.delete).toHaveBeenCalledWith('tx-102')
  })

  it('deve criar todas as parcelas ao registrar transação parcelada', async () => {
    const { transactionRepo, budgetRepo, categoryRepo } = createMockRepos()
    const { result } = renderHook(() => useFinance(transactionRepo, budgetRepo, null, categoryRepo))

    await act(async () => {
      await result.current.refresh()
    })

    expect(result.current.transactions.length).toBe(3)

    let success = false
    await act(async () => {
      success = await result.current.addTransaction({
        title: 'Curso de React',
        amount: 300,
        type: 'expense',
        category: 'Educação',
        date: '2026-09-10',
        recurrence: 'installment',
        installmentsCount: 3,
        isTotalAmount: true,
      })
    })

    expect(success).toBe(true)
    expect(result.current.transactions.length).toBe(6) // 3 iniciais + 3 parcelas
    const installments = result.current.transactions.filter((tx) =>
      tx.title.includes('Curso de React'),
    )
    expect(installments).toHaveLength(3)
    expect(installments.some((tx) => tx.title === 'Curso de React (1/3)')).toBe(true)
    expect(installments.some((tx) => tx.title === 'Curso de React (2/3)')).toBe(true)
    expect(installments.some((tx) => tx.title === 'Curso de React (3/3)')).toBe(true)
    expect(installments.every((tx) => tx.amount === 100)).toBe(true)
  })

  it('deve alternar o status da transação entre paid e pending com sucesso', async () => {
    const { transactionRepo, budgetRepo, categoryRepo } = createMockRepos()
    const { result } = renderHook(() => useFinance(transactionRepo, budgetRepo, null, categoryRepo))

    await act(async () => {
      await result.current.refresh()
    })

    let success = false
    await act(async () => {
      success = await result.current.toggleTransactionStatus('tx-100')
    })

    expect(success).toBe(true)
    const updatedTx = result.current.transactions.find((t) => t.id === 'tx-100')
    expect(updatedTx?.status).toBe('pending')
    expect(transactionRepo.update).toHaveBeenCalledWith('tx-100', { status: 'pending' })

    // Alternar de volta para paid
    await act(async () => {
      await result.current.toggleTransactionStatus('tx-100')
    })
    const toggledBackTx = result.current.transactions.find((t) => t.id === 'tx-100')
    expect(toggledBackTx?.status).toBe('paid')
  })
})
