import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CategorySelectDropdown } from '../../presentation/components/dashboard/CategorySelectDropdown'

describe('<CategorySelectDropdown />', () => {
  it('deve renderizar a categoria selecionada inicialmente no botão', () => {
    render(
      <CategorySelectDropdown
        category="Alimentação"
        onSelectCategory={vi.fn()}
        type="expense"
        isCustomCategory={false}
        onEnableCustom={vi.fn()}
      />,
    )

    expect(screen.getByTestId('category-select-btn')).toHaveTextContent('Alimentação')
  })

  it('deve abrir o menu flutuante ao clicar no botão', async () => {
    const user = userEvent.setup()
    render(
      <CategorySelectDropdown
        category="Alimentação"
        onSelectCategory={vi.fn()}
        type="expense"
        isCustomCategory={false}
        onEnableCustom={vi.fn()}
      />,
    )

    const btn = screen.getByTestId('category-select-btn')
    await user.click(btn)

    expect(screen.getByText('Moradia')).toBeInTheDocument()
    expect(screen.getByText('Transporte')).toBeInTheDocument()
  })

  it('deve acionar onSelectCategory ao clicar em uma categoria da lista', async () => {
    const user = userEvent.setup()
    const mockSelect = vi.fn()

    render(
      <CategorySelectDropdown
        category="Alimentação"
        onSelectCategory={mockSelect}
        type="expense"
        isCustomCategory={false}
        onEnableCustom={vi.fn()}
      />,
    )

    await user.click(screen.getByTestId('category-select-btn'))
    await user.click(screen.getByRole('button', { name: /Moradia/i }))

    expect(mockSelect).toHaveBeenCalledWith('Moradia')
  })
})
