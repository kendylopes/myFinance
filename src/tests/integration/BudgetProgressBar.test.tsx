import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { BudgetProgress } from '../../domain/models/transaction'
import { BudgetProgressBar } from '../../presentation/components/dashboard/BudgetProgressBar'

describe('<BudgetProgressBar /> (Barra de Meta / Orçamento Mensal)', () => {
  const safeProgress: BudgetProgress = {
    budgetAmount: 3000,
    totalExpense: 1500,
    spentPercentage: 50,
    remainingAmount: 1500,
    isExceeded: false,
    status: 'safe',
  }

  const warningProgress: BudgetProgress = {
    budgetAmount: 3000,
    totalExpense: 2500,
    spentPercentage: 83.3,
    remainingAmount: 500,
    isExceeded: false,
    status: 'warning',
  }

  const exceededProgress: BudgetProgress = {
    budgetAmount: 2000,
    totalExpense: 2600,
    spentPercentage: 130,
    remainingAmount: -600,
    isExceeded: true,
    status: 'exceeded',
  }

  it('deve renderizar os dados e status "Dentro do Orçamento" corretamente', () => {
    const onUpdateMock = vi.fn().mockResolvedValue(true)
    render(<BudgetProgressBar progress={safeProgress} onUpdateBudget={onUpdateMock} />)

    expect(screen.getByTestId('budget-progress-card')).toBeInTheDocument()
    expect(screen.getByText('Dentro do Orçamento')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(
      screen.getByText(/Suas despesas continuam saudáveis e dentro do previsto/i),
    ).toBeInTheDocument()
  })

  it('deve exibir status "Alerta de Gastos" quando o percentual for de alerta (>=75%)', () => {
    const onUpdateMock = vi.fn().mockResolvedValue(true)
    render(<BudgetProgressBar progress={warningProgress} onUpdateBudget={onUpdateMock} />)

    expect(screen.getByText('Alerta de Gastos')).toBeInTheDocument()
    expect(screen.getByText('83.3%')).toBeInTheDocument()
    expect(screen.getByText(/Você já consumiu mais de 75%/i)).toBeInTheDocument()
  })

  it('deve exibir status "Orçamento Ultrapassado" e valor excedido quando estourar', () => {
    const onUpdateMock = vi.fn().mockResolvedValue(true)
    render(<BudgetProgressBar progress={exceededProgress} onUpdateBudget={onUpdateMock} />)

    expect(screen.getByText('Orçamento Ultrapassado')).toBeInTheDocument()
    expect(screen.getByText('130%')).toBeInTheDocument()
    expect(screen.getByText('Estouro Orçamentário')).toBeInTheDocument()
    expect(screen.getByText(/Suas despesas excederam o limite planejado/i)).toBeInTheDocument()
  })

  it('deve permitir abrir edição, alterar o valor e salvar novo teto', async () => {
    const onUpdateMock = vi.fn().mockResolvedValue(true)
    render(<BudgetProgressBar progress={safeProgress} onUpdateBudget={onUpdateMock} />)

    // Clicar em "Ajustar Teto"
    const editBtn = screen.getByRole('button', { name: /Ajustar Teto/i })
    fireEvent.click(editBtn)

    // Campo de input deve aparecer
    const input = screen.getByLabelText(/Definir teto orçamentário/i)
    expect(input).toBeInTheDocument()
    expect(input).toHaveValue(3000)

    // Alterar o valor para 4000
    fireEvent.change(input, { target: { value: '4000' } })
    expect(input).toHaveValue(4000)

    // Clicar em "Salvar Teto"
    const saveBtn = screen.getByRole('button', { name: /Salvar Teto/i })
    fireEvent.click(saveBtn)

    await waitFor(() => {
      expect(onUpdateMock).toHaveBeenCalledWith(4000)
    })
  })

  it('deve cancelar o modo de edição ao clicar em Cancelar', () => {
    const onUpdateMock = vi.fn().mockResolvedValue(true)
    render(<BudgetProgressBar progress={safeProgress} onUpdateBudget={onUpdateMock} />)

    // Clicar em "Ajustar Teto"
    fireEvent.click(screen.getByRole('button', { name: /Ajustar Teto/i }))
    expect(screen.getByLabelText(/Definir teto orçamentário/i)).toBeInTheDocument()

    // Clicar em "Cancelar"
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(screen.queryByLabelText(/Definir teto orçamentário/i)).not.toBeInTheDocument()
  })
})
