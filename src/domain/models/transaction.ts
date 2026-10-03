export type TransactionType = 'income' | 'expense'

export type TransactionCategory =
  | 'Alimentação'
  | 'Moradia'
  | 'Transporte'
  | 'Trabalho'
  | 'Serviços'
  | 'Lazer'
  | 'Saúde'
  | 'Educação'
  | 'Geral'
  | string

export type RecurrenceType = 'single' | 'installment' | 'recurring'

export type PaymentStatus = 'paid' | 'pending'

export interface Transaction {
  id: string
  title: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  date: string
  status?: PaymentStatus
  recurrence?: RecurrenceType
  installmentsCount?: number
  installmentCurrent?: number
  isTotalAmount?: boolean
  groupId?: string
}

export interface CreateTransactionDTO {
  title: string
  amount: number
  type: TransactionType
  category: string
  date: string
  status?: PaymentStatus
  recurrence?: RecurrenceType
  installmentsCount?: number
  installmentCurrent?: number
  isTotalAmount?: boolean
  groupId?: string
}

export interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  balance: number
  paidIncome?: number
  pendingIncome?: number
  paidExpense?: number
  pendingExpense?: number
  liquidBalance?: number
  savingsRate?: number
}

export interface CategoryExpenseSummary {
  category: string
  amount: number
  percentage: number
  color: string
}

export type BudgetStatus = 'safe' | 'warning' | 'exceeded'

export interface BudgetProgress {
  budgetAmount: number
  totalExpense: number
  spentPercentage: number
  remainingAmount: number
  isExceeded: boolean
  status: BudgetStatus
}

export type TransactionFilterType = 'all' | 'income' | 'expense'
export type TransactionStatusFilter = 'all' | 'paid' | 'pending'

export interface TransactionFilterOptions {
  searchQuery?: string
  category?: string
  type?: TransactionFilterType
  status?: TransactionStatusFilter
}
