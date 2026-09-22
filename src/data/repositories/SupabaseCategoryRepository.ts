import type { SupabaseClient } from '@supabase/supabase-js'
import {
  type Category,
  type CreateCategoryDTO,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from '../../domain/models/categories'
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository'
import { getSupabaseClient } from '../sources/supabaseClient'

export class SupabaseCategoryRepository implements ICategoryRepository {
  private client: SupabaseClient | null

  constructor(customClient?: SupabaseClient | null) {
    this.client = customClient !== undefined ? customClient : getSupabaseClient()
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error(
        '[SupabaseCategoryRepository] Cliente Supabase não configurado. Verifique as chaves no arquivo .env.',
      )
    }
    return this.client
  }

  async getAll(): Promise<Category[]> {
    const defaultCategories: Category[] = [
      ...DEFAULT_EXPENSE_CATEGORIES.map((cat) => ({
        id: `default-expense-${cat.id}`,
        name: cat.name,
        type: 'expense' as const,
        icon: cat.icon,
        isCustom: false,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((cat) => ({
        id: `default-income-${cat.id}`,
        name: cat.name,
        type: 'income' as const,
        icon: cat.icon,
        isCustom: false,
      })),
    ]

    try {
      const client = this.getClient()
      const { data, error } = await client
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

      if (error) {
        console.error(
          '[SupabaseCategoryRepository] Erro ao buscar categorias customizadas:',
          error.message,
        )
        return defaultCategories
      }

      const customCategories: Category[] = (data || []).map((row) => ({
        id: String(row.id),
        name: String(row.name),
        type: row.type as 'income' | 'expense',
        icon: String(row.icon || 'Tag'),
        userId: String(row.user_id),
        isCustom: true,
        createdAt: String(row.created_at),
      }))

      // Filtra duplicados pelo nome e tipo (priorizando a customizada se houver mesmo nome)
      const customKeys = new Set(customCategories.map((c) => `${c.type}:${c.name.toLowerCase()}`))
      const filteredDefaults = defaultCategories.filter(
        (def) => !customKeys.has(`${def.type}:${def.name.toLowerCase()}`),
      )

      return [...filteredDefaults, ...customCategories]
    } catch (err) {
      console.error('[SupabaseCategoryRepository] Exceção ao recuperar categorias:', err)
      return defaultCategories
    }
  }

  async create(data: CreateCategoryDTO): Promise<Category> {
    const client = this.getClient()
    const trimmedName = data.name.trim()

    if (!trimmedName) {
      throw new Error('O nome da categoria não pode ser vazio.')
    }

    const payload = {
      name: trimmedName,
      type: data.type,
      icon: data.icon || 'Tag',
    }

    const { data: createdRow, error } = await client
      .from('categories')
      .insert(payload)
      .select('*')
      .single()

    if (error || !createdRow) {
      console.error('[SupabaseCategoryRepository] Erro ao criar categoria:', error?.message)
      throw new Error(error?.message || 'Falha ao gravar categoria no Supabase.')
    }

    return {
      id: String(createdRow.id),
      name: String(createdRow.name),
      type: createdRow.type as 'income' | 'expense',
      icon: String(createdRow.icon || 'Tag'),
      userId: String(createdRow.user_id),
      isCustom: true,
      createdAt: String(createdRow.created_at),
    }
  }

  async delete(id: string): Promise<void> {
    // Categorias padrão não podem ser deletadas do banco
    if (id.startsWith('default-')) {
      return
    }

    try {
      const client = this.getClient()
      const { error } = await client.from('categories').delete().eq('id', id)

      if (error) {
        console.error('[SupabaseCategoryRepository] Erro ao excluir categoria:', error.message)
        throw new Error(error.message)
      }
    } catch (err) {
      console.error('[SupabaseCategoryRepository] Exceção ao excluir categoria:', err)
      throw err
    }
  }
}
