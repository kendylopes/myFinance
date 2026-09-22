import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeProvider, useTheme } from '../../core/theme/themeContext'

describe('ThemeContext (Sistema de 5 Temas Dev)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ThemeProvider>{children}</ThemeProvider>
  )

  it('deve iniciar com o tema padrão emerald matrix', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.currentTheme.id).toBe('emerald')
    expect(result.current.currentTheme.name).toBe('Emerald Matrix')
    expect(document.documentElement.getAttribute('data-theme')).toBe('emerald')
  })

  it('deve listar os 5 temas de desenvolvedor disponíveis', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.availableThemes).toHaveLength(5)
    const ids = result.current.availableThemes.map((t) => t.id)
    expect(ids).toEqual(['emerald', 'dracula', 'tokyo-night', 'catppuccin', 'one-dark'])
  })

  it('deve alternar para o tema Dracula e persistir no DOM e localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('dracula')
    })

    expect(result.current.currentTheme.id).toBe('dracula')
    expect(result.current.currentTheme.name).toBe('Dracula Official')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dracula')
    expect(localStorage.getItem('myfinance_dev_theme')).toBe('dracula')
  })

  it('deve alternar para Tokyo Night, Catppuccin e One Dark com sucesso', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => {
      result.current.setTheme('tokyo-night')
    })
    expect(result.current.currentTheme.id).toBe('tokyo-night')
    expect(document.documentElement.getAttribute('data-theme')).toBe('tokyo-night')

    act(() => {
      result.current.setTheme('catppuccin')
    })
    expect(result.current.currentTheme.id).toBe('catppuccin')
    expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin')

    act(() => {
      result.current.setTheme('one-dark')
    })
    expect(result.current.currentTheme.id).toBe('one-dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('one-dark')
  })

  it('deve restaurar o tema salvo no localStorage na inicialização', () => {
    localStorage.setItem('myfinance_dev_theme', 'catppuccin')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.currentTheme.id).toBe('catppuccin')
    expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin')
  })
})
