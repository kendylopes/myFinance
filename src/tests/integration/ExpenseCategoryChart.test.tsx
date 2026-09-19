import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import { ExpenseCategoryChart } from '../../presentation/components/dashboard/ExpenseCategoryChart'

describe('<ExpenseCategoryChart /> (Gráfico de Distribuição por Categoria)', () => {
  it('deve renderizar as categorias, valores e porcentagens corretamente', () => {
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        title: 'Mercado',
        amount: 300,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-01',
      },
      {
        id: '2',
        title: 'Aluguel',
        amount: 700,
        type: 'expense',
        category: 'Moradia',
        date: '2026-09-02',
      },
      {
        id: '3',
        title: 'Salário',
        amount: 4000,
        type: 'income',
        category: 'Trabalho',
        date: '2026-09-05',
      },
    ]

    render(<ExpenseCategoryChart transactions={mockTransactions} />)

    expect(screen.getByTestId('expense-category-chart')).toBeInTheDocument()
    expect(screen.getByText('Distribuição de Despesas')).toBeInTheDocument()
    expect(screen.getByTestId('cat-row-Moradia')).toBeInTheDocument()
    expect(screen.getByTestId('cat-row-Alimentação')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('deve renderizar estado vazio quando não houver despesas no período', () => {
    const onlyIncome: Transaction[] = [
      {
        id: '1',
        title: 'Salário',
        amount: 4000,
        type: 'income',
        category: 'Trabalho',
        date: '2026-09-05',
      },
    ]

    render(<ExpenseCategoryChart transactions={onlyIncome} />)

    expect(screen.getByTestId('chart-empty-state')).toBeInTheDocument()
    expect(screen.getByText(/Sem despesas registradas neste período/i)).toBeInTheDocument()
  })
})
