import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MonthSelector } from '../../presentation/components/dashboard/MonthSelector'

describe('<MonthSelector /> (Navegação Mensal)', () => {
  it('deve renderizar o mês selecionado formatado por extenso', () => {
    render(
      <MonthSelector
        selectedMonth="2026-09"
        onPreviousMonth={vi.fn()}
        onNextMonth={vi.fn()}
        onCurrentMonth={vi.fn()}
        onToggleAllPeriods={vi.fn()}
      />,
    )

    expect(screen.getByTestId('selected-month-text')).toHaveTextContent(/Setembro de 2026/i)
  })

  it('deve acionar os callbacks ao clicar nos botões de navegação', async () => {
    const mockPrevious = vi.fn()
    const mockNext = vi.fn()
    const mockToggleAll = vi.fn()
    const user = userEvent.setup()

    render(
      <MonthSelector
        selectedMonth="2026-09"
        onPreviousMonth={mockPrevious}
        onNextMonth={mockNext}
        onCurrentMonth={vi.fn()}
        onToggleAllPeriods={mockToggleAll}
      />,
    )

    const prevBtn = screen.getByRole('button', { name: /Mês anterior/i })
    await user.click(prevBtn)
    expect(mockPrevious).toHaveBeenCalledTimes(1)

    const nextBtn = screen.getByRole('button', { name: /Próximo mês/i })
    await user.click(nextBtn)
    expect(mockNext).toHaveBeenCalledTimes(1)

    const toggleBtn = screen.getByTestId('toggle-all-periods-btn')
    await user.click(toggleBtn)
    expect(mockToggleAll).toHaveBeenCalledTimes(1)
  })

  it('deve exibir botão de atalho para o mês atual quando estiver em outro mês', async () => {
    const mockCurrent = vi.fn()
    const user = userEvent.setup()

    render(
      <MonthSelector
        selectedMonth="2025-01"
        onPreviousMonth={vi.fn()}
        onNextMonth={vi.fn()}
        onCurrentMonth={mockCurrent}
        onToggleAllPeriods={vi.fn()}
      />,
    )

    const currentBtn = screen.getByRole('button', { name: /Mês Atual/i })
    expect(currentBtn).toBeInTheDocument()

    await user.click(currentBtn)
    expect(mockCurrent).toHaveBeenCalledTimes(1)
  })
})
