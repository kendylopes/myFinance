import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

export type CurrencyCode = 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY'

export interface CurrencyConfig {
  code: CurrencyCode
  name: string
  symbol: string
  locale: string
  flag: string
}

export const CURRENCIES: Record<CurrencyCode, CurrencyConfig> = {
  BRL: {
    code: 'BRL',
    name: 'Real Brasileiro',
    symbol: 'R$',
    locale: 'pt-BR',
    flag: '🇧🇷',
  },
  USD: {
    code: 'USD',
    name: 'Dólar Americano',
    symbol: '$',
    locale: 'en-US',
    flag: '🇺🇸',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    locale: 'de-DE',
    flag: '🇪🇺',
  },
  GBP: {
    code: 'GBP',
    name: 'Libra Esterlina',
    symbol: '£',
    locale: 'en-GB',
    flag: '🇬🇧',
  },
  JPY: {
    code: 'JPY',
    name: 'Iene Japonês',
    symbol: '¥',
    locale: 'ja-JP',
    flag: '🇯🇵',
  },
}

export const CURRENCY_STORAGE_KEY = 'myfinance_currency'

interface CurrencyContextType {
  currentCurrency: CurrencyConfig
  currencyCode: CurrencyCode
  setCurrency: (code: CurrencyCode) => void
  formatValue: (value: number) => string
  availableCurrencies: CurrencyConfig[]
}

const CurrencyContext = createContext<CurrencyContextType | null>(null)

// Variável em memória para sincronização com formatters utilitários fora do React
let globalCurrencyCode: CurrencyCode = 'BRL'

export function getGlobalCurrencyCode(): CurrencyCode {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode | null
      if (stored && CURRENCIES[stored]) {
        globalCurrencyCode = stored
      }
    } catch {
      // Ignora erro de acesso a localStorage
    }
  }
  return globalCurrencyCode
}

export function formatCurrencyValue(value: number, code?: CurrencyCode): string {
  const activeCode = code || getGlobalCurrencyCode()
  const config = CURRENCIES[activeCode] || CURRENCIES.BRL

  if (Number.isNaN(value)) {
    return `${config.symbol} 0,00`
  }

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    minimumFractionDigits: config.code === 'JPY' ? 0 : 2,
    maximumFractionDigits: config.code === 'JPY' ? 0 : 2,
  }).format(value)
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currencyCode, setCurrencyCode] = useState<CurrencyCode>(() => {
    return getGlobalCurrencyCode()
  })

  const currentCurrency = useMemo(() => CURRENCIES[currencyCode] || CURRENCIES.BRL, [currencyCode])

  const setCurrency = useCallback((code: CurrencyCode) => {
    if (CURRENCIES[code]) {
      setCurrencyCode(code)
      globalCurrencyCode = code
      try {
        localStorage.setItem(CURRENCY_STORAGE_KEY, code)
        // Dispara evento de storage para sincronizar outras instâncias/componentes
        window.dispatchEvent(new Event('currency-change'))
      } catch {
        // Ignora erro
      }
    }
  }, [])

  const formatValue = useCallback(
    (value: number) => {
      return formatCurrencyValue(value, currencyCode)
    },
    [currencyCode],
  )

  useEffect(() => {
    globalCurrencyCode = currencyCode
  }, [currencyCode])

  const value = useMemo(
    () => ({
      currentCurrency,
      currencyCode,
      setCurrency,
      formatValue,
      availableCurrencies: Object.values(CURRENCIES),
    }),
    [currentCurrency, currencyCode, setCurrency, formatValue],
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext)
  if (!context) {
    // Fallback gracioso caso seja usado fora de CurrencyProvider
    const fallbackCurrency = CURRENCIES[getGlobalCurrencyCode()] || CURRENCIES.BRL
    return {
      currentCurrency: fallbackCurrency,
      currencyCode: fallbackCurrency.code,
      setCurrency: (code: CurrencyCode) => {
        globalCurrencyCode = code
        try {
          localStorage.setItem(CURRENCY_STORAGE_KEY, code)
        } catch {
          // Ignora
        }
      },
      formatValue: (val: number) => formatCurrencyValue(val, fallbackCurrency.code),
      availableCurrencies: Object.values(CURRENCIES),
    }
  }
  return context
}
