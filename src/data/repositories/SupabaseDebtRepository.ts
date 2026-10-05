import type { SupabaseClient } from '@supabase/supabase-js'
import { getLocalDateString } from '../../core/formatters/date'
import type {
  CreateDebtDTO,
  Debt,
  DebtPayment,
  RecordDebtPaymentDTO,
} from '../../domain/models/debt'
import type { IDebtRepository } from '../../domain/repositories/IDebtRepository'
import { getSupabaseClient } from '../sources/supabaseClient'

const LOCAL_STORAGE_DEBTS_KEY = '@myFinance:debts'
const LOCAL_STORAGE_PAYMENTS_KEY = '@myFinance:debt_payments'

export class SupabaseDebtRepository implements IDebtRepository {
  private client: SupabaseClient | null

  constructor(customClient?: SupabaseClient | null) {
    this.client = customClient !== undefined ? customClient : getSupabaseClient()
  }

  private getClient(): SupabaseClient | null {
    return this.client
  }

  // --- Fallback LocalStorage Helpers ---
  private getLocalDebts(): Debt[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_DEBTS_KEY)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  private saveLocalDebts(debts: Debt[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_DEBTS_KEY, JSON.stringify(debts))
    } catch (e) {
      console.error('[SupabaseDebtRepository] Erro ao salvar dívidas localmente:', e)
    }
  }

  private getLocalPayments(): DebtPayment[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_PAYMENTS_KEY)
      if (!raw) return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  }

  private saveLocalPayments(payments: DebtPayment[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_PAYMENTS_KEY, JSON.stringify(payments))
    } catch (e) {
      console.error('[SupabaseDebtRepository] Erro ao salvar pagamentos localmente:', e)
    }
  }

  private computeStatus(debt: Debt): Debt['status'] {
    if (debt.status === 'paid' || debt.currentBalance <= 0) {
      return 'paid'
    }
    const today = getLocalDateString()
    if (debt.dueDate < today) {
      return 'overdue'
    }
    return debt.status === 'renewed' ? 'renewed' : 'active'
  }

  async getAll(): Promise<Debt[]> {
    const client = this.getClient()
    if (client) {
      try {
        const { data, error } = await client
          .from('debts')
          .select('*')
          .order('due_date', { ascending: true })

        if (!error && data) {
          return data.map((row) => {
            const debt: Debt = {
              id: String(row.id),
              userId: row.user_id,
              lenderName: String(row.lender_name),
              description: row.description || '',
              originalAmount: Number(row.original_amount),
              currentBalance: Number(row.current_balance),
              interestRate: Number(row.interest_rate || 0),
              interestType: row.interest_type || 'monthly',
              fixedInterestAmount: row.fixed_interest_amount
                ? Number(row.fixed_interest_amount)
                : undefined,
              startDate: String(row.start_date),
              dueDate: String(row.due_date),
              totalInstallments: row.total_installments
                ? Number(row.total_installments)
                : undefined,
              paidInstallments: Number(row.paid_installments || 0),
              installmentAmount: row.installment_amount
                ? Number(row.installment_amount)
                : undefined,
              status: row.status,
              notes: row.notes || '',
              createdAt: String(row.created_at),
              updatedAt: String(row.updated_at || row.created_at),
            }
            return {
              ...debt,
              status: this.computeStatus(debt),
            }
          })
        }
      } catch {
        // Tabela ainda não existe no Supabase ou falha de rede -> Fallback local
      }
    }

    return this.getLocalDebts().map((d) => ({
      ...d,
      status: this.computeStatus(d),
    }))
  }

  async getById(id: string): Promise<Debt | null> {
    const list = await this.getAll()
    return list.find((d) => d.id === id) || null
  }

  async create(data: CreateDebtDTO): Promise<Debt> {
    const now = new Date().toISOString()
    const originalAmount = Number(data.originalAmount)
    const currentBalance =
      data.currentBalance !== undefined ? Number(data.currentBalance) : originalAmount

    const newDebt: Debt = {
      id: crypto.randomUUID ? crypto.randomUUID() : `debt_${Date.now()}`,
      lenderName: data.lenderName.trim(),
      description: data.description?.trim() || '',
      originalAmount,
      currentBalance,
      interestRate: Number(data.interestRate || 0),
      interestType: data.interestType || 'monthly',
      fixedInterestAmount: data.fixedInterestAmount ? Number(data.fixedInterestAmount) : undefined,
      startDate: data.startDate,
      dueDate: data.dueDate,
      totalInstallments: data.totalInstallments ? Number(data.totalInstallments) : undefined,
      paidInstallments: 0,
      installmentAmount: data.installmentAmount ? Number(data.installmentAmount) : undefined,
      status: 'active',
      notes: data.notes?.trim() || '',
      createdAt: now,
      updatedAt: now,
    }

    newDebt.status = this.computeStatus(newDebt)

    const client = this.getClient()
    if (client) {
      try {
        const { data: row, error } = await client
          .from('debts')
          .insert({
            id: newDebt.id,
            lender_name: newDebt.lenderName,
            description: newDebt.description,
            original_amount: newDebt.originalAmount,
            current_balance: newDebt.currentBalance,
            interest_rate: newDebt.interestRate,
            interest_type: newDebt.interestType,
            fixed_interest_amount: newDebt.fixedInterestAmount,
            start_date: newDebt.startDate,
            due_date: newDebt.dueDate,
            total_installments: newDebt.totalInstallments,
            paid_installments: 0,
            installment_amount: newDebt.installmentAmount,
            status: newDebt.status,
            notes: newDebt.notes,
          })
          .select('*')
          .single()

        if (!error && row) {
          // Atualiza também o cache local
          const localList = this.getLocalDebts()
          this.saveLocalDebts([newDebt, ...localList])
          return newDebt
        }
      } catch {
        // Fallback local
      }
    }

    const localList = this.getLocalDebts()
    this.saveLocalDebts([newDebt, ...localList])
    return newDebt
  }

  async update(id: string, data: Partial<CreateDebtDTO>): Promise<Debt> {
    const list = await this.getAll()
    const target = list.find((d) => d.id === id)
    if (!target) throw new Error('Dívida não encontrada.')

    const updated: Debt = {
      ...target,
      lenderName: data.lenderName !== undefined ? data.lenderName.trim() : target.lenderName,
      description: data.description !== undefined ? data.description.trim() : target.description,
      originalAmount:
        data.originalAmount !== undefined ? Number(data.originalAmount) : target.originalAmount,
      currentBalance:
        data.currentBalance !== undefined ? Number(data.currentBalance) : target.currentBalance,
      interestRate:
        data.interestRate !== undefined ? Number(data.interestRate) : target.interestRate,
      interestType: data.interestType !== undefined ? data.interestType : target.interestType,
      fixedInterestAmount:
        data.fixedInterestAmount !== undefined
          ? Number(data.fixedInterestAmount)
          : target.fixedInterestAmount,
      startDate: data.startDate !== undefined ? data.startDate : target.startDate,
      dueDate: data.dueDate !== undefined ? data.dueDate : target.dueDate,
      totalInstallments:
        data.totalInstallments !== undefined
          ? Number(data.totalInstallments)
          : target.totalInstallments,
      installmentAmount:
        data.installmentAmount !== undefined
          ? Number(data.installmentAmount)
          : target.installmentAmount,
      notes: data.notes !== undefined ? data.notes.trim() : target.notes,
      updatedAt: new Date().toISOString(),
    }

    updated.status = this.computeStatus(updated)

    const client = this.getClient()
    if (client) {
      try {
        await client
          .from('debts')
          .update({
            lender_name: updated.lenderName,
            description: updated.description,
            original_amount: updated.originalAmount,
            current_balance: updated.currentBalance,
            interest_rate: updated.interestRate,
            interest_type: updated.interestType,
            fixed_interest_amount: updated.fixedInterestAmount,
            start_date: updated.startDate,
            due_date: updated.dueDate,
            total_installments: updated.totalInstallments,
            installment_amount: updated.installmentAmount,
            status: updated.status,
            notes: updated.notes,
            updated_at: updated.updatedAt,
          })
          .eq('id', id)
      } catch {
        // Fallback local
      }
    }

    const localList = this.getLocalDebts().map((d) => (d.id === id ? updated : d))
    this.saveLocalDebts(localList)
    return updated
  }

  async delete(id: string): Promise<boolean> {
    const client = this.getClient()
    if (client) {
      try {
        await client.from('debt_payments').delete().eq('debt_id', id)
        await client.from('debts').delete().eq('id', id)
      } catch {
        // Ignora se não existir
      }
    }

    const localList = this.getLocalDebts().filter((d) => d.id !== id)
    this.saveLocalDebts(localList)
    const localPayments = this.getLocalPayments().filter((p) => p.debtId !== id)
    this.saveLocalPayments(localPayments)
    return true
  }

  async getPayments(debtId?: string): Promise<DebtPayment[]> {
    const client = this.getClient()
    if (client) {
      try {
        let query = client
          .from('debt_payments')
          .select('*')
          .order('payment_date', { ascending: false })
          .order('created_at', { ascending: false })

        if (debtId) {
          query = query.eq('debt_id', debtId)
        }

        const { data, error } = await query
        if (!error && data) {
          return data.map((row) => ({
            id: String(row.id),
            debtId: String(row.debt_id),
            userId: row.user_id,
            paymentDate: String(row.payment_date),
            amount: Number(row.amount),
            type: row.type,
            interestPaid: Number(row.interest_paid || 0),
            principalPaid: Number(row.principal_paid || 0),
            newDueDate: row.new_due_date ? String(row.new_due_date) : undefined,
            notes: row.notes || '',
            createdAt: String(row.created_at),
          }))
        }
      } catch {
        // Fallback local
      }
    }

    const allPayments = this.getLocalPayments()
    if (debtId) {
      return allPayments.filter((p) => p.debtId === debtId)
    }
    return allPayments
  }

  async recordPayment(
    dto: RecordDebtPaymentDTO,
  ): Promise<{ payment: DebtPayment; updatedDebt: Debt }> {
    const debts = await this.getAll()
    const debt = debts.find((d) => d.id === dto.debtId)
    if (!debt) throw new Error('Dívida não encontrada para registrar pagamento.')

    const paymentId = crypto.randomUUID ? crypto.randomUUID() : `pay_${Date.now()}`
    const now = new Date().toISOString()

    const payment: DebtPayment = {
      id: paymentId,
      debtId: dto.debtId,
      paymentDate: dto.paymentDate,
      amount: Number(dto.amount),
      type: dto.type,
      interestPaid: Number(dto.interestPaid || 0),
      principalPaid: Number(dto.principalPaid || 0),
      newDueDate: dto.newDueDate,
      notes: dto.notes?.trim() || '',
      createdAt: now,
    }

    // Calcula novo estado da dívida
    let newBalance = debt.currentBalance
    let newPaidInstallments = debt.paidInstallments
    let newDueDate = debt.dueDate
    let newStatus = debt.status

    if (dto.type === 'full_payoff') {
      newBalance = 0
      newStatus = 'paid'
    } else if (dto.type === 'renewal') {
      // Renovação: paga apenas os juros. Prorroga o vencimento.
      if (dto.newDueDate) {
        newDueDate = dto.newDueDate
      }
      newStatus = 'renewed'
      if (dto.principalPaid > 0) {
        newBalance = Math.max(0, newBalance - dto.principalPaid)
        if (newBalance === 0) newStatus = 'paid'
      }
    } else if (dto.type === 'amortization') {
      // Amortização: abate do principal
      newBalance = Math.max(0, newBalance - dto.principalPaid)
      if (newBalance === 0) {
        newStatus = 'paid'
      } else if (dto.newDueDate) {
        newDueDate = dto.newDueDate
      }
    } else if (dto.type === 'installment') {
      // Parcela
      newPaidInstallments += 1
      newBalance = Math.max(0, newBalance - dto.principalPaid)
      if (
        (debt.totalInstallments && newPaidInstallments >= debt.totalInstallments) ||
        newBalance === 0
      ) {
        newStatus = 'paid'
      } else if (dto.newDueDate) {
        newDueDate = dto.newDueDate
      }
    }

    const updatedDebt: Debt = {
      ...debt,
      currentBalance: newBalance,
      paidInstallments: newPaidInstallments,
      dueDate: newDueDate,
      status: newStatus,
      updatedAt: now,
    }
    updatedDebt.status = this.computeStatus(updatedDebt)

    // Persistir no Supabase
    const client = this.getClient()
    if (client) {
      try {
        await client.from('debt_payments').insert({
          id: payment.id,
          debt_id: payment.debtId,
          payment_date: payment.paymentDate,
          amount: payment.amount,
          type: payment.type,
          interest_paid: payment.interestPaid,
          principal_paid: payment.principalPaid,
          new_due_date: payment.newDueDate,
          notes: payment.notes,
        })

        await client
          .from('debts')
          .update({
            current_balance: updatedDebt.currentBalance,
            paid_installments: updatedDebt.paidInstallments,
            due_date: updatedDebt.dueDate,
            status: updatedDebt.status,
            updated_at: updatedDebt.updatedAt,
          })
          .eq('id', updatedDebt.id)
      } catch {
        // Fallback local
      }
    }

    // Persistir no LocalStorage
    const localDebts = this.getLocalDebts().map((d) => (d.id === updatedDebt.id ? updatedDebt : d))
    this.saveLocalDebts(localDebts)

    const localPayments = this.getLocalPayments()
    this.saveLocalPayments([payment, ...localPayments])

    return { payment, updatedDebt }
  }

  async deletePayment(paymentId: string): Promise<boolean> {
    const client = this.getClient()
    if (client) {
      try {
        await client.from('debt_payments').delete().eq('id', paymentId)
      } catch {
        // Fallback
      }
    }

    const localPayments = this.getLocalPayments().filter((p) => p.id !== paymentId)
    this.saveLocalPayments(localPayments)
    return true
  }
}
