import type { FinanceSummary, Transaction } from '../models/transaction'
import {
  calculateBalance,
  calculateSavingsRate,
  calculateTotalExpense,
  calculateTotalIncome,
} from './financeCalculations'

export type ReportPeriodType = 'week' | 'month' | 'year' | 'custom'

export interface DateRange {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  label: string
}

export interface DailyEvolutionItem {
  date: string
  dayLabel: string
  income: number
  expense: number
  balance: number
}

export interface MonthlyEvolutionItem {
  yearMonth: string
  monthLabel: string
  income: number
  expense: number
  balance: number
}

export interface ReportData {
  periodType: ReportPeriodType
  range: DateRange
  summary: FinanceSummary
  previousSummary: FinanceSummary
  incomeChangePercent: number
  expenseChangePercent: number
  balanceChangePercent: number
  transactions: Transaction[]
  topExpenses: Transaction[]
  dailyEvolution: DailyEvolutionItem[]
  monthlyEvolution: MonthlyEvolutionItem[]
  averageDailyExpense: number
  highestSpendingDay?: { dayLabel: string; date: string; amount: number }
}

/**
 * Retorna uma data no formato ISO YYYY-MM-DD usando horário local.
 */
export const toLocalISODate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Retorna o intervalo de datas (startDate, endDate e label legível) para o tipo de período selecionado.
 */
export const getReportDateRange = (
  type: ReportPeriodType,
  referenceDate = new Date(),
  customStart?: string,
  customEnd?: string,
): DateRange => {
  if (type === 'custom' && customStart && customEnd) {
    const sDate = new Date(`${customStart}T00:00:00`)
    const eDate = new Date(`${customEnd}T00:00:00`)
    return {
      startDate: customStart,
      endDate: customEnd,
      label: `${sDate.toLocaleDateString('pt-BR')} até ${eDate.toLocaleDateString('pt-BR')}`,
    }
  }

  const ref = new Date(referenceDate)

  if (type === 'week') {
    // Últimos 7 dias (terminando hoje)
    const end = new Date(ref)
    const start = new Date(ref)
    start.setDate(end.getDate() - 6)

    return {
      startDate: toLocalISODate(start),
      endDate: toLocalISODate(end),
      label: `Últimos 7 dias (${start.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} - ${end.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })})`,
    }
  }

  if (type === 'year') {
    const year = ref.getFullYear()
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
      label: `Ano de ${year}`,
    }
  }

  // Padrão: 'month' (Mês atual de referência)
  const year = ref.getFullYear()
  const month = ref.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  const monthName = start.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1)

  return {
    startDate: toLocalISODate(start),
    endDate: toLocalISODate(end),
    label: capitalized,
  }
}

/**
 * Retorna o intervalo correspondente ao período anterior para comparativo.
 */
export const getPreviousReportDateRange = (
  type: ReportPeriodType,
  currentRange: DateRange,
): DateRange => {
  const currentStart = new Date(`${currentRange.startDate}T00:00:00`)
  const currentEnd = new Date(`${currentRange.endDate}T00:00:00`)

  if (type === 'week') {
    const prevEnd = new Date(currentStart)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    prevStart.setDate(prevEnd.getDate() - 6)
    return {
      startDate: toLocalISODate(prevStart),
      endDate: toLocalISODate(prevEnd),
      label: 'Semana Anterior',
    }
  }

  if (type === 'month') {
    const prevMonthDate = new Date(currentStart.getFullYear(), currentStart.getMonth() - 1, 1)
    const prevMonthEnd = new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1, 0)
    return {
      startDate: toLocalISODate(prevMonthDate),
      endDate: toLocalISODate(prevMonthEnd),
      label: 'Mês Anterior',
    }
  }

  if (type === 'year') {
    const prevYear = currentStart.getFullYear() - 1
    return {
      startDate: `${prevYear}-01-01`,
      endDate: `${prevYear}-12-31`,
      label: `Ano Anterior (${prevYear})`,
    }
  }

  // Custom: mesmo número de dias imediatamente anterior
  const diffTime = Math.abs(currentEnd.getTime() - currentStart.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  const prevEnd = new Date(currentStart)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevEnd.getDate() - (diffDays - 1))

  return {
    startDate: toLocalISODate(prevStart),
    endDate: toLocalISODate(prevEnd),
    label: 'Período Anterior',
  }
}

/**
 * Filtra transações pelo intervalo inclusivo de datas [startDate, endDate].
 */
export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): Transaction[] => {
  return transactions.filter((tx) => {
    return tx.date >= startDate && tx.date <= endDate
  })
}

/**
 * Calcula a variação percentual entre o valor atual e o anterior.
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0
  }
  const change = ((current - previous) / Math.abs(previous)) * 100
  return Math.round(change)
}

/**
 * Constrói a evolução diária de receitas e despesas no intervalo informado.
 */
