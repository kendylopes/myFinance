import { getCurrentYearMonth, getLocalDateString } from '../../core/formatters/date'
import type { Transaction } from '../models/transaction'
import { parseInstallment } from './financeCalculations'

export interface InstallmentGroup {
  id: string
  title: string
  category: string
  totalAmount: number
  installmentAmount: number
  totalInstallments: number
  paidCount: number
  pendingCount: number
  progressPercent: number
  nextDueDate: string | null
  items: Transaction[]
  isCompleted: boolean
}

export interface MonthlyForecast {
  yearMonth: string // YYYY-MM
  monthLabel: string // Ex: "Out/26", "Nov/26"
  totalAmount: number
  itemsCount: number
  purchases: {
    title: string
    installment: string // Ex: "(3/10)"
    amount: number
    status: 'paid' | 'pending'
    category: string
  }[]
}

const MONTH_NAMES = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
]

/**
 * Formata "YYYY-MM" para rótulo legível (Ex: "Out/26")
 */
export function formatMonthLabel(yearMonth: string): string {
  const [yearStr, monthStr] = yearMonth.split('-')
  const monthIdx = Number.parseInt(monthStr, 10) - 1
  const shortYear = yearStr ? yearStr.slice(2) : ''
  const monthName = MONTH_NAMES[monthIdx] || monthStr
  return `${monthName}/${shortYear}`
}

/**
 * Agrupa transações parceladas ativas e concluídas.
 */
export function getInstallmentGroups(transactions: Transaction[]): InstallmentGroup[] {
  // Considera apenas despesas
  const expenseList = transactions.filter((t) => t.type === 'expense')

  const groupsMap = new Map<string, Transaction[]>()

  for (const tx of expenseList) {
    const parsed = parseInstallment(tx.title)
    if (parsed || tx.recurrence === 'installment' || tx.groupId) {
      const key =
        tx.groupId ||
        (parsed ? parsed.baseTitle.toLowerCase().trim() : tx.title.toLowerCase().trim())
      const existing = groupsMap.get(key) || []
      existing.push(tx)
      groupsMap.set(key, existing)
    }
  }

  const result: InstallmentGroup[] = []

  for (const [key, items] of groupsMap.entries()) {
    // Ordena itens pela data
    items.sort((a, b) => a.date.localeCompare(b.date))

    const first = items[0]
    const parsedFirst = parseInstallment(first.title)

    const baseTitle = parsedFirst ? parsedFirst.baseTitle : first.title
    const totalInstallments = parsedFirst
      ? parsedFirst.total
      : first.installmentsCount || items.length

    const paidCount = items.filter((t) => t.status === 'paid').length
    const pendingItems = items.filter((t) => (t.status || 'paid') === 'pending')
    const pendingCount = pendingItems.length

    const totalAmount = items.reduce((acc, t) => acc + t.amount, 0)
    const installmentAmount = items.length > 0 ? items[0].amount : 0

    const nextDueItem = pendingItems.find((t) => t.date >= getLocalDateString()) || pendingItems[0]

    const progressPercent =
      totalInstallments > 0 ? Math.min(100, Math.round((paidCount / totalInstallments) * 100)) : 0

    result.push({
      id: key,
      title: baseTitle,
      category: first.category || 'Geral',
      totalAmount,
      installmentAmount,
      totalInstallments,
      paidCount,
      pendingCount,
      progressPercent,
      nextDueDate: nextDueItem ? nextDueItem.date : null,
      items,
      isCompleted: paidCount >= totalInstallments && totalInstallments > 0,
    })
  }

  // Ordena pelas compras com parcelas ainda pendentes primeiro
  return result.sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) {
      return a.isCompleted ? 1 : -1
    }
    return (b.nextDueDate || '').localeCompare(a.nextDueDate || '')
  })
}

/**
 * Calcula a projeção mensal de faturas de cartão e parcelamentos futuros.
 */
export function getMonthlyInstallmentForecast(
  transactions: Transaction[],
  monthsAhead = 12,
): MonthlyForecast[] {
  const currentYM = getCurrentYearMonth()
  const [currentYearStr, currentMonthStr] = currentYM.split('-')
  let startYear = Number.parseInt(currentYearStr, 10)
  let startMonth = Number.parseInt(currentMonthStr, 10)

  const forecasts: MonthlyForecast[] = []

  // Mapeia parcelas por mês
  const expenseList = transactions.filter((t) => t.type === 'expense')
  const installmentTxs = expenseList.filter((t) => {
    return parseInstallment(t.title) !== null || t.recurrence === 'installment'
  })

  for (let i = 0; i < monthsAhead; i++) {
    const ym = `${startYear}-${String(startMonth).padStart(2, '0')}`

    const monthItems = installmentTxs.filter((t) => t.date.startsWith(ym))
    const totalAmount = monthItems.reduce((acc, t) => acc + t.amount, 0)

    const purchases = monthItems.map((t) => {
      const parsed = parseInstallment(t.title)
      return {
        title: parsed ? parsed.baseTitle : t.title,
        installment: parsed ? `(${parsed.current}/${parsed.total})` : '',
        amount: t.amount,
        status: (t.status || 'paid') as 'paid' | 'pending',
        category: t.category,
      }
    })

    forecasts.push({
      yearMonth: ym,
      monthLabel: formatMonthLabel(ym),
      totalAmount,
      itemsCount: monthItems.length,
      purchases,
    })

    // Próximo mês
    startMonth += 1
    if (startMonth > 12) {
      startMonth = 1
      startYear += 1
    }
  }

  return forecasts
}
