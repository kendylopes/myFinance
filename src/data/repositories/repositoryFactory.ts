import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { isSupabaseConfigured } from '../sources/supabaseClient'
import { LocalStorageBudgetRepository } from './LocalStorageBudgetRepository'
import { LocalStorageTransactionRepository } from './LocalStorageTransactionRepository'
import { SupabaseBudgetRepository } from './SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from './SupabaseTransactionRepository'

/**
 * Retorna qual fonte de dados está ativa no momento com base no status do Supabase e do usuário.
 */
export function getActiveDataSource(isUserAuthenticated = false): 'supabase' | 'localStorage' {
  return isUserAuthenticated && isSupabaseConfigured() ? 'supabase' : 'localStorage'
}

/**
 * Cria a instância adequada do repositório de transações.
 * Se forceLocal for true ou o Supabase não estiver configurado, utiliza LocalStorage;
 * caso contrário, utiliza Supabase em nuvem.
 */
export function createTransactionRepository(forceLocal = false): ITransactionRepository {
  if (!forceLocal && isSupabaseConfigured()) {
    return new SupabaseTransactionRepository()
  }
  return new LocalStorageTransactionRepository()
}

/**
 * Cria a instância adequada do repositório de metas orçamentárias.
 */
export function createBudgetRepository(forceLocal = false): IBudgetRepository {
  if (!forceLocal && isSupabaseConfigured()) {
    return new SupabaseBudgetRepository()
  }
  return new LocalStorageBudgetRepository()
}
