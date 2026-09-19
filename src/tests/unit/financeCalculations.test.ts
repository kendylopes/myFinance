import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import {
  calculateBalance,
  calculateExpensesByCategory,
  calculateSummary,
  calculateTotalExpense,
  calculateTotalIncome,
  filterTransactionsByMonth,
  validateTransactionData,
} from '../../domain/services/financeCalculations'

describe('financeCalculations (Regras de Domínio)', () => {
  const mockTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Salário',
      amount: 3000,
      type: 'income',
      category: 'Trabalho',
      date: '2026-09-01',
    },
    {
      id: '2',
      title: 'Supermercado',
      amount: 500,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-02',
    },
    {
      id: '3',
      title: 'Freelance',
      amount: 750,
      type: 'income',
      category: 'Serviços',
      date: '2026-09-05',
    },
    {
      id: '4',
      title: 'Internet',
      amount: 150,
      type: 'expense',
      category: 'Moradia',
      date: '2026-09-06',
    },
  ]

  it('deve calcular corretamente a soma total de entradas (receitas)', () => {
    const total = calculateTotalIncome(mockTransactions)
    expect(total).toBe(3750) // 3000 + 750
  })

  it('deve calcular corretamente a soma total de saídas (despesas)', () => {
    const total = calculateTotalExpense(mockTransactions)
    expect(total).toBe(650) // 500 + 150
  })

  it('deve calcular o saldo líquido (Entradas - Saídas)', () => {
    const balance = calculateBalance(3750, 650)
    expect(balance).toBe(3100)
  })

  it('deve retornar saldo negativo se as despesas forem maiores que receitas', () => {
    const balance = calculateBalance(1000, 1500)
    expect(balance).toBe(-500)
  })

  it('deve retornar resumo completo correto através de calculateSummary', () => {
    const summary = calculateSummary(mockTransactions)
    expect(summary).toEqual({
      totalIncome: 3750,
      totalExpense: 650,
      balance: 3100,
    })
  })

  it('deve lidar com listas vazias retornando zeros', () => {
    const summary = calculateSummary([])
    expect(summary).toEqual({
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
    })
  })

  describe('validateTransactionData', () => {
    it('deve validar com sucesso dados completos e corretos', () => {
      const result = validateTransactionData({
        title: 'Academia',
        amount: 120,
        type: 'expense',
        category: 'Saúde',
        date: '2026-09-10',
      })
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('deve rejeitar transação com descrição vazia', () => {
      const result = validateTransactionData({
        title: '   ',
        amount: 120,
        type: 'expense',
        category: 'Saúde',
        date: '2026-09-10',
      })
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('A descrição é obrigatória.')
    })

    it('deve rejeitar transação com valor zero ou negativo', () => {
      const resultZero = validateTransactionData({
        title: 'Café',
        amount: 0,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-10',
      })
      expect(resultZero.isValid).toBe(false)

      const resultNeg = validateTransactionData({
        title: 'Café',
        amount: -10,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-10',
      })
      expect(resultNeg.isValid).toBe(false)
    })
  })

  describe('filterTransactionsByMonth', () => {
    const multiMonthTransactions: Transaction[] = [
      {
        id: '1',
        title: 'Salário Setembro',
        amount: 3000,
        type: 'income',
        category: 'Trabalho',
        date: '2026-09-05',
      },
      {
        id: '2',
        title: 'Aluguel Setembro',
        amount: 1000,
        type: 'expense',
        category: 'Moradia',
        date: '2026-09-10',
      },
      {
        id: '3',
        title: 'Salário Outubro',
        amount: 3000,
        type: 'income',
        category: 'Trabalho',
        date: '2026-10-05',
      },
      {
        id: '4',
        title: 'Mercado Outubro',
        amount: 400,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-10-12',
      },
    ]

    it('deve filtrar apenas as transações do mês selecionado', () => {
      const result = filterTransactionsByMonth(multiMonthTransactions, '2026-09')
      expect(result).toHaveLength(2)
      expect(result.map((t) => t.id)).toEqual(['1', '2'])
    })

    it('deve retornar lista vazia para um mês sem lançamentos', () => {
      const result = filterTransactionsByMonth(multiMonthTransactions, '2026-01')
      expect(result).toHaveLength(0)
    })

    it('deve retornar todas as transações quando o período for "all"', () => {
      const result = filterTransactionsByMonth(multiMonthTransactions, 'all')
      expect(result).toHaveLength(4)
    })
  })

  describe('calculateExpensesByCategory', () => {
    const expenseTransactions: Transaction[] = [
      {
        id: '1',
        title: 'Almoço',
        amount: 200,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-01',
      },
      {
        id: '2',
        title: 'Jantar',
        amount: 100,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-02',
      },
      {
        id: '3',
        title: 'Aluguel',
        amount: 700,
        type: 'expense',
        category: 'Moradia',
        date: '2026-09-05',
      },
      {
        id: '4',
        title: 'Salário',
        amount: 5000,
        type: 'income',
        category: 'Trabalho',
        date: '2026-09-05',
      },
    ]

    it('deve agrupar, somar e calcular porcentagens corretas das despesas', () => {
      const result = calculateExpensesByCategory(expenseTransactions)
      // Total de despesas: 200 + 100 + 700 = 1000
      // Moradia: 700 (70%)
      // Alimentação: 300 (30%)
      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        category: 'Moradia',
        amount: 700,
        percentage: 70,
        color: expect.any(String),
      })
      expect(result[1]).toEqual({
        category: 'Alimentação',
        amount: 300,
        percentage: 30,
        color: expect.any(String),
      })
    })

    it('deve retornar array vazio quando não houver despesas', () => {
      const onlyIncomes: Transaction[] = [
        {
          id: '1',
          title: 'Salário',
          amount: 3000,
          type: 'income',
          category: 'Trabalho',
          date: '2026-09-01',
        },
      ]
      const result = calculateExpensesByCategory(onlyIncomes)
      expect(result).toEqual([])
    })

    it('deve retornar array vazio para lista de transações vazia', () => {
      const result = calculateExpensesByCategory([])
      expect(result).toEqual([])
    })
  })
})
