import { describe, expect, it } from 'vitest'
import { LocalStorageBudgetRepository } from '../../data/repositories/LocalStorageBudgetRepository'
import { LocalStorageTransactionRepository } from '../../data/repositories/LocalStorageTransactionRepository'
import {
  createBudgetRepository,
  createTransactionRepository,
  getActiveDataSource,
} from '../../data/repositories/repositoryFactory'

describe('repositoryFactory (Fallback e Instanciação Inteligente)', () => {
  it('deve retornar localStorage quando as variáveis do Supabase não estiverem definidas', () => {
    expect(getActiveDataSource()).toBe('localStorage')
  })

  it('deve instanciar LocalStorageTransactionRepository no modo fallback', () => {
    const repo = createTransactionRepository()
    expect(repo).toBeInstanceOf(LocalStorageTransactionRepository)
  })

  it('deve instanciar LocalStorageBudgetRepository no modo fallback', () => {
    const repo = createBudgetRepository()
    expect(repo).toBeInstanceOf(LocalStorageBudgetRepository)
  })
})
