import { type CurrencyCode, formatCurrencyValue } from '../currency/currencyContext'

/**
 * Formata um valor numérico para o padrão de moeda local selecionada nas configurações.
 * Por padrão, formata em BRL (R$ 0,00) com fallback seguro.
 */
export const formatCurrency = (value: number, currencyCode?: CurrencyCode): string => {
  return formatCurrencyValue(value, currencyCode)
}

export const formatBRL = (value: number): string => {
  return formatCurrencyValue(value)
}

export const formatCurrencyBRL = (value: number): string => {
  return formatCurrencyValue(value)
}
