import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransactionModal } from '../../presentation/components/dashboard/TransactionModal'

describe('<TransactionModal /> (Componente de Modal de Transações)', () => {
  it('não deve renderizar nada quando isOpen for false', () => {
    const mockOnAdd = vi.fn()
    const mockOnClose = vi.fn()

    render(<TransactionModal isOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve renderizar o modal e fechar ao pressionar a tecla Escape', () => {
    const mockOnAdd = vi.fn()
    const mockOnClose = vi.fn()

    render(<TransactionModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Nova Transação')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('deve inicializar com o tipo correto (income)', () => {
    const mockOnAdd = vi.fn()
    const mockOnClose = vi.fn()

    render(
      <TransactionModal
        isOpen={true}
        onClose={mockOnClose}
        onAdd={mockOnAdd}
        initialType="income"
      />,
    )

    // O botão de Receitas deve estar ativo com aria-pressed="true"
    const incomeOption = screen.getByRole('button', { name: /Receita/i })
    expect(incomeOption).toHaveAttribute('aria-pressed', 'true')
  })
})
