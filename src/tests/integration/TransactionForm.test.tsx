import { fireEvent, render, screen } from '@testing-library/react'
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
    fireEvent.change(titleInput, { target: { value: 'Almoço Restaurante' } })

    // Preenche o valor
    const amountInput = screen.getByTestId('input-amount')
    fireEvent.change(amountInput, { target: { value: '75.50' } })

    // Clica para enviar
    const submitBtn = screen.getByRole('button', { name: /Registrar Transação/i })
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

    const submitBtn = screen.getByRole('button', { name: /Registrar Transação/i })
    await user.click(submitBtn)

    expect(screen.getByRole('alert')).toHaveTextContent(/informe uma descrição/i)
    expect(mockOnAdd).not.toHaveBeenCalled()
  })

  it('deve auto-sugerir a categoria ao digitar palavras-chave conhecidas na descrição', async () => {
    const mockOnAdd = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    render(<TransactionForm onAdd={mockOnAdd} />)

    const titleInput = screen.getByTestId('input-title')
    await user.type(titleInput, 'Gasolina aditivada')

    // Deve exibir o badge "Sugerido"
    expect(screen.getByText(/Sugerido/i)).toBeInTheDocument()

    // Categoria deve ter mudado para Transporte
    const categoryInput = screen.getByTestId('input-category')
    expect(categoryInput).toHaveValue('Transporte')
  }, 20000)

  it('deve permitir criar e selecionar uma nova categoria personalizada', async () => {
    const mockOnAdd = vi.fn().mockResolvedValue(true)
    const mockOnAddCategory = vi.fn().mockResolvedValue({
      id: 'custom-cat-1',
      name: 'Pet Shop',
      type: 'expense',
      icon: 'Tag',
      isCustom: true,
    })
    const user = userEvent.setup()

    render(<TransactionForm onAdd={mockOnAdd} onAddCategory={mockOnAddCategory} />)

    // Abre o dropdown de categorias
    const selectBtn = screen.getByTestId('category-select-btn')
    await user.click(selectBtn)

    // Clica no botão para criar nova categoria
    const createCatBtn = screen.getByRole('button', { name: /\+ Criar nova categoria/i })
    await user.click(createCatBtn)

    // Preenche o nome da nova categoria
    const newCatInput = screen.getByPlaceholderText(/Ex: Dividendos, Pet Shop/i)
    await user.type(newCatInput, 'Pet Shop')

    // Clica em Salvar Categoria
    const saveBtn = screen.getByRole('button', { name: /Salvar Categoria/i })
    await user.click(saveBtn)

    expect(mockOnAddCategory).toHaveBeenCalledWith({
      name: 'Pet Shop',
      type: 'expense',
      icon: 'Tag',
    })

    // Preenche os outros campos e submete
    fireEvent.change(screen.getByTestId('input-title'), { target: { value: 'Vacina do cachorro' } })
    fireEvent.change(screen.getByTestId('input-amount'), { target: { value: '120' } })

    const submitBtn = screen.getByRole('button', { name: /Registrar Transação/i })
    await user.click(submitBtn)

    expect(mockOnAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Vacina do cachorro',
        amount: 120,
        category: 'Pet Shop',
        type: 'expense',
      }),
    )
  }, 25000)

  it('deve pré-preencher os campos e acionar onEdit ao editar uma transação existente', async () => {
    const mockOnAdd = vi.fn()
    const mockOnEdit = vi.fn().mockResolvedValue(true)
    const user = userEvent.setup()

    const existingTx = {
      id: 'tx-99',
      title: 'Academia Mensal',
      amount: 150,
      type: 'expense' as const,
      category: 'Saúde',
      date: '2026-09-15',
    }

    render(<TransactionForm onAdd={mockOnAdd} onEdit={mockOnEdit} transactionToEdit={existingTx} />)

    // Verifica pré-preenchimento
    expect(screen.getByText('Editar Transação')).toBeInTheDocument()
    expect(screen.getByTestId('input-title')).toHaveValue('Academia Mensal')
    expect(screen.getByTestId('input-amount')).toHaveValue('150')

    // Altera o valor
    fireEvent.change(screen.getByTestId('input-amount'), { target: { value: '180' } })

    // Clica no botão de Salvar Alterações
    const submitBtn = screen.getByRole('button', { name: /Salvar Alterações/i })
    await user.click(submitBtn)

    expect(mockOnEdit).toHaveBeenCalledTimes(1)
    expect(mockOnEdit).toHaveBeenCalledWith('tx-99', {
      title: 'Academia Mensal',
      amount: 180,
      type: 'expense',
      category: 'Saúde',
      date: '2026-09-15',
    })
    expect(mockOnAdd).not.toHaveBeenCalled()
  })
})
