import { beforeEach, describe, expect, it } from 'vitest'
import { SupabaseDebtRepository } from '../../data/repositories/SupabaseDebtRepository'
import type { CreateDebtDTO } from '../../domain/models/debt'

describe('SupabaseDebtRepository (Dívidas, Agiotas e Renovações)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('deve criar uma dívida com cálculo automático de status e persistir no fallback', async () => {
    const repo = new SupabaseDebtRepository(null)

    const dto: CreateDebtDTO = {
      lenderName: 'Agiota Zé',
      description: 'Empréstimo emergência',
      originalAmount: 2000,
      interestRate: 15,
      interestType: 'monthly',
      startDate: '2026-10-01',
      dueDate: '2026-11-01',
    }

    const created = await repo.create(dto)

    expect(created.id).toBeDefined()
    expect(created.lenderName).toBe('Agiota Zé')
    expect(created.originalAmount).toBe(2000)
    expect(created.currentBalance).toBe(2000)
    expect(created.interestRate).toBe(15)
    expect(created.status).toBe('active')

    const list = await repo.getAll()
    expect(list).toHaveLength(1)
    expect(list[0].id).toBe(created.id)
  })

  it('deve registrar renovação (rolar a dívida pagando só os juros) mantendo o saldo do principal', async () => {
    const repo = new SupabaseDebtRepository(null)

    const debt = await repo.create({
      lenderName: 'Agiota Zé',
      originalAmount: 3000,
      interestRate: 10,
      interestType: 'monthly',
      startDate: '2026-10-01',
      dueDate: '2026-11-01',
    })

    // Rola a dívida: paga R$ 300 de juros (10% de R$ 3000) e estende o vencimento
    const { payment, updatedDebt } = await repo.recordPayment({
      debtId: debt.id,
      paymentDate: '2026-11-01',
      amount: 300,
      type: 'renewal',
      interestPaid: 300,
      principalPaid: 0,
      newDueDate: '2026-12-01',
      notes: 'Pago via PIX',
    })

    expect(payment.amount).toBe(300)
    expect(payment.interestPaid).toBe(300)
    expect(payment.principalPaid).toBe(0)
    expect(payment.newDueDate).toBe('2026-12-01')

    // Saldo do principal permanece 3000!
    expect(updatedDebt.currentBalance).toBe(3000)
    expect(updatedDebt.dueDate).toBe('2026-12-01')
    expect(updatedDebt.status).toBe('renewed')

    const payments = await repo.getPayments(debt.id)
    expect(payments).toHaveLength(1)
    expect(payments[0].type).toBe('renewal')
  })

  it('deve registrar amortização abatendo o saldo devedor do principal', async () => {
    const repo = new SupabaseDebtRepository(null)

    const debt = await repo.create({
      lenderName: 'Empréstimo Primo',
      originalAmount: 5000,
      interestRate: 5,
      interestType: 'monthly',
      startDate: '2026-10-01',
      dueDate: '2026-11-01',
    })

    // Paga R$ 250 de juros + R$ 2.000 do principal (Total: R$ 2.250)
    const { updatedDebt } = await repo.recordPayment({
      debtId: debt.id,
      paymentDate: '2026-11-01',
      amount: 2250,
      type: 'amortization',
      interestPaid: 250,
      principalPaid: 2000,
      newDueDate: '2026-12-01',
    })

    // Novo saldo deve ser 5000 - 2000 = 3000
    expect(updatedDebt.currentBalance).toBe(3000)
    expect(updatedDebt.dueDate).toBe('2026-12-01')
  })

  it('deve registrar quitação total zerando o saldo e alterando o status para paid', async () => {
    const repo = new SupabaseDebtRepository(null)

    const debt = await repo.create({
      lenderName: 'Agiota Zé',
      originalAmount: 1500,
      interestRate: 10,
      interestType: 'monthly',
      startDate: '2026-10-01',
      dueDate: '2026-11-01',
    })

    const { updatedDebt } = await repo.recordPayment({
      debtId: debt.id,
      paymentDate: '2026-11-01',
      amount: 1650, // 1500 principal + 150 juros
      type: 'full_payoff',
      interestPaid: 150,
      principalPaid: 1500,
    })

    expect(updatedDebt.currentBalance).toBe(0)
    expect(updatedDebt.status).toBe('paid')

    const list = await repo.getAll()
    expect(list[0].status).toBe('paid')
    expect(list[0].currentBalance).toBe(0)
  })

  it('deve excluir a dívida e remover pagamentos vinculados', async () => {
    const repo = new SupabaseDebtRepository(null)

    const debt = await repo.create({
      lenderName: 'Excluir Teste',
      originalAmount: 1000,
      interestRate: 10,
      interestType: 'monthly',
      startDate: '2026-10-01',
      dueDate: '2026-11-01',
    })

    await repo.recordPayment({
      debtId: debt.id,
      paymentDate: '2026-10-15',
      amount: 100,
      type: 'renewal',
      interestPaid: 100,
      principalPaid: 0,
    })

    const deleted = await repo.delete(debt.id)
    expect(deleted).toBe(true)

    const remainingDebts = await repo.getAll()
    expect(remainingDebts).toHaveLength(0)

    const remainingPayments = await repo.getPayments(debt.id)
    expect(remainingPayments).toHaveLength(0)
  })
})
