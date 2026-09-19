/**
 * Formata uma data no formato YYYY-MM-DD para o formato pt-BR (DD/MM/AAAA).
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('pt-BR')
}
