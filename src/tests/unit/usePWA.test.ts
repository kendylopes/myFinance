import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { usePWA } from '../../presentation/hooks/usePWA'

describe('usePWA (Progressive Web App Hook)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('deve iniciar com isInstallable false em navegadores sem evento de prompt', () => {
    const { result } = renderHook(() => usePWA())
    expect(result.current.isInstallable).toBe(false)
  })

  it('deve habilitar isInstallable quando beforeinstallprompt for disparado', () => {
    const { result } = renderHook(() => usePWA())

    const mockPromptEvent = new Event('beforeinstallprompt') as unknown as {
      preventDefault: () => void
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
    }
    mockPromptEvent.preventDefault = vi.fn()
    mockPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
    mockPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })

    act(() => {
      window.dispatchEvent(mockPromptEvent as unknown as Event)
    })

    expect(result.current.isInstallable).toBe(true)
    expect(mockPromptEvent.preventDefault).toHaveBeenCalled()
  })

  it('deve chamar prompt e marcar isInstalled quando o usuário aceitar a instalação', async () => {
    const { result } = renderHook(() => usePWA())

    const mockPromptEvent = new Event('beforeinstallprompt') as unknown as {
      preventDefault: () => void
      prompt: () => Promise<void>
      userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
    }
    mockPromptEvent.preventDefault = vi.fn()
    mockPromptEvent.prompt = vi.fn().mockResolvedValue(undefined)
    mockPromptEvent.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })

    act(() => {
      window.dispatchEvent(mockPromptEvent as unknown as Event)
    })

    let success = false
    await act(async () => {
      success = await result.current.installApp()
    })

    expect(success).toBe(true)
    expect(mockPromptEvent.prompt).toHaveBeenCalled()
    expect(result.current.isInstalled).toBe(true)
    expect(result.current.isInstallable).toBe(false)
  })
})