export const buildDailyEvolution = (
  transactions: Transaction[],
  startDate: string,
  endDate: string,
): DailyEvolutionItem[] => {
  const start = new Date(`${startDate}T00:00:00`)
  const end = new Date(`${endDate}T00:00:00`)

  const daysMap = new Map<string, { income: number; expense: number }>()

  // Popula todos os dias do intervalo para não haver buracos no gráfico
  const current = new Date(start)
  while (current <= end) {
    const key = toLocalISODate(current)
    daysMap.set(key, { income: 0, expense: 0 })
    current.setDate(current.getDate() + 1)
  }

  // Agrega as transações
  for (const tx of transactions) {
    const entry = daysMap.get(tx.date)
    if (entry) {
      const amount = Number(tx.amount) || 0
      if (tx.type === 'income') {
        entry.income += amount
      } else {
        entry.expense += amount
      }
    }
  }

  const weekdayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return Array.from(daysMap.entries()).map(([dateStr, values]) => {
    const d = new Date(`${dateStr}T00:00:00`)
    const dayLabel = `${weekdayNames[d.getDay()]} (${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')})`
    return {
      date: dateStr,
      dayLabel,
      income: values.income,
      expense: values.expense,
      balance: values.income - values.expense,
    }
  })
}

/**
 * Constrói a evolução mês a mês para uma visão anual completa (12 meses).
 */
export const buildMonthlyEvolution = (
  transactions: Transaction[],
  year: number,
): MonthlyEvolutionItem[] => {
  const monthNames = [
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

  const months: MonthlyEvolutionItem[] = []

  for (let m = 0; m < 12; m++) {
    const monthNum = String(m + 1).padStart(2, '0')
    const yearMonth = `${year}-${monthNum}`

    const monthTx = transactions.filter((tx) => tx.date.startsWith(yearMonth))
    const income = calculateTotalIncome(monthTx)
    const expense = calculateTotalExpense(monthTx)
    const balance = calculateBalance(income, expense)

    months.push({
      yearMonth,
      monthLabel: monthNames[m],
      income,
      expense,
      balance,
    })
  }

  return months
}

/**
 * Retorna as maiores despesas pontuais do período.
 */
export const getTopExpenses = (transactions: Transaction[], limit = 5): Transaction[] => {
  return transactions
    .filter((tx) => tx.type === 'expense')
    .sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0))
    .slice(0, limit)
}

/**
 * Gera todos os dados e métricas consolidadas para a tela de relatórios.
 */
export const generateReportData = (
  allTransactions: Transaction[],
  periodType: ReportPeriodType,
  referenceDate = new Date(),
  customStart?: string,
  customEnd?: string,
): ReportData => {
  const range = getReportDateRange(periodType, referenceDate, customStart, customEnd)
  const previousRange = getPreviousReportDateRange(periodType, range)

  const currentTxs = filterTransactionsByDateRange(allTransactions, range.startDate, range.endDate)
  const previousTxs = filterTransactionsByDateRange(
    allTransactions,
    previousRange.startDate,
    previousRange.endDate,
  )

  const income = calculateTotalIncome(currentTxs)
  const expense = calculateTotalExpense(currentTxs)
  const balance = calculateBalance(income, expense)
  const savingsRate = calculateSavingsRate(income, expense)

  const prevIncome = calculateTotalIncome(previousTxs)
  const prevExpense = calculateTotalExpense(previousTxs)
  const prevBalance = calculateBalance(prevIncome, prevExpense)
  const prevSavingsRate = calculateSavingsRate(prevIncome, prevExpense)

  const incomeChangePercent = calculatePercentageChange(income, prevIncome)
  const expenseChangePercent = calculatePercentageChange(expense, prevExpense)
  const balanceChangePercent = calculatePercentageChange(balance, prevBalance)

  const currentSummary: FinanceSummary = {
    totalIncome: income,
    totalExpense: expense,
    balance,
    savingsRate,
  }

  const previousSummary: FinanceSummary = {
    totalIncome: prevIncome,
    totalExpense: prevExpense,
    balance: prevBalance,
    savingsRate: prevSavingsRate,
  }

  const topExpenses = getTopExpenses(currentTxs, 5)
  const dailyEvolution = buildDailyEvolution(currentTxs, range.startDate, range.endDate)

  const currentYear = new Date(`${range.startDate}T00:00:00`).getFullYear()
  const monthlyEvolution = buildMonthlyEvolution(allTransactions, currentYear)

  // Média diária de gastos
  const diffDays = Math.max(1, dailyEvolution.length)
  const averageDailyExpense = expense / diffDays

  // Dia de maior gasto no período
  let highestSpendingDay: { dayLabel: string; date: string; amount: number } | undefined
  if (dailyEvolution.length > 0) {
    const sorted = [...dailyEvolution].sort((a, b) => b.expense - a.expense)
    if (sorted[0] && sorted[0].expense > 0) {
      highestSpendingDay = {
        dayLabel: sorted[0].dayLabel,
        date: sorted[0].date,
        amount: sorted[0].expense,
      }
    }
  }

  return {
    periodType,
    range,
    summary: currentSummary,
    previousSummary,
    incomeChangePercent,
    expenseChangePercent,
    balanceChangePercent,
    transactions: currentTxs,
    topExpenses,
    dailyEvolution,
    monthlyEvolution,
    averageDailyExpense,
    highestSpendingDay,
  }
}
