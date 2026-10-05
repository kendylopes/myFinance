import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import {
  formatMonthLabel,
  getInstallmentGroups,
  getMonthlyInstallmentForecast,
} from '../../domain/services/installmentForecast'

describe('installmentForecast (Projeção de Compras Parceladas e Faturas)', () => {
  it('deve formatar corretamente o rótulo do mês', () => {
    expect(formatMonthLabel('2026-10')).toBe('Out/26')
    expect(formatMonthLabel('2027-01')).toBe('Jan/27')
    expect(formatMonthLabel('2026-12')).toBe('Dez/26')
  })

  it('deve agrupar transações parceladas calculando progresso e valores', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        title: 'Geladeira Frost Free (1/3)',
        amount: 500,
        type: 'expense',
        category: 'Casa',
        date: '2026-10-10',
        status: 'paid',
        recurrence: 'installment',
        groupId: 'geladeira-group',
      },
      {
        id: '2',
        title: 'Geladeira Frost Free (2/3)',
        amount: 500,
        type: 'expense',
        category: 'Casa',
        date: '2026-11-10',
        status: 'pending',
        recurrence: 'installment',
        groupId: 'geladeira-group',
      },
      {
        id: '3',
        title: 'Geladeira Frost Free (3/3)',
        amount: 500,
        type: 'expense',
        category: 'Casa',
        date: '2026-12-10',
        status: 'pending',
        recurrence: 'installment',
        groupId: 'geladeira-group',
      },
      {
        id: '4',
        title: 'Supermercado Mensal',
        amount: 400,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-10-05',
        status: 'paid',
      },
    ]

    const groups = getInstallmentGroups(mockTransactions)

    expect(groups).toHaveLength(1)
    const geladeira = groups[0]
    expect(geladeira.title).toBe('Geladeira Frost Free')
    expect(geladeira.totalAmount).toBe(1500)
    expect(geladeira.installmentAmount).toBe(500)
    expect(geladeira.totalInstallments).toBe(3)
    expect(geladeira.paidCount).toBe(1)
    expect(geladeira.pendingCount).toBe(2)
    expect(geladeira.progressPercent).toBe(33)
    expect(geladeira.isCompleted).toBe(false)
  })

  it('deve calcular a projeção mensal de faturas para os próximos 12 meses', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        title: 'Notebook (1/2)',
        amount: 1000,
        type: 'expense',
        category: 'Trabalho',
        date: '2026-10-15',
        status: 'paid',
      },
      {
        id: '2',
        title: 'Notebook (2/2)',
        amount: 1000,
        type: 'expense',
        category: 'Trabalho',
        date: '2026-11-15',
        status: 'pending',
      },
    ]

    const forecast = getMonthlyInstallmentForecast(mockTransactions, 3)

    expect(forecast.length).toBe(3)
    // O mês 2026-10 tem R$ 1000
    const out26 = forecast.find((f) => f.yearMonth === '2026-10')
    if (out26) {
      expect(out26.totalAmount).toBe(1000)
      expect(out26.itemsCount).toBe(1)
    }

    // O mês 2026-11 tem R$ 1000
    const nov26 = forecast.find((f) => f.yearMonth === '2026-11')
    if (nov26) {
      expect(nov26.totalAmount).toBe(1000)
      expect(nov26.itemsCount).toBe(1)
    }
  })
})
