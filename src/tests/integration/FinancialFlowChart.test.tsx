import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import { FinancialFlowChart } from '../../presentation/components/dashboard/FinancialFlowChart'

describe('<FinancialFlowChart />', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Salário',
      amount: 4000,
      type: 'income',
      category: 'Salário',
      date: '2026-09-05',
    },
    {
      id: 'tx-2',
      title: 'Aluguel',
      amount: 1500,
      type: 'expense',
      category: 'Moradia',
      date: '2026-09-10',
    },
    {
      id: 'tx-3',
      title: 'Freelance',
      amount: 2000,
      type: 'income',
      category: 'Serviços',
      date: '2026-08-15',
    },
  ]

  it('deve exibir mensagem de estado vazio quando não houver transações', () => {
    render(<FinancialFlowChart transactions={[]} selectedMonth="2026-09" />)

    expect(screen.getByTestId('flow-empty-state')).toBeInTheDocument()
    expect(screen.getByText(/Sem movimentações nos últimos 6 meses/i)).toBeInTheDocument()
  })

  it('deve renderizar o gráfico e a legenda quando houver transações', () => {
    render(<FinancialFlowChart transactions={mockTransactions} selectedMonth="2026-09" />)

    expect(screen.getByTestId('financial-flow-chart')).toBeInTheDocument()
    expect(screen.getByText('Fluxo Financeiro Semestral')).toBeInTheDocument()
    expect(screen.getByText('Entradas')).toBeInTheDocument()
    expect(screen.getByText('Saídas')).toBeInTheDocument()
    expect(screen.getByText('Saldo')).toBeInTheDocument()
  })

  it('deve exibir detalhes do mês ao passar o mouse sobre a coluna', () => {
    render(<FinancialFlowChart transactions={mockTransactions} selectedMonth="2026-09" />)

    const septElement = screen.getByLabelText(/SET:/i)
    fireEvent.mouseEnter(septElement)

    // Deve exibir detalhes de entradas e saídas do mês focado
    expect(screen.getByText(/Entradas: R\$\s*4\.000,00/i)).toBeInTheDocument()
    expect(screen.getByText(/Saídas: R\$\s*1\.500,00/i)).toBeInTheDocument()
    expect(screen.getByText(/Líquido: R\$\s*2\.500,00/i)).toBeInTheDocument()
  })
})
