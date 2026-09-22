import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from '../../data/sources/supabaseClient'

export interface AuthUser {
  id: string
  email: string
  name?: string
}

export interface AuthResult {
  success: boolean
  user?: AuthUser
  error?: string
  message?: string
  requiresEmailConfirmation?: boolean
}

/**
 * Mapeia o usuário do Supabase para a interface de domínio AuthUser
 */
function mapUser(
  supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null,
): AuthUser | null {
  if (!supabaseUser?.email) return null

  const metadataName =
    typeof supabaseUser.user_metadata?.name === 'string'
      ? supabaseUser.user_metadata.name
      : undefined

  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    name: metadataName || supabaseUser.email.split('@')[0],
  }
}

/**
 * Traduz mensagens de erro comuns do Supabase Auth para português amigável
 */
function translateAuthError(errorMessage: string): string {
  const lower = errorMessage.toLowerCase()
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
  }
  if (lower.includes('user already registered') || lower.includes('already registered')) {
    return 'Já existe uma conta cadastrada com este e-mail.'
  }
  if (lower.includes('password should be at least')) {
    return 'A senha deve conter no mínimo 6 caracteres.'
  }
  if (lower.includes('email not confirmed')) {
    return 'E-mail ainda não confirmado. Verifique a caixa de entrada do seu e-mail.'
  }
  if (lower.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Por favor, aguarde alguns instantes.'
  }
  return errorMessage
}

export class AuthService {
  private client: SupabaseClient | null

  constructor(customClient?: SupabaseClient | null) {
    this.client = customClient !== undefined ? customClient : getSupabaseClient()
  }

  private getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Supabase não configurado no ambiente.')
    }
    return this.client
  }

  /**
   * Realiza o cadastro de um novo usuário com e-mail, senha e nome opcional.
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      const client = this.getClient()
      const cleanEmail = email.trim()
      const cleanName = name?.trim()

      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName || cleanEmail.split('@')[0],
          },
        },
      })

      if (error) {
        return {
          success: false,
          error: translateAuthError(error.message),
        }
      }

      const user = mapUser(data.user)

      // Se a confirmação de e-mail estiver ativa, não há sessão de imediato
      if (!data.session && data.user) {
        return {
          success: true,
          user: user || undefined,
          requiresEmailConfirmation: true,
          message: 'Cadastro realizado com sucesso! Verifique seu e-mail para ativar sua conta.',
        }
      }

      return {
        success: true,
        user: user || undefined,
        requiresEmailConfirmation: false,
        message: 'Conta criada e autenticada com sucesso!',
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar cadastro'
      return { success: false, error: translateAuthError(msg) }
    }
  }

  /**
   * Realiza o login com e-mail e senha.
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const client = this.getClient()
      const cleanEmail = email.trim()

      const { data, error } = await client.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

      if (error) {
        return {
          success: false,
          error: translateAuthError(error.message),
        }
      }

      return {
        success: true,
        user: mapUser(data.user) || undefined,
        message: 'Login realizado com sucesso!',
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar login'
      return { success: false, error: translateAuthError(msg) }
    }
  }

  /**
   * Encerra a sessão ativa do usuário.
   */
  async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const client = this.getClient()
      const { error } = await client.auth.signOut()

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao desconectar'
      return { success: false, error: msg }
    }
  }

  /**
   * Retorna o usuário da sessão ativa atual, se houver.
   */
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      if (!this.client) return null
      const { data } = await this.client.auth.getUser()
      return mapUser(data.user)
    } catch {
      return null
    }
  }

  /**
   * Registra um listener para alterações de estado de autenticação (login, logout, refresh).
   * Retorna a função de unsubscribe.
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    if (!this.client) return () => {}

    const {
      data: { subscription },
    } = this.client.auth.onAuthStateChange((_event, session) => {
      callback(mapUser(session?.user || null))
    })

    return () => {
      subscription.unsubscribe()
    }
  }
}

export const authService = new AuthService()
