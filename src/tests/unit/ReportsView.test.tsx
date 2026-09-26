import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ToastProvider } from '../../core/toast/toastContext'
import type { Transaction } from '../../domain/models/transaction'
import { ReportsView } from '../../presentation/components/reports/ReportsView'

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Salário Principal',
    amount: 6000,
    type: 'income',
    category: 'Trabalho',
    date: '2026-09-05',
  },
  {
    id: 'tx-2',
    title: 'Supermercado Central',
    amount: 850,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-09-08',
  },
  {
    id: 'tx-3',
    title: 'Aluguel do Apartamento',
    amount: 1800,
    type: 'expense',
    category: 'Moradia',
    date: '2026-09-10',
  },
]

describe('<ReportsView />', () => {
  it('deve renderizar o cabeçalho e abas de períodos', () => {
    render(
      <ToastProvider>
        <ReportsView transactions={mockTransactions} />
      </ToastProvider>,
    )

    expect(screen.getByText('Relatórios & Inteligência')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Semanal/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Mensal/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Anual/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Personalizado/i })).toBeInTheDocument()
  })

  it('deve alternar para a visão Semanal ao clicar na aba correspondente', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <ReportsView transactions={mockTransactions} />
      </ToastProvider>,
    )

    const weekTab = screen.getByRole('tab', { name: /Semanal/i })
    await user.click(weekTab)

    expect(screen.getByText(/Últimos 7 dias/i)).toBeInTheDocument()
  })

  it('deve alternar para a visão Anual e exibir rótulo correspondente', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <ReportsView transactions={mockTransactions} />
      </ToastProvider>,
    )

    const yearTab = screen.getByRole('tab', { name: /Anual/i })
    await user.click(yearTab)

    expect(screen.getByText(/Ano de/i)).toBeInTheDocument()
    expect(screen.getByText('Evolução Mensal do Ano')).toBeInTheDocument()
  })
})
