import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { SupabaseBudgetRepository } from './SupabaseBudgetRepository'
import { SupabaseCategoryRepository } from './SupabaseCategoryRepository'
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

/**
 * Cria a instância do repositório de categorias em nuvem (Supabase).
 */
export function createCategoryRepository(): ICategoryRepository {
  return new SupabaseCategoryRepository()
}
