import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import type { Transaction } from '../../domain/models/transaction'
import { CategorySummaryCards } from '../../presentation/components/dashboard/CategorySummaryCards'

describe('<CategorySummaryCards /> (Cards de KPI de Categorias)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Salário Dev',
      amount: 10000,
      type: 'income',
      category: 'Salário',
      date: '2026-10-05',
      recurrence: 'single',
      status: 'paid',
    },
    {
      id: 'tx-2',
      title: 'Supermercado Mensal',
      amount: 1500,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-10-06',
      recurrence: 'single',
      status: 'paid',
    },
    {
      id: 'tx-3',
      title: 'Restaurante Fim de Semana',
      amount: 300,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-10-08',
      recurrence: 'single',
      status: 'paid',
    },
    {
      id: 'tx-4',
      title: 'Combustível',
      amount: 400,
      type: 'expense',
      category: 'Transporte',
      date: '2026-10-09',
      recurrence: 'single',
      status: 'paid',
    },
  ]

  const renderComponent = (transactions = sampleTransactions) => {
    return render(
      <CurrencyProvider>
        <CategorySummaryCards transactions={transactions} />
      </CurrencyProvider>,
    )
  }

  it('deve renderizar os 4 cards analíticos de categorias com dados calculados', () => {
    renderComponent()

    expect(screen.getByText('Total em Despesas')).toBeInTheDocument()
    expect(screen.getByText('Total em Receitas')).toBeInTheDocument()
    expect(screen.getByText('Maior Gasto')).toBeInTheDocument()
    expect(screen.getByText('Categorias Ativas')).toBeInTheDocument()

    // A maior categoria de despesa deve ser Alimentação (1500 + 300 = 1800)
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    // Total de 3 categorias distintas (Salário, Alimentação, Transporte)
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('deve lidar com lista vazia sem quebrar', () => {
    renderComponent([])

    expect(screen.getByText('Total em Despesas')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
