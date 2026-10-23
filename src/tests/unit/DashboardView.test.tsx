import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import type { BudgetProgress, FinanceSummary, Transaction } from '../../domain/models/transaction'
import { DashboardView } from '../../presentation/components/dashboard/DashboardView'

describe('<DashboardView /> (Visão Modularizada do Dashboard)', () => {
  const mockSummary: FinanceSummary = {
    totalIncome: 6000,
    totalExpense: 2500,
    balance: 3500,
    paidIncome: 6000,
    pendingIncome: 0,
    paidExpense: 2000,
    pendingExpense: 500,
    liquidBalance: 4000,
  }

  const mockBudgetProgress: BudgetProgress = {
    budgetAmount: 4000,
    totalExpense: 2500,
    remainingAmount: 1500,
    spentPercentage: 62.5,
    isExceeded: false,
    status: 'safe',
  }

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Salário Tech',
      amount: 6000,
      type: 'income',
      category: 'Salário',
      date: '2026-10-05',
      status: 'paid',
    },
    {
      id: 'tx-2',
      title: 'Supermercado Central',
      amount: 850,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-10-10',
      status: 'paid',
    },
  ]

  const defaultProps = {
    isLoading: false,
    summary: mockSummary,
    periodTransactions: mockTransactions,
    transactions: mockTransactions,
    selectedMonth: '2026-10',
    budgetProgress: mockBudgetProgress,
    onSelectType: vi.fn(),
    onSelectSection: vi.fn(),
    onOpenNewTransaction: vi.fn(),
    onOpenImportModal: vi.fn(),
    onOpenOnboarding: vi.fn(),
    onDeleteTransaction: vi.fn().mockResolvedValue(true),
    onEditTransaction: vi.fn(),
    onDuplicateTransaction: vi.fn(),
    onToggleTransactionStatus: vi.fn().mockResolvedValue(true),
  }

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ThemeProvider>
          <DashboardView {...defaultProps} {...props} />
        </ThemeProvider>
      </ToastProvider>,
    )
  }

  it('deve exibir o Skeleton de carregamento quando isLoading for true', () => {
    renderComponent({ isLoading: true })
    expect(screen.getByTestId('dashboard-skeleton')).toBeInTheDocument()
  })

  it('deve renderizar os cards de resumo, gráficos e lista de transações recentes', () => {
    renderComponent()

    expect(screen.getByText('Saldo Atual')).toBeInTheDocument()
    expect(screen.getByText('Transações Recentes')).toBeInTheDocument()
    expect(screen.getByText(/Salário Tech/i)).toBeInTheDocument()
    expect(screen.getByText(/Supermercado Central/i)).toBeInTheDocument()
  })

  it('deve exibir empty state quando não houver transações no período', () => {
    renderComponent({ periodTransactions: [] })

    expect(screen.getByText(/Nenhuma movimentação neste período/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Adicionar Transação/i })).toBeInTheDocument()
  })

  it('deve disparar onOpenNewTransaction ao clicar em Adicionar Transação no empty state', async () => {
    const onOpenNewTransaction = vi.fn()
    const user = userEvent.setup()

    renderComponent({
      periodTransactions: [],
      onOpenNewTransaction,
    })

    const addBtn = screen.getByRole('button', { name: /Adicionar Transação/i })
    await user.click(addBtn)

    expect(onOpenNewTransaction).toHaveBeenCalledTimes(1)
  })

  it('deve disparar onSelectSection("transactions") ao clicar em Ver todos', async () => {
    const onSelectSection = vi.fn()
    const user = userEvent.setup()

    renderComponent({ onSelectSection })

    const viewAllBtn = screen.getByRole('button', { name: /Ver todos/i })
    await user.click(viewAllBtn)

    expect(onSelectSection).toHaveBeenCalledWith('transactions')
  })
})
