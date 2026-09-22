import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { SupabaseBudgetRepository } from './SupabaseBudgetRepository'
import { SupabaseTransactionRepository } from './SupabaseTransactionRepository'

/**
 * Retorna qual fonte de dados está ativa no momento.
 * O myFinance agora opera exclusivamente na nuvem via Supabase.
 */
export function getActiveDataSource(): 'supabase' {
  return 'supabase'
}

/**
 * Cria a instância do repositório de transações em nuvem (Supabase).
 */
export function createTransactionRepository(): ITransactionRepository {
  return new SupabaseTransactionRepository()
}

/**
 * Cria a instância do repositório de metas orçamentárias em nuvem (Supabase).
 */
export function createBudgetRepository(): IBudgetRepository {
  return new SupabaseBudgetRepository()
}
