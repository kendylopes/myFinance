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
})
