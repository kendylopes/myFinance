import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import { CategoryAnalysisGrid } from '../../presentation/components/dashboard/CategoryAnalysisGrid'

describe('<CategoryAnalysisGrid />', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Mercado',
      amount: 600,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-10',
    },
    {
      id: 'tx-2',
      title: 'Restaurante',
      amount: 400,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-15',
    },
    {
      id: 'tx-3',
      title: 'Uber',
      amount: 250,
      type: 'expense',
      category: 'Transporte',
      date: '2026-09-18',
    },
    {
      id: 'tx-4',
      title: 'Freelance',
      amount: 3500,
      type: 'income',
      category: 'Serviços',
      date: '2026-09-02',
    },
  ]

  it('deve agrupar e calcular métricas de despesas por categoria', () => {
    render(<CategoryAnalysisGrid transactions={mockTransactions} />)

    expect(screen.getByText('Detalhamento por Categorias')).toBeInTheDocument()
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByText('Transporte')).toBeInTheDocument()
    // 2 transações em alimentação
    expect(screen.getByText('2 transações')).toBeInTheDocument()
  })

  it('deve alternar para a aba de receitas ao clicar', async () => {
    const user = userEvent.setup()
    render(<CategoryAnalysisGrid transactions={mockTransactions} />)

    const incomeTab = screen.getByRole('button', { name: /Receitas/i })
    await user.click(incomeTab)

    expect(screen.getByText('Serviços')).toBeInTheDocument()
    expect(screen.getByText('1 transação')).toBeInTheDocument()
  })

  it('deve acionar o callback onSelectCategory ao clicar no botão ver transações', async () => {
    const user = userEvent.setup()
    const mockSelect = vi.fn()

    render(<CategoryAnalysisGrid transactions={mockTransactions} onSelectCategory={mockSelect} />)

    const buttons = screen.getAllByRole('button', { name: /Ver transações/i })
    await user.click(buttons[0])

    expect(mockSelect).toHaveBeenCalledWith('Alimentação')
  })
})
