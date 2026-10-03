import { addMonthsToDate } from '../../core/formatters/date'
import type {
  BudgetProgress,
  BudgetStatus,
  CategoryExpenseSummary,
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
  TransactionFilterOptions,
} from '../models/transaction'
import { createTransactionSchema } from '../schemas/transactionSchema'

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Alimentação: '#f59e0b',
  Moradia: '#3b82f6',
  Transporte: '#8b5cf6',
  Serviços: '#06b6d4',
  Lazer: '#ec4899',
  Saúde: '#f43f5e',
  Educação: '#10b981',
  Trabalho: '#6366f1',
  Geral: '#64748b',
}

const FALLBACK_PALETTE = [
  '#f59e0b',
  '#3b82f6',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f43f5e',
  '#10b981',
  '#6366f1',
  '#14b8a6',
  '#f97316',
]

/**
 * Calcula a soma total de todas as transações de entrada (receitas).
 */
export const calculateTotalIncome = (transactions: Transaction[]): number => {
  return transactions
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
}

/**
 * Calcula a soma total de todas as transações de saída (despesas).
 */
export const calculateTotalExpense = (transactions: Transaction[]): number => {
  return transactions
    .filter((item) => item.type === 'expense')
    .reduce((acc, item) => acc + (Number(item.amount) || 0), 0)
}

/**
 * Calcula o saldo líquido (Entradas - Saídas).
 */
export const calculateBalance = (totalIncome: number, totalExpense: number): number => {
  return totalIncome - totalExpense
}

/**
 * Calcula a taxa de poupança (percentual da receita que foi economizado).
 */
export const calculateSavingsRate = (totalIncome: number, totalExpense: number): number => {
  if (totalIncome <= 0) return 0
  const saved = totalIncome - totalExpense
  if (saved <= 0) return 0
  return Math.round((saved / totalIncome) * 100)
}

/**
 * Retorna o resumo consolidado com Entradas, Saídas, Saldo Geral, e desdobramento entre Realizado e Pendente.
 */
export const calculateSummary = (transactions: Transaction[]): FinanceSummary => {
  let totalIncome = 0
  let totalExpense = 0
  let paidIncome = 0
  let pendingIncome = 0
  let paidExpense = 0
  let pendingExpense = 0

  for (const item of transactions) {
    const amount = Number(item.amount) || 0
    const isPaid = (item.status || 'paid') === 'paid'

    if (item.type === 'income') {
      totalIncome += amount
      if (isPaid) {
        paidIncome += amount
      } else {
        pendingIncome += amount
      }
    } else if (item.type === 'expense') {
      totalExpense += amount
      if (isPaid) {
        paidExpense += amount
      } else {
        pendingExpense += amount
      }
    }
  }

  const balance = calculateBalance(totalIncome, totalExpense)
  const liquidBalance = calculateBalance(paidIncome, paidExpense)
  const savingsRate = calculateSavingsRate(totalIncome, totalExpense)

  return {
    totalIncome,
    totalExpense,
    balance,
    paidIncome,
    pendingIncome,
    paidExpense,
    pendingExpense,
    liquidBalance,
    savingsRate,
  }
}

/**
 * Filtra uma lista de transações retornando apenas as que pertencem ao mês especificado (YYYY-MM).
 * Se yearMonth for 'all', retorna a lista completa.
 */
export const filterTransactionsByMonth = (
  transactions: Transaction[],
  yearMonth: string,
): Transaction[] => {
  if (!yearMonth || yearMonth === 'all') {
    return transactions
  }
  return transactions.filter((item) => item.date?.startsWith(yearMonth))
}

/**
 * Agrupa as despesas por categoria, calcula o percentual de cada uma sobre o total e ordena da maior para a menor.
 */
