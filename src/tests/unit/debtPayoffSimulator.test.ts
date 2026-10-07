import { describe, expect, it } from 'vitest'
import type { Debt } from '../../domain/models/debt'
import {
  comparePayoffStrategies,
  getEffectiveMonthlyRate,
  simulateStrategy,
} from '../../domain/services/debtPayoffSimulator'

describe('debtPayoffSimulator (Simulador de Quitação de Dívidas)', () => {
  const sampleDebts: Debt[] = [
    {
      id: 'debt-1',
      lenderName: 'Agiota Zé',
      originalAmount: 2000,
      currentBalance: 2000,
      interestRate: 15, // 15% ao mês (alta taxa)
      interestType: 'monthly',
      startDate: '2026-09-01',
      dueDate: '2026-10-01',
      paidInstallments: 0,
      status: 'active',
      createdAt: '2026-09-01',
      updatedAt: '2026-09-01',
    },
    {
      id: 'debt-2',
      lenderName: 'Empréstimo Pessoal Nubank',
      originalAmount: 500,
      currentBalance: 500,
      interestRate: 4, // 4% ao mês (menor saldo)
      interestType: 'monthly',
      startDate: '2026-09-01',
      dueDate: '2026-10-01',
      paidInstallments: 0,
      status: 'active',
      createdAt: '2026-09-01',
      updatedAt: '2026-09-01',
    },
  ]

  it('deve calcular taxa efetiva mensal corretamente', () => {
    expect(getEffectiveMonthlyRate(sampleDebts[0])).toBe(15)
    expect(getEffectiveMonthlyRate(sampleDebts[1])).toBe(4)

    const fixedDebt: Debt = {
      ...sampleDebts[0],
      interestType: 'fixed',
      fixedInterestAmount: 200,
      currentBalance: 1000,
    }
    // 200 de 1000 = 20%
    expect(getEffectiveMonthlyRate(fixedDebt)).toBe(20)
  })

  it('deve priorizar a maior taxa de juros na estratégia Avalanche', () => {
    const result = simulateStrategy(sampleDebts, 1000, 'avalanche')
    expect(result.strategy).toBe('avalanche')
    expect(result.payoffOrder[0].lenderName).toBe('Agiota Zé') // 15% > 4%
    expect(result.isFeasible).toBe(true)
    expect(result.totalMonths).toBeGreaterThan(0)
  })

  it('deve priorizar o menor saldo devedor na estratégia Bola de Neve', () => {
    const result = simulateStrategy(sampleDebts, 1000, 'snowball')
    expect(result.strategy).toBe('snowball')
    expect(result.payoffOrder[0].lenderName).toBe('Empréstimo Pessoal Nubank') // 500 < 2000
    expect(result.isFeasible).toBe(true)
    expect(result.totalMonths).toBeGreaterThan(0)
  })

  it('deve comparar as estratégias e calcular economia de juros', () => {
    const comparison = comparePayoffStrategies(sampleDebts, 800)
    expect(comparison.avalanche).toBeDefined()
    expect(comparison.snowball).toBeDefined()
    expect(comparison.recommendedStrategy).toBe('avalanche')
    expect(comparison.interestSavings).toBeGreaterThanOrEqual(0)
  })

  it('deve lidar com lista vazia de dívidas', () => {
    const comparison = comparePayoffStrategies([], 500)
    expect(comparison.avalanche.totalMonths).toBe(0)
    expect(comparison.snowball.totalMonths).toBe(0)
    expect(comparison.interestSavings).toBe(0)
  })
})
