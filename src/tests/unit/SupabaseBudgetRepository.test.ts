import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_BUDGET_AMOUNT,
  SupabaseBudgetRepository,
} from '../../data/repositories/SupabaseBudgetRepository'

describe('SupabaseBudgetRepository (Metas em Nuvem)', () => {
  it('deve retornar DEFAULT_BUDGET_AMOUNT se o cliente não estiver configurado', async () => {
    const repo = new SupabaseBudgetRepository(null)
    const amount = await repo.getBudget('2026-09')
    expect(amount).toBe(DEFAULT_BUDGET_AMOUNT)
  })

  it('deve retornar o orçamento específico do mês quando encontrado no Supabase', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { budget_amount: '4500.00' },
      error: null,
    })
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle })
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: mockSelect,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseBudgetRepository(mockClient)
    const amount = await repo.getBudget('2026-09')

    expect(mockClient.from).toHaveBeenCalledWith('budgets')
    expect(mockEq).toHaveBeenCalledWith('id', '2026-09')
    expect(amount).toBe(4500)
  })

  it('deve salvar o orçamento via upsert', async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null })
    const mockClient = {
      from: vi.fn().mockReturnValue({
        upsert: mockUpsert,
      }),
    } as unknown as SupabaseClient

    const repo = new SupabaseBudgetRepository(mockClient)
    await repo.setBudget('2026-09', 5000)

    expect(mockClient.from).toHaveBeenCalledWith('budgets')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '2026-09',
        budget_amount: 5000,
      }),
      { onConflict: 'user_id, id' },
    )
  })
})
