import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { FinanceSummary, Transaction } from '../../domain/models/transaction'
import { FinancialInsights } from '../../presentation/components/dashboard/FinancialInsights'

describe('<FinancialInsights />', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Mercado',
      amount: 400,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-10',
    },
    {
      id: 'tx-2',
      title: 'Farmácia',
      amount: 100,
      type: 'expense',
      category: 'Saúde',
      date: '2026-09-12',
    },
    {
      id: 'tx-3',
      title: 'Salário',
      amount: 2000,
      type: 'income',
      category: 'Salário',
      date: '2026-09-05',
    },
  ]

  const mockSummary: FinanceSummary = {
    totalIncome: 2000,
    totalExpenses: 500,
    currentBalance: 1500,
    savingsRate: 75,
  }

  it('deve renderizar empty state se não houver transações', () => {
    render(
      <FinancialInsights
        transactions={[]}
        summary={{ totalIncome: 0, totalExpenses: 0, currentBalance: 0, savingsRate: 0 }}
      />,
    )
    expect(screen.getByText('Insights Inteligentes')).toBeInTheDocument()
  })

  it('deve calcular e exibir a maior despesa corretamente', () => {
    render(<FinancialInsights transactions={mockTransactions} summary={mockSummary} />)

    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText(/80% dos gastos/)).toBeInTheDocument()
    expect(screen.getByText(/75% Poupado/)).toBeInTheDocument()
    expect(screen.getByText(/3/)).toBeInTheDocument()
  })
})
