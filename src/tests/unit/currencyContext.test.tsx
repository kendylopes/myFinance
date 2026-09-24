import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  CurrencyProvider,
  formatCurrencyValue,
  useCurrency,
} from '../../core/currency/currencyContext'

describe('CurrencyContext (Sistema de Moedas Locais)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <CurrencyProvider>{children}</CurrencyProvider>
  )

  it('deve inicializar com o Real Brasileiro (BRL) como padrão', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    expect(result.current.currentCurrency.code).toBe('BRL')
    expect(result.current.currentCurrency.symbol).toBe('R$')
    expect(result.current.currencyCode).toBe('BRL')
  })

  it('deve formatar valores em BRL corretamente', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    const formatted = result.current.formatValue(1250.5)
    expect(formatted).toMatch(/1\.250,50/)
    expect(formatted).toMatch(/R\$/)
  })

  it('deve alternar para Dólar Americano (USD) e formatar corretamente', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })

    act(() => {
      result.current.setCurrency('USD')
    })

    expect(result.current.currentCurrency.code).toBe('USD')
    expect(result.current.currentCurrency.symbol).toBe('$')
    expect(localStorage.getItem('myfinance_currency')).toBe('USD')

    const formatted = result.current.formatValue(1250.5)
    expect(formatted).toMatch(/1,250\.50/)
    expect(formatted).toMatch(/\$/)
  })

  it('deve alternar para Euro (EUR) e formatar com símbolo de euro', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })

    act(() => {
      result.current.setCurrency('EUR')
    })

    expect(result.current.currentCurrency.code).toBe('EUR')
    expect(result.current.currentCurrency.symbol).toBe('€')
    expect(localStorage.getItem('myfinance_currency')).toBe('EUR')

    const formatted = result.current.formatValue(100)
    expect(formatted).toMatch(/€/)
  })

  it('deve listar todas as moedas suportadas (BRL, USD, EUR, GBP, JPY)', () => {
    const { result } = renderHook(() => useCurrency(), { wrapper })
    const codes = result.current.availableCurrencies.map((c) => c.code)
    expect(codes).toEqual(['BRL', 'USD', 'EUR', 'GBP', 'JPY'])
  })

  it('deve formatar adequadamente via utilitário formatCurrencyValue', () => {
    expect(formatCurrencyValue(500, 'BRL')).toMatch(/R\$\s?500,00/)
    expect(formatCurrencyValue(500, 'USD')).toMatch(/\$500\.00/)
    expect(formatCurrencyValue(Number.NaN, 'BRL')).toBe('R$ 0,00')
  })
})
