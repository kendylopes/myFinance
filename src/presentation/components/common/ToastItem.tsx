import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToastItemData } from '../../../core/toast/toastContext'

interface ToastItemProps {
  toast: ToastItemData
  onDismiss: (id: string) => void
}

const TYPE_CONFIG = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    progressBg: 'bg-emerald-500',
    ariaRole: 'status',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    progressBg: 'bg-rose-500',
    ariaRole: 'alert',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    progressBg: 'bg-amber-500',
    ariaRole: 'alert',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-sky-500/15',
    badgeText: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    progressBg: 'bg-sky-500',
    ariaRole: 'status',
  },
} as const

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const remainingTimeRef = useRef(toast.duration ?? 4000)
  const startTimeRef = useRef(Date.now())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const config = TYPE_CONFIG[toast.type]
  const Icon = config.icon

  const handleClose = useCallback(() => {
    setIsClosing(true)
    setTimeout(() => {
      onDismiss(toast.id)
    }, 200) // tempo da micro-animação de saída
  }, [onDismiss, toast.id])

  useEffect(() => {
    if (!toast.duration || toast.duration <= 0) return

    if (!isPaused) {
      startTimeRef.current = Date.now()
      timerRef.current = setTimeout(() => {
        handleClose()
      }, remainingTimeRef.current)
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isPaused, toast.duration, handleClose])

  const handlePointerEnter = () => {
    if (!toast.duration || toast.duration <= 0) return
    setIsPaused(true)
    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }
    const elapsed = Date.now() - startTimeRef.current
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed)
  }

  const handlePointerLeave = () => {
    if (!toast.duration || toast.duration <= 0) return
    setIsPaused(false)
  }

  return (
    <div
      role={config.ariaRole}
      aria-live="polite"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={`pointer-events-auto relative overflow-hidden rounded-xl border p-4 shadow-xl backdrop-blur-md transition-all duration-200 bg-(--color-surface,rgba(15,16,19,0.92)) text-(--color-text,#f4f4f5) ${
        config.borderColor
      } ${
        isClosing
          ? 'opacity-0 translate-y-2 scale-95'
          : 'opacity-100 translate-y-0 scale-100 animate-in fade-in slide-in-from-bottom-3 duration-300'
      }`}
      style={{
        boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Ícone de status */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.badgeBg} ${config.badgeText}`}
        >
          <Icon className="h-5 w-5" />
        </div>

        {/* Conteúdo textual */}
        <div className="flex-1 min-w-0 pr-1">
          <h4 className="text-sm font-semibold tracking-tight text-white">{toast.title}</h4>
          {toast.description && (
            <p className="mt-1 text-xs text-(--color-text-muted,#a1a1aa) leading-relaxed">
              {toast.description}
            </p>
          )}

          {/* Botão de ação opcional */}
          {toast.action && (
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick()
                handleClose()
              }}
              className="mt-2 text-xs font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Fechar notificação"
          className="shrink-0 -mr-1 -mt-1 p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progresso do timer sutil */}
      {toast.duration && toast.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/5 overflow-hidden">
          <div
            className={`h-full ${config.progressBg} transition-all`}
            style={{
              width: isPaused ? '100%' : '0%',
              transitionDuration: isPaused ? '0ms' : `${remainingTimeRef.current}ms`,
              transitionTimingFunction: 'linear',
            }}
          />
        </div>
      )}
    </div>
  )
}
