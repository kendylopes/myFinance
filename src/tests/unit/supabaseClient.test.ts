import { describe, expect, it } from 'vitest'
import { getSupabaseClient, isSupabaseConfigured } from '../../data/sources/supabaseClient'

describe('supabaseClient (Detecção e Instanciação)', () => {
  it('deve validar se o Supabase está configurado corretamente com base no ambiente', () => {
    const isConfigured = isSupabaseConfigured()
    expect(typeof isConfigured).toBe('boolean')

    if (isConfigured) {
      expect(getSupabaseClient()).not.toBeNull()
    } else {
      expect(getSupabaseClient()).toBeNull()
    }
  })
})
