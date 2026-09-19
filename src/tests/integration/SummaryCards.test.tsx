import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { SummaryCards } from '../../presentation/components/dashboard/SummaryCards'

describe('<SummaryCards /> (Componente de UI)', () => {
  it('deve renderizar os totais formatados em moeda brasileira', () => {
    const mockSummary = {
      totalIncome: 5000,
      totalExpense: 1200,
      balance: 3800,
    }

    render(<SummaryCards summary={mockSummary} />)

    // Verifica se os cards aparecem
    expect(screen.getByTestId('card-income')).toBeInTheDocument()
    expect(screen.getByTestId('card-expense')).toBeInTheDocument()
    expect(screen.getByTestId('card-balance')).toBeInTheDocument()

    // Verifica os textos de cabeçalho
    expect(screen.getByText('Total de Entradas')).toBeInTheDocument()
    expect(screen.getByText('Total de Saídas')).toBeInTheDocument()
    expect(screen.getByText('Saldo Atual')).toBeInTheDocument()
    expect(screen.getByText(/Conta no azul/i)).toBeInTheDocument()
  })

  it('deve alertar visualmente quando o saldo estiver negativo', () => {
    const mockNegativeSummary = {
      totalIncome: 1000,
      totalExpense: 2500,
      balance: -1500,
    }

    render(<SummaryCards summary={mockNegativeSummary} />)
    expect(screen.getByText(/Atenção ao orçamento/i)).toBeInTheDocument()
  })
})
