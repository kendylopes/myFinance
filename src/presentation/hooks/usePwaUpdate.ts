import { useEffect, useRef } from 'react'
import { useToast } from '../../core/toast/toastContext'

/**
 * Hook para monitorar novas versões do Service Worker em produção
 * e exibir notificação de atualização amigável com botão de ação rápida.
 */
export function usePwaUpdate() {
  const toast = useToast()
  const hasNotifiedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const handleUpdate = (registration: ServiceWorkerRegistration) => {
      if (hasNotifiedRef.current) return
      hasNotifiedRef.current = true

      toast.info('Atualização Disponível', 'Uma nova versão do myFinance está pronta.', {
        duration: 0, // Permanece visível até o usuário interagir
        action: {
          label: 'Atualizar agora',
          onClick: () => {
            if (registration.waiting) {
              registration.waiting.postMessage({ type: 'SKIP_WAITING' })
            }
            window.location.reload()
          },
        },
      })
    }

    navigator.serviceWorker.getRegistration().then((registration) => {
      if (!registration) return

      // Caso já exista uma versão nova aguardando ativação
      if (registration.waiting) {
        handleUpdate(registration)
        return
      }

      // Caso uma nova versão seja baixada em segundo plano durante a navegação
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (!newWorker) return

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            handleUpdate(registration)
          }
        })
      })
    })

    // Recarrega automaticamente quando o novo service worker assume o controle
    let refreshing = false
    const onControllerChange = () => {
      if (!refreshing) {
        refreshing = true
        window.location.reload()
      }
    }

    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
    }
  }, [toast])
}