export const calculateExpensesByCategory = (
  transactions: Transaction[],
): CategoryExpenseSummary[] => {
  const expenses = transactions.filter((t) => t.type === 'expense' && t.amount > 0)
  if (expenses.length === 0) return []

  const totalExpense = expenses.reduce((acc, curr) => acc + curr.amount, 0)
  if (totalExpense === 0) return []

  // Agrupa a soma por categoria
  const map = new Map<string, number>()
  for (const item of expenses) {
    const cat = item.category?.trim() || 'Geral'
    map.set(cat, (map.get(cat) || 0) + item.amount)
  }

  // Converte para array ordenado da maior para a menor despesa
  const sortedCategories = Array.from(map.entries())
    .map(([category, amount], index) => {
      const percentage = (amount / totalExpense) * 100
      const color =
        DEFAULT_CATEGORY_COLORS[category] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length]

      return {
        category,
        amount,
        percentage: Number(percentage.toFixed(1)),
        color,
      }
    })
    .sort((a, b) => b.amount - a.amount)

  return sortedCategories
}

/**
 * Valida os dados de entrada de uma transação via schema Zod com mensagens em português.
 */
export const validateTransactionData = (
  data: CreateTransactionDTO,
): { isValid: boolean; error?: string } => {
  const result = createTransactionSchema.safeParse(data)
  if (!result.success) {
    return { isValid: false, error: result.error.issues[0]?.message || 'Dados inválidos.' }
  }
  return { isValid: true }
}

/**
 * Calcula o progresso do orçamento mensal com base no total de despesas e no teto orçamentário definido.
 */
export const calculateBudgetProgress = (
  totalExpense: number,
  budgetAmount: number,
): BudgetProgress => {
  const safeBudget = Number.isNaN(budgetAmount) || budgetAmount < 0 ? 0 : budgetAmount
  const safeExpense = Number.isNaN(totalExpense) || totalExpense < 0 ? 0 : totalExpense

  if (safeBudget === 0) {
    return {
      budgetAmount: 0,
      totalExpense: safeExpense,
      spentPercentage: 0,
      remainingAmount: 0,
      isExceeded: safeExpense > 0,
      status: safeExpense > 0 ? 'exceeded' : 'safe',
    }
  }

  const rawPercentage = (safeExpense / safeBudget) * 100
  const spentPercentage = Number(rawPercentage.toFixed(1))
  const remainingAmount = safeBudget - safeExpense
  const isExceeded = safeExpense > safeBudget

  let status: BudgetStatus = 'safe'
  if (isExceeded) {
    status = 'exceeded'
  } else if (spentPercentage >= 75) {
    status = 'warning'
  }

  return {
    budgetAmount: safeBudget,
    totalExpense: safeExpense,
    spentPercentage,
    remainingAmount,
    isExceeded,
    status,
  }
}

/**
 * Filtra transações combinando busca textual por título/categoria, filtro de categoria, tipo (receita/despesa) e status de pagamento.
 */
export const filterTransactions = (
  transactions: Transaction[],
  options: TransactionFilterOptions = {},
): Transaction[] => {
  const { searchQuery, category, type, status } = options

  const normalizedQuery = searchQuery?.trim().toLowerCase() || ''
  const hasQuery = normalizedQuery.length > 0
  const hasCategory = Boolean(category && category !== 'all')
  const hasType = Boolean(type && type !== 'all')
  const hasStatus = Boolean(status && status !== 'all')

  if (!hasQuery && !hasCategory && !hasType && !hasStatus) {
    return transactions
  }

  return transactions.filter((t) => {
    // Filtro por texto no título ou na categoria
    if (hasQuery) {
      const titleMatches = t.title.toLowerCase().includes(normalizedQuery)
      const categoryMatches = (t.category || '').toLowerCase().includes(normalizedQuery)
      if (!titleMatches && !categoryMatches) {
        return false
      }
    }

    // Filtro por categoria específica
    if (hasCategory && t.category !== category) {
      return false
    }

    // Filtro por tipo (income / expense)
    if (hasType && t.type !== type) {
      return false
    }

    // Filtro por status de pagamento (paid / pending)
    if (hasStatus) {
      const itemStatus = t.status || 'paid'
      if (itemStatus !== status) {
        return false
      }
    }

    return true
  })
}

