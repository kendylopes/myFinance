/**
 * Formata uma data no formato YYYY-MM-DD para o formato pt-BR (DD/MM/AAAA).
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(`${dateString}T00:00:00`)
  if (Number.isNaN(date.getTime())) return dateString
  return date.toLocaleDateString('pt-BR')
}

/**
 * Retorna o mês e ano atual no formato YYYY-MM.
 */
export const getCurrentYearMonth = (): string => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/**
 * Formata uma string YYYY-MM para exibição por extenso (ex: "Setembro de 2026").
 */
export const formatMonthYear = (yearMonth: string): string => {
  if (!yearMonth || yearMonth === 'all') return 'Todos os períodos'
  const [year, month] = yearMonth.split('-').map(Number)
  if (!year || !month) return yearMonth

  const date = new Date(year, month - 1, 1)
  const formatted = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  // Coloca a primeira letra do mês em maiúscula (ex: "setembro de 2026" -> "Setembro de 2026")
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/**
 * Retorna o mês adjacente com base no deslocamento (-1 para anterior, +1 para próximo).
 */
export const getAdjacentMonth = (yearMonth: string, offset: number): string => {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year, month - 1 + offset, 1)
  const nextYear = date.getFullYear()
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0')
  return `${nextYear}-${nextMonth}`
}
