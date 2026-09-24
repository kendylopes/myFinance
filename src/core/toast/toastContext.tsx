import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastAction {
  label: string
  onClick: () => void
}

export interface ToastItemData {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: ToastAction
}

export type ToastOptions = Omit<ToastItemData, 'id'>

export interface ToastContextValue {
  toasts: ToastItemData[]
  showToast: (options: ToastOptions) => string
  dismissToast: (id: string) => void
  success: (title: string, description?: string, options?: Partial<ToastOptions>) => string
  error: (title: string, description?: string, options?: Partial<ToastOptions>) => string
  info: (title: string, description?: string, options?: Partial<ToastOptions>) => string
  warning: (title: string, description?: string, options?: Partial<ToastOptions>) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 4000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([])
  const idCounter = useRef(0)

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((options: ToastOptions): string => {
    idCounter.current += 1
    const id = `toast-${Date.now()}-${idCounter.current}`

    const newToast: ToastItemData = {
      id,
      duration: options.duration ?? DEFAULT_DURATION,
      ...options,
    }

    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const success = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return showToast({
        type: 'success',
        title,
        description,
        ...options,
      })
    },
    [showToast],
  )

  const error = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return showToast({
        type: 'error',
        title,
        description,
        ...options,
      })
    },
    [showToast],
  )

  const info = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return showToast({
        type: 'info',
        title,
        description,
        ...options,
      })
    },
    [showToast],
  )

  const warning = useCallback(
    (title: string, description?: string, options?: Partial<ToastOptions>) => {
      return showToast({
        type: 'warning',
        title,
        description,
        ...options,
      })
    },
    [showToast],
  )

  const value = useMemo(
    () => ({
      toasts,
      showToast,
      dismissToast,
      success,
      error,
      info,
      warning,
    }),
    [toasts, showToast, dismissToast, success, error, info, warning],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

const noopToast = () => ''
const fallbackValue: ToastContextValue = {
  toasts: [],
  showToast: noopToast,
  dismissToast: () => {},
  success: noopToast,
  error: noopToast,
  info: noopToast,
  warning: noopToast,
}

/**
 * Hook para disparar e gerenciar notificações toast no app.
 * Retorna fallback seguro se chamado fora de <ToastProvider> (ex: testes unitários isolados).
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  return context ?? fallbackValue
}
