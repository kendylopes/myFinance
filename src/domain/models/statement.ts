import type { CategoryType } from './categories'
import type { PaymentStatus } from './transaction'

export interface ParsedStatementItem {
  id: string
  date: string // YYYY-MM-DD
  title: string
  amount: number
  type: CategoryType // 'income' | 'expense'
  category: string
  status: PaymentStatus
  isDuplicate?: boolean
  selected: boolean
}

export interface StatementParseResult {
  filename: string
  fileType: 'ofx' | 'csv'
  totalItems: number
  items: ParsedStatementItem[]
  errors?: string[]
}
