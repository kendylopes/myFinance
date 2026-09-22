import { describe, expect, it } from 'vitest'
import {
  createBudgetRepository,
  createTransactionRepository,
  getActiveDataSource,
} from '../../data/repositories/repositoryFactory'
import { SupabaseBudgetRepository } from '../../data/repositories/SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from '../../data/repositories/SupabaseTransactionRepository'

describe('repositoryFactory (Exclusivo em Nuvem / Supabase)', () => {
  it('deve retornar supabase como fonte de dados ativa padrão', () => {
    expect(getActiveDataSource()).toBe('supabase')
  })

  it('deve instanciar SupabaseTransactionRepository', () => {
    const repo = createTransactionRepository()
    expect(repo).toBeInstanceOf(SupabaseTransactionRepository)
  })

  it('deve instanciar SupabaseBudgetRepository', () => {
    const repo = createBudgetRepository()
    expect(repo).toBeInstanceOf(SupabaseBudgetRepository)
  })
})
