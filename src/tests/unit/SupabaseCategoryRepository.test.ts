import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseCategoryRepository } from '../../data/repositories/SupabaseCategoryRepository'
import type { CreateCategoryDTO } from '../../domain/models/categories'

describe('SupabaseCategoryRepository (Categorias em Nuvem)', () => {
  it('deve retornar categorias padrão se instanciado sem client Supabase', async () => {
    const repo = new SupabaseCategoryRepository(null)
    const items = await repo.getAll()
    expect(items.length).toBeGreaterThan(0)
    expect(items.some((c) => c.name === 'Alimentação')).toBe(true)
    expect(items.some((c) => c.name === 'Salário')).toBe(true)
  })

  it('deve listar categorias mesclando padrão e personalizadas', async () => {
    const mockData = [
      {
        id: 'cat-uuid-1',
        name: 'Consultoria Dev',
        type: 'income',
        icon: 'Briefcase',
        user_id: 'user-123',
        created_at: '2026-09-22T10:00:00Z',
      },
      {
        id: 'cat-uuid-2',
        name: 'Pet Shop',
        type: 'expense',
        icon: 'HeartPulse',
        user_id: 'user-123',
        created_at: '2026-09-22T10:00:00Z',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseCategoryRepository(mockClient)
    const result = await repo.getAll()

    expect(mockClient.from).toHaveBeenCalledWith('categories')
    expect(result.some((c) => c.name === 'Consultoria Dev' && c.isCustom)).toBe(true)
    expect(result.some((c) => c.name === 'Pet Shop' && c.isCustom)).toBe(true)
    expect(result.some((c) => c.name === 'Alimentação' && !c.isCustom)).toBe(true)
  })

  it('deve criar uma nova categoria personalizada no Supabase', async () => {
    const dto: CreateCategoryDTO = {
      name: 'Dividendos FIIs',
      type: 'income',
      icon: 'TrendingUp',
    }

    const createdRow = {
      id: 'cat-uuid-new',
      name: 'Dividendos FIIs',
      type: 'income',
      icon: 'TrendingUp',
      user_id: 'user-123',
      created_at: '2026-09-22T12:00:00Z',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: createdRow, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseCategoryRepository(mockClient)
    const created = await repo.create(dto)

    expect(mockClient.from).toHaveBeenCalledWith('categories')
    expect(mockInsert).toHaveBeenCalledWith({
      name: 'Dividendos FIIs',
      type: 'income',
      icon: 'TrendingUp',
    })
    expect(created.id).toBe('cat-uuid-new')
    expect(created.isCustom).toBe(true)
  })

  it('deve excluir uma categoria personalizada pelo id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: mockDelete,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseCategoryRepository(mockClient)
    await repo.delete('cat-uuid-custom')

    expect(mockClient.from).toHaveBeenCalledWith('categories')
    expect(mockEq).toHaveBeenCalledWith('id', 'cat-uuid-custom')
  })

  it('não deve tentar deletar categoria padrão do sistema', async () => {
    const mockClient = {
      from: vi.fn(),
    } as unknown as SupabaseClient

    const repo = new SupabaseCategoryRepository(mockClient)
    await repo.delete('default-expense-alimentacao')

    expect(mockClient.from).not.toHaveBeenCalled()
  })
})
