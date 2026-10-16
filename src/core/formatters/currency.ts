import { type CurrencyCode, formatCurrencyValue } from '../currency/currencyContext'

export type { CurrencyCode }

/**
 * Formata um valor numérico para o padrão de moeda local selecionada nas configurações.
 * Por padrão, formata em BRL (R$ 0,00) com fallback seguro.
 */
export const formatCurrency = (value: number, currencyCode?: CurrencyCode): string =>
  formatCurrencyValue(value, currencyCode)

export const formatBRL = (value: number): string => formatCurrencyValue(value)
export const formatCurrencyBRL = (value: number): string => formatCurrencyValue(value)
