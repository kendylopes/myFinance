import { describe, expect, it } from 'vitest'
import { LocalStorageBudgetRepository } from '../../data/repositories/LocalStorageBudgetRepository'
import { LocalStorageTransactionRepository } from '../../data/repositories/LocalStorageTransactionRepository'
import { SupabaseBudgetRepository } from '../../data/repositories/SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from '../../data/repositories/SupabaseTransactionRepository'
import {
  createBudgetRepository,
  createTransactionRepository,
  getActiveDataSource,
} from '../../data/repositories/repositoryFactory'
import { isSupabaseConfigured } from '../../data/sources/supabaseClient'

describe('repositoryFactory (Fallback e Instanciação Inteligente)', () => {
  it('deve retornar localStorage quando o usuário não estiver autenticado', () => {
    expect(getActiveDataSource(false)).toBe('localStorage')
  })

  it('deve retornar supabase quando o usuário estiver autenticado e o Supabase configurado', () => {
    if (isSupabaseConfigured()) {
      expect(getActiveDataSource(true)).toBe('supabase')
    } else {
      expect(getActiveDataSource(true)).toBe('localStorage')
    }
  })

  it('deve instanciar LocalStorageTransactionRepository quando forceLocal for true', () => {
    const repo = createTransactionRepository(true)
    expect(repo).toBeInstanceOf(LocalStorageTransactionRepository)
  })

  it('deve instanciar LocalStorageBudgetRepository quando forceLocal for true', () => {
    const repo = createBudgetRepository(true)
    expect(repo).toBeInstanceOf(LocalStorageBudgetRepository)
  })

  it('deve instanciar repositórios do Supabase quando configurado e forceLocal for false', () => {
    if (isSupabaseConfigured()) {
      expect(createTransactionRepository(false)).toBeInstanceOf(SupabaseTransactionRepository)
      expect(createBudgetRepository(false)).toBeInstanceOf(SupabaseBudgetRepository)
    } else {
      expect(createTransactionRepository(false)).toBeInstanceOf(LocalStorageTransactionRepository)
      expect(createBudgetRepository(false)).toBeInstanceOf(LocalStorageBudgetRepository)
    }
  })
})
