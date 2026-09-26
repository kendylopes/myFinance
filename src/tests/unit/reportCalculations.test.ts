import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import {
  buildDailyEvolution,
  buildMonthlyEvolution,
  calculatePercentageChange,
  filterTransactionsByDateRange,
  generateReportData,
  getPreviousReportDateRange,
  getReportDateRange,
  getTopExpenses,
} from '../../domain/services/reportCalculations'

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Salário',
    amount: 5000,
    type: 'income',
    category: 'Trabalho',
    date: '2026-09-01',
  },
  {
    id: 'tx-2',
    title: 'Supermercado',
    amount: 800,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-09-05',
  },
  {
    id: 'tx-3',
    title: 'Aluguel',
    amount: 1500,
    type: 'expense',
    category: 'Moradia',
    date: '2026-09-10',
  },
  {
    id: 'tx-4',
    title: 'Freelance',
    amount: 1200,
    type: 'income',
    category: 'Trabalho',
    date: '2026-09-15',
  },
  {
    id: 'tx-5',
    title: 'Jantar Restaurante',
    amount: 250,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-09-20',
  },
  {
    id: 'tx-6',
    title: 'Gasto de Agosto',
    amount: 300,
    type: 'expense',
    category: 'Lazer',
    date: '2026-08-15',
  },
]

describe('reportCalculations', () => {
  it('deve gerar intervalo de datas correto para o tipo semana, mês e ano', () => {
    const ref = new Date('2026-09-20T12:00:00')

    const weekRange = getReportDateRange('week', ref)
    expect(weekRange.startDate).toBe('2026-09-14')
    expect(weekRange.endDate).toBe('2026-09-20')

    const monthRange = getReportDateRange('month', ref)
    expect(monthRange.startDate).toBe('2026-09-01')
    expect(monthRange.endDate).toBe('2026-09-30')

    const yearRange = getReportDateRange('year', ref)
    expect(yearRange.startDate).toBe('2026-01-01')
    expect(yearRange.endDate).toBe('2026-12-31')
  })

  it('deve calcular período anterior correspondente', () => {
    const monthRange = { startDate: '2026-09-01', endDate: '2026-09-30', label: 'Setembro' }
    const prevMonth = getPreviousReportDateRange('month', monthRange)
    expect(prevMonth.startDate).toBe('2026-08-01')
    expect(prevMonth.endDate).toBe('2026-08-31')
  })

  it('deve filtrar transações pelo intervalo inclusivo', () => {
    const filtered = filterTransactionsByDateRange(mockTransactions, '2026-09-01', '2026-09-10')
    expect(filtered).toHaveLength(3) // tx-1, tx-2, tx-3
  })

  it('deve calcular variação percentual corretamente', () => {
    expect(calculatePercentageChange(150, 100)).toBe(50) // +50%
    expect(calculatePercentageChange(80, 100)).toBe(-20) // -20%
    expect(calculatePercentageChange(100, 0)).toBe(100)
    expect(calculatePercentageChange(0, 0)).toBe(0)
  })

  it('deve retornar as 5 maiores despesas em ordem decrescente', () => {
    const top = getTopExpenses(mockTransactions)
    expect(top).toHaveLength(4) // 4 despesas no mock
    expect(top[0].title).toBe('Aluguel')
    expect(top[0].amount).toBe(1500)
    expect(top[1].title).toBe('Supermercado')
    expect(top[1].amount).toBe(800)
  })

  it('deve construir evolução diária cobrindo todos os dias do intervalo', () => {
    const evolution = buildDailyEvolution(mockTransactions, '2026-09-01', '2026-09-05')
    expect(evolution).toHaveLength(5)
    expect(evolution[0].date).toBe('2026-09-01')
    expect(evolution[0].income).toBe(5000)
    expect(evolution[4].date).toBe('2026-09-05')
    expect(evolution[4].expense).toBe(800)
  })

  it('deve construir evolução anual com 12 meses', () => {
    const monthly = buildMonthlyEvolution(mockTransactions, 2026)
    expect(monthly).toHaveLength(12)
    // Agosto (índice 7)
    expect(monthly[7].monthLabel).toBe('Ago')
    expect(monthly[7].expense).toBe(300)
    // Setembro (índice 8)
    expect(monthly[8].monthLabel).toBe('Set')
    expect(monthly[8].income).toBe(6200) // 5000 + 1200
    expect(monthly[8].expense).toBe(2550) // 800 + 1500 + 250
  })

  it('deve gerar dados consolidados do relatório completo com métricas e dia de maior gasto', () => {
    const report = generateReportData(mockTransactions, 'month', new Date('2026-09-15T12:00:00'))

    expect(report.periodType).toBe('month')
    expect(report.summary.totalIncome).toBe(6200)
    expect(report.summary.totalExpense).toBe(2550)
    expect(report.summary.balance).toBe(3650)
    expect(report.topExpenses[0].title).toBe('Aluguel')
    expect(report.highestSpendingDay?.date).toBe('2026-09-10')
    expect(report.highestSpendingDay?.amount).toBe(1500)
  })
})
