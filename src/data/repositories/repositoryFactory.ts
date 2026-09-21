import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { isSupabaseConfigured } from '../sources/supabaseClient'
import { LocalStorageBudgetRepository } from './LocalStorageBudgetRepository'
import { LocalStorageTransactionRepository } from './LocalStorageTransactionRepository'
import { SupabaseBudgetRepository } from './SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from './SupabaseTransactionRepository'

/**
 * Retorna qual fonte de dados está ativa no momento.
 */
export function getActiveDataSource(): 'supabase' | 'localStorage' {
  return isSupabaseConfigured() ? 'supabase' : 'localStorage'
}

/**
 * Cria a instância adequada do repositório de transações.
 * Se o Supabase estiver configurado com credenciais válidas, utiliza Supabase;
 * caso contrário, faz fallback seguro e transparente para LocalStorage.
 */
export function createTransactionRepository(): ITransactionRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseTransactionRepository()
  }
  return new LocalStorageTransactionRepository()
}

/**
 * Cria a instância adequada do repositório de metas orçamentárias.
 */
export function createBudgetRepository(): IBudgetRepository {
  if (isSupabaseConfigured()) {
    return new SupabaseBudgetRepository()
  }
  return new LocalStorageBudgetRepository()
}
