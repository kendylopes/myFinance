import type { CreateTransactionDTO, FinanceSummary, Transaction } from '../models/transaction'

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
