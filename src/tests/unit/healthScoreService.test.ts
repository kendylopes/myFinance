import { describe, expect, it } from 'vitest'
import type { BudgetProgress, FinanceSummary } from '../../domain/models/transaction'
import { calculateFinancialHealthScore } from '../../domain/services/healthScoreService'

describe('healthScoreService', () => {
  it('deve calcular pontuação excelente para finanças com alta taxa de economia e bom orçamento', () => {
    const summary: FinanceSummary = {
      totalIncome: 10000,
      totalExpense: 6000,
      balance: 4000,
    }

    const budgetProgress: BudgetProgress = {
      budgetAmount: 7000,
      totalExpense: 6000,
      remainingAmount: 1000,
      spentPercentage: 85.7,
      isExceeded: false,
      status: 'warning',
    }

    const result = calculateFinancialHealthScore({
      summary,
      transactionsCount: 15,
      topCategory: 'Moradia',
      topCategoryAmount: 2000,
      topCategoryPercent: 33.3,
      budgetProgress,
    })

    expect(result.score).toBeGreaterThanOrEqual(80)
    expect(result.rating).toBe('excellent')
    expect(result.label).toBe('Excelente')
    expect(result.savingsRate).toBe(40)
  })

  it('deve pontuar como alerta/crítico quando as despesas superam as receitas (déficit)', () => {
    const summary: FinanceSummary = {
      totalIncome: 3000,
      totalExpense: 4500,
      balance: -1500,
    }

    const result = calculateFinancialHealthScore({
      summary,
      transactionsCount: 8,
      topCategory: 'Cartão',
      topCategoryAmount: 3000,
      topCategoryPercent: 66.6,
    })

    expect(result.score).toBeLessThan(65)
    expect(result.recommendation).toContain('Seus gastos superaram as entradas')
  })

  it('deve penalizar quando o teto de gastos for ultrapassado', () => {
    const summary: FinanceSummary = {
      totalIncome: 5000,
      totalExpense: 4800,
      balance: 200,
    }

    const budgetProgress: BudgetProgress = {
      budgetAmount: 4000,
      totalExpense: 4800,
      remainingAmount: -800,
      spentPercentage: 120,
      isExceeded: true,
      status: 'exceeded',
    }

    const result = calculateFinancialHealthScore({
      summary,
      transactionsCount: 12,
      topCategory: 'Alimentação',
      topCategoryAmount: 1500,
      topCategoryPercent: 31,
      budgetProgress,
    })

    expect(result.factors.budget.points).toBe(5)
    expect(result.recommendation).toContain('Você ultrapassou o teto definido no Planejamento')
  })
})
