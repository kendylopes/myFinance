import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { AuthService } from '../../core/auth/authService'

describe('AuthService (Serviço de Autenticação Supabase Auth)', () => {
  it('deve cadastrar um novo usuário com sucesso quando a confirmação de e-mail não for exigida', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'user-123', email: 'teste@exemplo.com', user_metadata: { name: 'Kennedy' } },
        session: { access_token: 'fake-token' },
      },
      error: null,
    })

    const mockClient = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signUp('teste@exemplo.com', '123456', 'Kennedy')

    expect(result.success).toBe(true)
    expect(result.user?.id).toBe('user-123')
    expect(result.user?.name).toBe('Kennedy')
    expect(result.requiresEmailConfirmation).toBe(false)
  })

  it('deve indicar que requer confirmação de e-mail se não houver sessão ativa após o cadastro', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'user-456', email: 'novo@exemplo.com', user_metadata: {} },
        session: null,
      },
      error: null,
    })

    const mockClient = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signUp('novo@exemplo.com', '123456')

    expect(result.success).toBe(true)
    expect(result.requiresEmailConfirmation).toBe(true)
    expect(result.message).toContain('Verifique seu e-mail')
  })

  it('deve traduzir erro de e-mail já cadastrado amigavelmente', async () => {
    const mockSignUp = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'User already registered' },
    })

    const mockClient = {
      auth: { signUp: mockSignUp },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signUp('jaexiste@exemplo.com', '123456')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Já existe uma conta cadastrada com este e-mail.')
  })

  it('deve autenticar usuário com sucesso no signIn', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: {
        user: { id: 'user-789', email: 'login@exemplo.com', user_metadata: { name: 'Dev' } },
        session: { access_token: 'valid-token' },
      },
      error: null,
    })

    const mockClient = {
      auth: { signInWithPassword: mockSignIn },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signIn('login@exemplo.com', '123456')

    expect(result.success).toBe(true)
    expect(result.user?.id).toBe('user-789')
    expect(result.user?.email).toBe('login@exemplo.com')
  })

  it('deve traduzir credenciais inválidas no signIn', async () => {
    const mockSignIn = vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' },
    })

    const mockClient = {
      auth: { signInWithPassword: mockSignIn },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signIn('errado@exemplo.com', 'senhaerrada')

    expect(result.success).toBe(false)
    expect(result.error).toContain('E-mail ou senha incorretos')
  })

  it('deve realizar logout com sucesso', async () => {
    const mockSignOut = vi.fn().mockResolvedValue({ error: null })
    const mockClient = {
      auth: { signOut: mockSignOut },
    } as unknown as SupabaseClient

    const auth = new AuthService(mockClient)
    const result = await auth.signOut()

    expect(result.success).toBe(true)
    expect(mockSignOut).toHaveBeenCalled()
  })

  it('deve retornar null no getCurrentUser se não houver cliente configurado', async () => {
    const auth = new AuthService(null)
    const user = await auth.getCurrentUser()
    expect(user).toBeNull()
  })
})
