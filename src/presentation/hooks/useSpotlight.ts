import { useEffect, useRef } from 'react'

/**
 * Hook para gerenciar iluminação de Spotlight dinâmica sob o cursor (padrão Raycast / Linear).
 * Registra listener passivo via ref nativo, sem poluir JSX e sem alertar regras de a11y do Biome.
 */
export function useSpotlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const handlePointerMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      el.style.setProperty('--mouse-x', `${x}px`)
      el.style.setProperty('--mouse-y', `${y}px`)
    }

    el.addEventListener('pointermove', handlePointerMove, { passive: true })
    return () => {
      el.removeEventListener('pointermove', handlePointerMove)
    }
  }, [])

  return ref
}
