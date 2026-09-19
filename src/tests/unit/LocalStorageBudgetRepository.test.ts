import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_BUDGET_AMOUNT,
  LocalStorageBudgetRepository,
} from '../../data/repositories/LocalStorageBudgetRepository'

describe('LocalStorageBudgetRepository (Persistência de Orçamento)', () => {
  let repository: LocalStorageBudgetRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new LocalStorageBudgetRepository()
  })

  it('deve retornar o orçamento padrão quando não houver valor configurado', async () => {
    const budget = await repository.getBudget('2026-09')
    expect(budget).toBe(DEFAULT_BUDGET_AMOUNT)
  })

  it('deve salvar e recuperar o orçamento específico para um mês', async () => {
    await repository.setBudget('2026-09', 4500)
    const budget = await repository.getBudget('2026-09')
    expect(budget).toBe(4500)
  })

  it('deve atualizar o orçamento padrão ao salvar com chave "all"', async () => {
    await repository.setBudget('all', 5000)
    const budgetOtherMonth = await repository.getBudget('2026-12')
    expect(budgetOtherMonth).toBe(5000)
  })

  it('deve priorizar o orçamento do mês específico sobre o padrão global', async () => {
    await repository.setBudget('all', 3000)
    await repository.setBudget('2026-09', 4000)

    const budgetSept = await repository.getBudget('2026-09')
    const budgetOct = await repository.getBudget('2026-10')

    expect(budgetSept).toBe(4000)
    expect(budgetOct).toBe(3000)
  })
})
