import { useCallback, useEffect, useState } from 'react'
import { type AuthResult, type AuthUser, authService } from '../../core/auth/authService'

export interface UseAuthReturn {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, pass: string) => Promise<AuthResult>
  register: (email: string, pass: string, name?: string) => Promise<AuthResult>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    let isMounted = true

    // 1. Carrega o usuário atual na inicialização
    authService
      .getCurrentUser()
      .then((currentUser) => {
        if (isMounted) {
          setUser(currentUser)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    // 2. Escuta mudanças na autenticação em tempo real
    const unsubscribe = authService.onAuthStateChange((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser)
        setIsLoading(false)
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, pass: string): Promise<AuthResult> => {
    setIsLoading(true)
    const result = await authService.signIn(email, pass)
    if (result.success && result.user) {
      setUser(result.user)
    }
    setIsLoading(false)
    return result
  }, [])

  const register = useCallback(
    async (email: string, pass: string, name?: string): Promise<AuthResult> => {
      setIsLoading(true)
      const result = await authService.signUp(email, pass, name)
      if (result.success && result.user && !result.requiresEmailConfirmation) {
        setUser(result.user)
      }
      setIsLoading(false)
      return result
    },
    [],
  )

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    await authService.signOut()
    setUser(null)
    setIsLoading(false)
  }, [])

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }
}
