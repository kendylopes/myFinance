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

export interface Transaction {
  id: string
  title: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  date: string
}

export interface CreateTransactionDTO {
  title: string
  amount: number
  type: TransactionType
  category: string
  date: string
}

export interface FinanceSummary {
  totalIncome: number
  totalExpense: number
  balance: number
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
