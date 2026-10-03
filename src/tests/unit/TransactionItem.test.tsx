import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import { TransactionItem } from '../../presentation/components/dashboard/TransactionItem'

describe('<TransactionItem />', () => {
  const expenseTx: Transaction = {
    id: 'tx-1',
    title: 'Supermercado Mensal',
    amount: 350.75,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-09-20',
  }

  const incomeTx: Transaction = {
    id: 'tx-2',
    title: 'Salário Mensal',
    amount: 5000,
    type: 'income',
    category: 'Salário',
    date: '2026-09-20',
  }

  it('deve renderizar os detalhes da transação de despesa com badge de menos (-)', () => {
    const mockOnDelete = vi.fn()
    render(<TransactionItem transaction={expenseTx} onDelete={mockOnDelete} />)

    expect(screen.getByText('Supermercado Mensal')).toBeInTheDocument()
    expect(screen.getByText('Alimentação')).toBeInTheDocument()
    expect(screen.getByTitle('Saída')).toHaveTextContent('-')
    expect(screen.getByText(/- R\$\s*350,75/)).toBeInTheDocument()
  })

  it('deve renderizar os detalhes da transação de receita com badge de mais (+)', () => {
    const mockOnDelete = vi.fn()
    render(<TransactionItem transaction={incomeTx} onDelete={mockOnDelete} />)

    expect(screen.getByText('Salário Mensal')).toBeInTheDocument()
    expect(screen.getByText('Salário')).toBeInTheDocument()
    expect(screen.getByTitle('Entrada')).toHaveTextContent('+')
    expect(screen.getByText(/\+ R\$\s*5\.000,00/)).toBeInTheDocument()
  })

  it('deve acionar onDelete com o ID correto ao clicar no botão de exclusão', async () => {
    const mockOnDelete = vi.fn()
    const user = userEvent.setup()
    render(<TransactionItem transaction={expenseTx} onDelete={mockOnDelete} />)

    const deleteBtn = screen.getByTestId('delete-btn-tx-1')
    await user.click(deleteBtn)

    expect(mockOnDelete).toHaveBeenCalledTimes(1)
    expect(mockOnDelete).toHaveBeenCalledWith('tx-1')
  })

  it('deve acionar onEdit com o objeto da transação ao clicar no botão de edição', async () => {
    const mockOnDelete = vi.fn()
    const mockOnEdit = vi.fn()
    const user = userEvent.setup()
    render(<TransactionItem transaction={expenseTx} onDelete={mockOnDelete} onEdit={mockOnEdit} />)

    const editBtn = screen.getByTestId('edit-btn-tx-1')
    expect(editBtn).toBeInTheDocument()
    await user.click(editBtn)

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
    expect(mockOnEdit).toHaveBeenCalledWith(expenseTx)
  })

  it('deve acionar onDuplicate com a transação ao clicar no botão de duplicação', async () => {
    const mockOnDelete = vi.fn()
    const mockOnDuplicate = vi.fn()
    const user = userEvent.setup()
    render(
      <TransactionItem
        transaction={expenseTx}
        onDelete={mockOnDelete}
        onDuplicate={mockOnDuplicate}
      />,
    )

    const dupBtn = screen.getByTestId('duplicate-btn-tx-1')
    expect(dupBtn).toBeInTheDocument()
    await user.click(dupBtn)

    expect(mockOnDuplicate).toHaveBeenCalledTimes(1)
    expect(mockOnDuplicate).toHaveBeenCalledWith(expenseTx)
  })

  it('deve renderizar o checkbox de seleção e acionar onToggleSelect', async () => {
    const mockOnDelete = vi.fn()
    const mockOnToggleSelect = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <TransactionItem
        transaction={expenseTx}
        onDelete={mockOnDelete}
        isSelected={false}
        onToggleSelect={mockOnToggleSelect}
      />,
    )

    const checkbox = screen.getByTestId('checkbox-select-tx-1') as HTMLInputElement
    expect(checkbox).toBeInTheDocument()
    expect(checkbox.checked).toBe(false)

    await user.click(checkbox)
    expect(mockOnToggleSelect).toHaveBeenCalledTimes(1)
    expect(mockOnToggleSelect).toHaveBeenCalledWith('tx-1')

    rerender(
      <TransactionItem
        transaction={expenseTx}
        onDelete={mockOnDelete}
        isSelected={true}
        onToggleSelect={mockOnToggleSelect}
      />,
    )
    expect(checkbox.checked).toBe(true)
  })

  it('deve renderizar o badge de parcela quando o título contiver (X/Y)', () => {
    const installmentTx: Transaction = {
      id: 'tx-inst',
      title: 'Notebook Gamer (2/10)',
      amount: 450,
      type: 'expense',
      category: 'Serviços',
      date: '2026-09-20',
      recurrence: 'installment',
    }

    render(<TransactionItem transaction={installmentTx} onDelete={vi.fn()} />)

    expect(screen.getByText('Notebook Gamer')).toBeInTheDocument()
    const badge = screen.getByTestId('installment-badge-tx-inst')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('2/10')
  })

  it('deve renderizar o badge de recorrência quando recurrence for recurring', () => {
    const recurringTx: Transaction = {
      id: 'tx-rec',
      title: 'Netflix',
      amount: 55.9,
      type: 'expense',
      category: 'Lazer',
      date: '2026-09-20',
      recurrence: 'recurring',
    }

    render(<TransactionItem transaction={recurringTx} onDelete={vi.fn()} />)

    expect(screen.getByText('Netflix')).toBeInTheDocument()
    const badge = screen.getByTestId('recurring-badge-tx-rec')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent(/recorrente/i)
  })

  it('deve renderizar o badge de status e acionar onToggleStatus ao clicar', async () => {
    const mockOnToggleStatus = vi.fn()
    const user = userEvent.setup()

    render(
      <TransactionItem
        transaction={expenseTx}
        onDelete={vi.fn()}
        onToggleStatus={mockOnToggleStatus}
      />,
    )

    const statusBtn = screen.getByTestId('status-toggle-tx-1')
    expect(statusBtn).toBeInTheDocument()
    expect(statusBtn).toHaveTextContent('Pago')

    await user.click(statusBtn)
    expect(mockOnToggleStatus).toHaveBeenCalledTimes(1)
    expect(mockOnToggleStatus).toHaveBeenCalledWith('tx-1')
  })

  it('deve renderizar status pendente para despesa pendente', () => {
    const pendingTx: Transaction = {
      ...expenseTx,
      id: 'tx-pending',
      date: '2099-01-01', // data futura
      status: 'pending',
    }

    render(<TransactionItem transaction={pendingTx} onDelete={vi.fn()} />)
    const statusBtn = screen.getByTestId('status-toggle-tx-pending')
    expect(statusBtn).toHaveTextContent('Pendente')
  })
})
