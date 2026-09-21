import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateTransactionDTO, Transaction } from '../../domain/models/transaction'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'
import { getSupabaseClient } from '../sources/supabaseClient'

export class SupabaseTransactionRepository implements ITransactionRepository {
  private client: SupabaseClient | null

  constructor(customClient?: SupabaseClient | null) {
    this.client = customClient !== undefined ? customClient : getSupabaseClient()
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        '[SupabaseTransactionRepository] Cliente Supabase não configurado. Verifique as chaves no arquivo .env.',
      )
    }
    return this.client
  }

  async getAll(): Promise<Transaction[]> {
    try {
      const client = this.getClient()
      const { data, error } = await client
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) {
        console.error('[SupabaseTransactionRepository] Erro ao listar transações:', error.message)
        return []
      }

      return (data || []).map((row) => ({
        id: String(row.id),
        title: String(row.title),
        amount: Number(row.amount),
        type: row.type as 'income' | 'expense',
        category: String(row.category),
        date: String(row.date),
      }))
    } catch (err) {
      console.error('[SupabaseTransactionRepository] Exceção ao buscar transações:', err)
      return []
    }
  }

  async create(data: CreateTransactionDTO): Promise<Transaction> {
    const client = this.getClient()
    const payload = {
      title: data.title.trim(),
      amount: Number(data.amount),
      type: data.type,
      category: data.category.trim() || 'Geral',
      date: data.date,
    }

    const { data: createdRow, error } = await client
      .from('transactions')
      .insert(payload)
      .select('*')
      .single()

    if (error || !createdRow) {
      console.error('[SupabaseTransactionRepository] Erro ao criar transação:', error?.message)
      throw new Error(error?.message || 'Falha ao gravar transação no banco em nuvem.')
    }

    return {
      id: String(createdRow.id),
      title: String(createdRow.title),
      amount: Number(createdRow.amount),
      type: createdRow.type as 'income' | 'expense',
      category: String(createdRow.category),
      date: String(createdRow.date),
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const client = this.getClient()
      const { error } = await client.from('transactions').delete().eq('id', id)

      if (error) {
        console.error('[SupabaseTransactionRepository] Erro ao excluir transação:', error.message)
        return false
      }

      return true
    } catch (err) {
      console.error('[SupabaseTransactionRepository] Exceção ao excluir transação:', err)
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      const client = this.getClient()
      // Remove todas as transações com ID não nulo
      await client.from('transactions').delete().not('id', 'is', null)
    } catch (err) {
      console.error('[SupabaseTransactionRepository] Erro ao limpar transações:', err)
    }
  }
}
