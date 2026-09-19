import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TransactionForm } from '../../presentation/components/dashboard/TransactionForm'

describe('<TransactionForm /> (Interação do Usuário & Formulário)', () => {
  it('deve preencher e submeter o formulário chamando a função onAdd', async () => {
    const mockOnAdd = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(<TransactionForm onAdd={mockOnAdd} />)

    // Preenche a descrição
    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'Almoço Restaurante')

    // Preenche o valor
    const amountInput = screen.getByTestId('input-amount')
    await user.type(amountInput, '75.50')

    // Clica para enviar
    const submitBtn = screen.getByRole('button', { name: /Registrar Movimentação/i })
    await user.click(submitBtn)

    // Verifica se onAdd foi acionado com os dados corretos
    expect(mockOnAdd).toHaveBeenCalledTimes(1)
    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Almoço Restaurante',
        amount: 75.5,
        type: 'expense',
      }),
    )
  })

  it('deve exibir mensagem de erro se o formulário for enviado sem descrição', async () => {
    const mockOnAdd = vi.fn()
    const user = userEvent.setup()

    render(<TransactionForm onAdd={mockOnAdd} />)

    const amountInput = screen.getByTestId('input-amount')
    await user.type(amountInput, '100')

    const submitBtn = screen.getByRole('button', { name: /Registrar Movimentação/i })
    await user.click(submitBtn)

    expect(screen.getByRole('alert')).toHaveTextContent(/informe uma descrição/i)
    expect(mockOnAdd).not.toHaveBeenCalled()
  })
})
