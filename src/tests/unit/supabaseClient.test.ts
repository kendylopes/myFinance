import { describe, expect, it } from 'vitest'
import { getSupabaseClient, isSupabaseConfigured } from '../../data/sources/supabaseClient'

describe('supabaseClient (Detecção e Instanciação)', () => {
  it('deve retornar false para isSupabaseConfigured quando as variáveis de ambiente não estiverem preenchidas', () => {
    // Por padrão no ambiente de teste, VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não estão definidos
    expect(isSupabaseConfigured()).toBe(false)
  })

  it('deve retornar null em getSupabaseClient se não estiver configurado', () => {
    expect(getSupabaseClient()).toBeNull()
  })
})
