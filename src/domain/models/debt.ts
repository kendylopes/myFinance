export type DebtInterestType = 'monthly' | 'daily' | 'fixed'

export type DebtStatus = 'active' | 'paid' | 'overdue' | 'renewed'

export type DebtPaymentType = 'renewal' | 'amortization' | 'installment' | 'full_payoff'

export type DebtType = 'payable' | 'receivable'

export interface Debt {
  id: string
  userId?: string
  type: DebtType // 'payable' (A pagar) ou 'receivable' (A receber / Empréstimo feito a terceiro)
  lenderName: string // Nome do credor (se payable) ou devedor/amigo/irmão (se receivable)
  description?: string
  phone?: string // WhatsApp ou telefone para envio de lembrete
  originalAmount: number
  currentBalance: number
  interestRate: number // % taxa
  interestType: DebtInterestType
  fixedInterestAmount?: number // Valor em R$ se o juro for fixo
  startDate: string // YYYY-MM-DD
  dueDate: string // YYYY-MM-DD (próximo vencimento)
  totalInstallments?: number // Total de parcelas se for parcelado
  paidInstallments: number
  installmentAmount?: number
  status: DebtStatus
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface DebtPayment {
  id: string
  debtId: string
  userId?: string
  paymentDate: string // YYYY-MM-DD
  amount: number
  type: DebtPaymentType
  interestPaid: number
  principalPaid: number
  newDueDate?: string
  notes?: string
  createdAt: string
}

export interface CreateDebtDTO {
  type?: DebtType
  lenderName: string
  description?: string
  phone?: string
  originalAmount: number
  currentBalance?: number
  interestRate: number
  interestType?: DebtInterestType
  fixedInterestAmount?: number
  startDate: string
  dueDate: string
  totalInstallments?: number
  installmentAmount?: number
  notes?: string
}

export interface RecordDebtPaymentDTO {
  debtId: string
  paymentDate: string
  amount: number
  type: DebtPaymentType
  interestPaid: number
  principalPaid: number
  newDueDate?: string
  notes?: string
  registerAsExpense?: boolean
  registerAsTransaction?: boolean
}
