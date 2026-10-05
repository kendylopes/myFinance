import type { CreateDebtDTO, Debt, DebtPayment, RecordDebtPaymentDTO } from '../models/debt'

export interface IDebtRepository {
  getAll(): Promise<Debt[]>
  getById(id: string): Promise<Debt | null>
  create(data: CreateDebtDTO): Promise<Debt>
  update(id: string, data: Partial<CreateDebtDTO>): Promise<Debt>
  delete(id: string): Promise<boolean>
  getPayments(debtId?: string): Promise<DebtPayment[]>
  recordPayment(dto: RecordDebtPaymentDTO): Promise<{ payment: DebtPayment; updatedDebt: Debt }>
  deletePayment(paymentId: string): Promise<boolean>
}
