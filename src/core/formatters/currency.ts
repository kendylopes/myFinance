/**
 * Formata um valor numérico para o padrão de moeda do Real Brasileiro (R$ 0,00).
 */
export const formatCurrency = (value: number): string => {
  if (Number.isNaN(value)) return 'R$ 0,00'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
