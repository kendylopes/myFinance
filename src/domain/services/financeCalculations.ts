import type {
  BudgetProgress,
  BudgetStatus,
  CategoryExpenseSummary,
  CreateTransactionDTO,
  FinanceSummary,
  Transaction,
} from '../models/transaction'

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
 * Retorna o resumo consolidado com Entradas, Saídas e Saldo Líquido.
 */
export const calculateSummary = (transactions: Transaction[]): FinanceSummary => {
  const totalIncome = calculateTotalIncome(transactions)
  const totalExpense = calculateTotalExpense(transactions)
  const balance = calculateBalance(totalIncome, totalExpense)

  return {
    totalIncome,
    totalExpense,
    balance,
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
 * Valida se os dados para criar uma nova transação são válidos.
 */
export const validateTransactionData = (
  data: CreateTransactionDTO,
): { isValid: boolean; error?: string } => {
  if (!data.title || data.title.trim().length === 0) {
    return { isValid: false, error: 'A descrição é obrigatória.' }
  }

  if (Number.isNaN(data.amount) || data.amount <= 0) {
    return { isValid: false, error: 'O valor deve ser um número positivo maior que zero.' }
  }

  if (data.type !== 'income' && data.type !== 'expense') {
    return { isValid: false, error: 'O tipo da transação deve ser receita ou despesa.' }
  }

  if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    return { isValid: false, error: 'A data informada é inválida (use o formato AAAA-MM-DD).' }
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
