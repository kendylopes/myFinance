import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import { TransactionList } from '../../presentation/components/dashboard/TransactionList'

describe('<TransactionList /> (Ações Rápidas no Extrato & Seleção em Massa)', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Almoço Executivo',
      amount: 45,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-20',
    },
    {
      id: 'tx-2',
      title: 'Salário Desenvolvedor',
      amount: 7000,
      type: 'income',
      category: 'Trabalho',
      date: '2026-09-05',
    },
    {
      id: 'tx-3',
      title: 'Uber Viagem',
      amount: 32.5,
      type: 'expense',
      category: 'Transporte',
      date: '2026-09-15',
    },
  ]

  it('deve renderizar a listagem de transações e botão de duplicar', async () => {
    const mockDelete = vi.fn()
    const mockDuplicate = vi.fn()
    const user = userEvent.setup()

    render(
      <TransactionList
        transactions={mockTransactions}
        isLoading={false}
        onDelete={mockDelete}
        onDuplicate={mockDuplicate}
      />,
    )

    expect(screen.getByText('Almoço Executivo')).toBeInTheDocument()
    expect(screen.getByText('Salário Desenvolvedor')).toBeInTheDocument()

    const dupBtn = screen.getByTestId('duplicate-btn-tx-1')
    expect(dupBtn).toBeInTheDocument()

    await user.click(dupBtn)
    expect(mockDuplicate).toHaveBeenCalledWith('tx-1')
  })

  it('deve permitir selecionar itens e exibir a barra de ações em massa', async () => {
    const mockDelete = vi.fn()
    const mockDeleteMultiple = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(
      <TransactionList
        transactions={mockTransactions}
        isLoading={false}
        onDelete={mockDelete}
        onDeleteMultiple={mockDeleteMultiple}
      />,
    )

    // Barra de ações não deve estar visível inicialmente
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument()

    // Selecionar o primeiro item
    const checkbox1 = screen.getByTestId('checkbox-select-tx-1')
    await user.click(checkbox1)

    // Barra de ações deve aparecer indicando 1 selecionado
    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument()
    expect(screen.getByText(/1 transação selecionada/i)).toBeInTheDocument()

    // Selecionar o segundo item
    const checkbox2 = screen.getByTestId('checkbox-select-tx-2')
    await user.click(checkbox2)

    expect(screen.getByText(/2 transações selecionadas/i)).toBeInTheDocument()

    // Clicar em "Desmarcar todas"
    const clearBtn = screen.getByRole('button', { name: /desmarcar todas/i })
    await user.click(clearBtn)

    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument()
  })

  it('deve selecionar todas as transações da página pelo checkbox geral', async () => {
    const mockDelete = vi.fn()
    const mockDeleteMultiple = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(
      <TransactionList
        transactions={mockTransactions}
        isLoading={false}
        onDelete={mockDelete}
        onDeleteMultiple={mockDeleteMultiple}
      />,
    )

    const selectAllCheckbox = screen.getByTestId('select-all-page-checkbox')
    await user.click(selectAllCheckbox)

    expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument()
    expect(screen.getByText(/3 transações selecionadas/i)).toBeInTheDocument()

    // Desmarcar todas pelo checkbox geral
    await user.click(selectAllCheckbox)
    expect(screen.queryByTestId('bulk-action-bar')).not.toBeInTheDocument()
  })

  it('deve abrir modal de confirmação e acionar onDeleteMultiple ao confirmar', async () => {
    const mockDelete = vi.fn()
    const mockDeleteMultiple = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(
      <TransactionList
        transactions={mockTransactions}
        isLoading={false}
        onDelete={mockDelete}
        onDeleteMultiple={mockDeleteMultiple}
      />,
    )

    // Selecionar 2 itens
    await user.click(screen.getByTestId('checkbox-select-tx-1'))
    await user.click(screen.getByTestId('checkbox-select-tx-3'))

    // Clicar em Excluir 2
    const bulkDeleteBtn = screen.getByTestId('bulk-delete-btn')
    await user.click(bulkDeleteBtn)

    // Modal de confirmação visível
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByText(/Excluir Transações Selecionadas/i)).toBeInTheDocument()

    // Confirmar exclusão
    const confirmBtn = screen.getByTestId('confirm-bulk-delete-btn')
    await user.click(confirmBtn)

    expect(mockDeleteMultiple).toHaveBeenCalledWith(['tx-1', 'tx-3'])
  })
})