/**
 * Inverte o status de pagamento de uma transação ('paid' <-> 'pending').
 */
export const togglePaymentStatus = (status?: string): 'paid' | 'pending' => {
  return status === 'pending' ? 'paid' : 'pending'
}

/**
 * Verifica se uma transação pendente está vencida em relação a uma data de referência (YYYY-MM-DD).
 */
export const isOverdue = (transaction: Transaction, referenceDate?: string): boolean => {
  if ((transaction.status || 'paid') === 'paid') return false
  const today = referenceDate || new Date().toISOString().split('T')[0]
  return transaction.date < today
}

/**
 * Divide um valor total em N parcelas com ajuste exato de centavos na primeira parcela.
 */
export const splitInstallmentAmounts = (totalAmount: number, count: number): number[] => {
  if (count <= 1) return [totalAmount]
  const base = Math.floor((totalAmount / count) * 100) / 100
  const remainder = Math.round((totalAmount - base * count) * 100) / 100
  const amounts = Array(count).fill(base)
  amounts[0] = Math.round((amounts[0] + remainder) * 100) / 100
  return amounts
}

/**
 * Extrai dados de parcelamento a partir do título (ex: "Notebook (1/10)").
 */
export const parseInstallment = (
  title: string,
): { baseTitle: string; current: number; total: number } | null => {
  const match = title.match(/^(.*?)\s*\((\d+)\/(\d+)\)$/)
  if (!match) return null
  const baseTitle = match[1].trim()
  const current = Number.parseInt(match[2], 10)
  const total = Number.parseInt(match[3], 10)
  if (Number.isNaN(current) || Number.isNaN(total) || total <= 1 || current > total) return null
  return { baseTitle, current, total }
}

/**
 * Gera a lista de transações a partir de uma DTO com recorrência ou parcelamento.
 */
export const generateRecurrenceTransactions = (
  dto: CreateTransactionDTO,
): CreateTransactionDTO[] => {
  const recurrence = dto.recurrence || 'single'
  const initialStatus = dto.status || 'paid'

  if (recurrence === 'single') {
    return [{ ...dto, status: initialStatus }]
  }

  const groupId = dto.groupId || `group_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`

  if (recurrence === 'installment') {
    const count = Math.max(2, dto.installmentsCount || 2)
    const isTotal = dto.isTotalAmount !== false // padrão: o valor digitado é o total
    const amounts = isTotal
      ? splitInstallmentAmounts(dto.amount, count)
      : Array(count).fill(dto.amount)

    return amounts.map((parcelAmount, index) => {
      const current = index + 1
      // Parcela 1 herda o status informado; parcelas futuras (2..N) entram como 'pending'
      const parcelStatus = index === 0 ? initialStatus : 'pending'

      return {
        title: `${dto.title.trim()} (${current}/${count})`,
        amount: parcelAmount,
        type: dto.type,
        category: dto.category.trim() || 'Geral',
        date: addMonthsToDate(dto.date, index),
        status: parcelStatus,
        recurrence: 'installment',
        installmentsCount: count,
        installmentCurrent: current,
        groupId,
      }
    })
  }

  if (recurrence === 'recurring') {
    const months = Math.max(2, dto.installmentsCount || 12)
    return Array.from({ length: months }, (_, index) => {
      const current = index + 1
      // Mês 1 herda o status informado; meses futuros entram como 'pending'
      const monthStatus = index === 0 ? initialStatus : 'pending'

      return {
        title: dto.title.trim(),
        amount: dto.amount,
        type: dto.type,
        category: dto.category.trim() || 'Geral',
        date: addMonthsToDate(dto.date, index),
        status: monthStatus,
        recurrence: 'recurring',
        installmentsCount: months,
        installmentCurrent: current,
        groupId,
      }
    })
  }

  return [{ ...dto, status: initialStatus }]
}
