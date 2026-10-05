import { useCallback, useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detecta se já está rodando como PWA (standalone)
    const checkStandalone = () => {
      const isMatchMedia = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      const isStandaloneMode =
        (isMatchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' &&
          (window.navigator as unknown as { standalone?: boolean }).standalone === true)
      setIsInstalled(Boolean(isStandaloneMode))
    }

    checkStandalone()

    const handleBeforeInstallPrompt = (e: Event) => {
      // Impede o prompt padrão do Chrome para podermos mostrar nosso próprio botão
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const installApp = useCallback(async () => {
    if (!deferredPrompt) return false
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [deferredPrompt])

  return {
    isInstallable,
    isInstalled,
    installApp,
  }
}
