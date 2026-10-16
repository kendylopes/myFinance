import { describe, expect, it } from 'vitest'
import {
  createBudgetRepository,
  createTransactionRepository,
} from '../../data/repositories/repositoryFactory'
import { SupabaseBudgetRepository } from '../../data/repositories/SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from '../../data/repositories/SupabaseTransactionRepository'

describe('repositoryFactory (Exclusivo em Nuvem / Supabase)', () => {
  it('deve instanciar SupabaseTransactionRepository', () => {
    const repo = createTransactionRepository()
    expect(repo).toBeInstanceOf(SupabaseTransactionRepository)
  })

  it('deve instanciar SupabaseBudgetRepository', () => {
    const repo = createBudgetRepository()
    expect(repo).toBeInstanceOf(SupabaseBudgetRepository)
  })
})
