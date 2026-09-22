import type { SupabaseClient } from '@supabase/supabase-js'
import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'
import { getSupabaseClient } from '../sources/supabaseClient'
export const DEFAULT_BUDGET_AMOUNT = 3000

export class SupabaseBudgetRepository implements IBudgetRepository {
  private client: SupabaseClient | null

  constructor(customClient?: SupabaseClient | null) {
    this.client = customClient !== undefined ? customClient : getSupabaseClient()
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        '[SupabaseBudgetRepository] Cliente Supabase não configurado. Verifique as chaves no arquivo .env.',
      )
    }
    return this.client
  }

  async getBudget(yearMonth: string): Promise<number> {
    try {
      const client = this.getClient()

      // 1. Tenta buscar o orçamento específico do mês selecionado
      if (yearMonth && yearMonth !== 'all' && yearMonth !== 'default') {
        const { data, error } = await client
          .from('budgets')
          .select('budget_amount')
          .eq('id', yearMonth)
          .maybeSingle()

        if (!error && data && data.budget_amount !== null) {
          return Number(data.budget_amount)
        }
      }

      // 2. Tenta buscar o orçamento padrão/global
      const { data: globalData, error: globalError } = await client
        .from('budgets')
        .select('budget_amount')
        .eq('id', 'global')
        .maybeSingle()

      if (!globalError && globalData && globalData.budget_amount !== null) {
        return Number(globalData.budget_amount)
      }

      // 3. Retorna valor padrão se nenhuma meta for encontrada
      return DEFAULT_BUDGET_AMOUNT
    } catch (err) {
      console.error('[SupabaseBudgetRepository] Erro ao recuperar orçamento:', err)
      return DEFAULT_BUDGET_AMOUNT
    }
  }

  async setBudget(yearMonth: string, amount: number): Promise<void> {
    try {
      const client = this.getClient()
      const safeAmount = Number.isNaN(amount) || amount < 0 ? 0 : amount
      const targetId = yearMonth === 'all' || !yearMonth ? 'global' : yearMonth

      const { error } = await client.from('budgets').upsert(
        {
          id: targetId,
          budget_amount: safeAmount,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id, id' },
      )

      if (error) {
        console.error('[SupabaseBudgetRepository] Erro ao salvar orçamento:', error.message)
      }
    } catch (err) {
      console.error('[SupabaseBudgetRepository] Exceção ao gravar orçamento:', err)
    }
  }
}
