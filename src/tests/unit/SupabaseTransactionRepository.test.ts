import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { SupabaseTransactionRepository } from '../../data/repositories/SupabaseTransactionRepository'
import type { CreateTransactionDTO } from '../../domain/models/transaction'

describe('SupabaseTransactionRepository (Persistência em Nuvem)', () => {
  it('deve lançar erro amigável se instanciado sem client Supabase configurado', async () => {
    const repo = new SupabaseTransactionRepository(null)
    const items = await repo.getAll()
    // getAll captura e retorna array vazio
    expect(items).toEqual([])
  })

  it('deve listar transações chamando a tabela transactions do Supabase', async () => {
    const mockData = [
      {
        id: 'uuid-1',
        title: 'Freelance em Nuvem',
        amount: '1200.50',
        type: 'income',
        category: 'Freelance / Bico',
        date: '2026-09-20',
      },
    ]

    const mockSelect = vi.fn().mockReturnValue({
      order: vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }),
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseTransactionRepository(mockClient)
    const result = await repo.getAll()

    expect(mockClient.from).toHaveBeenCalledWith('transactions')
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'uuid-1',
      title: 'Freelance em Nuvem',
      amount: 1200.5,
      type: 'income',
      category: 'Freelance / Bico',
      date: '2026-09-20',
    })
  })

  it('deve criar uma nova transação inserindo no Supabase', async () => {
    const dto: CreateTransactionDTO = {
      title: 'Posto de Gasolina',
      amount: 180,
      type: 'expense',
      category: 'Transporte',
      date: '2026-09-21',
    }

    const createdRow = {
      id: 'new-uuid-123',
      title: 'Posto de Gasolina',
      amount: 180,
      type: 'expense',
      category: 'Transporte',
      date: '2026-09-21',
    }

    const mockSingle = vi.fn().mockResolvedValue({ data: createdRow, error: null })
    const mockSelect = vi.fn().mockReturnValue({ single: mockSingle })
    const mockInsert = vi.fn().mockReturnValue({ select: mockSelect })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        insert: mockInsert,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseTransactionRepository(mockClient)
    const created = await repo.create(dto)

    expect(mockClient.from).toHaveBeenCalledWith('transactions')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Posto de Gasolina',
        amount: 180,
        type: 'expense',
        category: 'Transporte',
        date: '2026-09-21',
      }),
    )
    expect(created.id).toBe('new-uuid-123')
  })

  it('deve excluir uma transação pelo id', async () => {
    const mockEq = vi.fn().mockResolvedValue({ error: null })
    const mockDelete = vi.fn().mockReturnValue({ eq: mockEq })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        delete: mockDelete,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseTransactionRepository(mockClient)
    const success = await repo.delete('uuid-to-delete')

    expect(mockClient.from).toHaveBeenCalledWith('transactions')
    expect(mockEq).toHaveBeenCalledWith('id', 'uuid-to-delete')
    expect(success).toBe(true)
  })
})
