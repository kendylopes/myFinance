import { useEffect } from 'react'

export interface GlobalShortcutsConfig {
  onOpenNewTransaction: () => void
  onOpenImport?: () => void
  onOpenSettings?: () => void
  onOpenThemes?: () => void
  onSelectSection: (section: string) => void
  onCloseModals?: () => void
  onShowShortcutsHelp?: () => void
}

/**
 * Hook para atalhos globais de teclado (Hotkeys estilo Linear e Raycast)
 * Permite navegação rápida, abertura de modais e ações sem necessidade do mouse.
 */
export function useGlobalShortcuts({
  onOpenNewTransaction,
  onOpenImport,
  onOpenSettings,
  onOpenThemes,
  onSelectSection,
  onCloseModals,
  onShowShortcutsHelp,
}: GlobalShortcutsConfig) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInput =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)

      // Atalho Escape: sempre permitido para fechar modais
      if (event.key === 'Escape') {
        onCloseModals?.()
        return
      }

      // Atalho Ctrl+K ou Cmd+K para Nova Transação
      if ((event.ctrlKey || event.metaKey) && (event.key === 'k' || event.key === 'K')) {
        event.preventDefault()
        onOpenNewTransaction()
        return
      }

      // Atalhos de letra única ou números: ignorar quando estiver em campo de texto ou segurando modificadores
      if (isInput || event.ctrlKey || event.metaKey || event.altKey) {
        return
      }

      switch (event.key.toLowerCase()) {
        case 'n':
          event.preventDefault()
          onOpenNewTransaction()
          break
        case 'i':
          if (onOpenImport) {
            event.preventDefault()
            onOpenImport()
          }
          break
        case 's':
          if (onOpenSettings) {
            event.preventDefault()
            onOpenSettings()
          }
          break
        case 't':
          if (onOpenThemes) {
            event.preventDefault()
            onOpenThemes()
          }
          break
        case '?':
          if (onShowShortcutsHelp) {
            event.preventDefault()
            onShowShortcutsHelp()
          }
          break
        case '1':
          event.preventDefault()
          onSelectSection('dashboard')
          break
        case '2':
          event.preventDefault()
          onSelectSection('transactions')
          break
        case '3':
          event.preventDefault()
          onSelectSection('cards')
          break
        case '4':
          event.preventDefault()
          onSelectSection('debts')
          break
        case '5':
          event.preventDefault()
          onSelectSection('budget')
          break
        case '6':
          event.preventDefault()
          onSelectSection('categories')
          break
        case '7':
          event.preventDefault()
          onSelectSection('reports')
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onOpenNewTransaction,
    onOpenImport,
    onOpenSettings,
    onOpenThemes,
    onSelectSection,
    onCloseModals,
    onShowShortcutsHelp,
  ])
}
