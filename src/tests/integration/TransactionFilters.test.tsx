import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TransactionFilters } from '../../presentation/components/dashboard/TransactionFilters'

describe('<TransactionFilters /> (Filtros por Categoria & Busca Textual)', () => {
  const defaultProps = {
    searchQuery: '',
    onSearchChange: vi.fn(),
    selectedCategory: 'all',
    onCategoryChange: vi.fn(),
    selectedType: 'all' as const,
    onTypeChange: vi.fn(),
    categories: ['Alimentação', 'Moradia', 'Transporte', 'Lazer'],
    totalFilteredCount: 5,
    totalPeriodCount: 10,
    hasActiveFilters: false,
    onClearFilters: vi.fn(),
  }

  it('deve renderizar o input de busca, seletor de tipos e chips de categoria', () => {
    render(<TransactionFilters {...defaultProps} />)

    expect(screen.getByTestId('transaction-filters')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/Buscar por descrição ou categoria/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todos' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entradas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Saídas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Todas' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alimentação' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Moradia' })).toBeInTheDocument()
  })

  it('deve disparar onSearchChange ao digitar no campo de busca', () => {
    const onSearchChange = vi.fn()
    render(<TransactionFilters {...defaultProps} onSearchChange={onSearchChange} />)

    const input = screen.getByPlaceholderText(/Buscar por descrição ou categoria/i)
    fireEvent.change(input, { target: { value: 'mercado' } })

    expect(onSearchChange).toHaveBeenCalledWith('mercado')
  })

  it('deve exibir botão de limpar busca e disparar limpeza com string vazia', () => {
    const onSearchChange = vi.fn()
    render(
      <TransactionFilters
        {...defaultProps}
        searchQuery="mercado"
        onSearchChange={onSearchChange}
      />,
    )

    const clearSearchBtn = screen.getByRole('button', { name: /Limpar busca/i })
    expect(clearSearchBtn).toBeInTheDocument()

    fireEvent.click(clearSearchBtn)
    expect(onSearchChange).toHaveBeenCalledWith('')
  })

  it('deve alternar o tipo de transação ao clicar nos botões correspondentes', () => {
    const onTypeChange = vi.fn()
    render(<TransactionFilters {...defaultProps} onTypeChange={onTypeChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Entradas' }))
    expect(onTypeChange).toHaveBeenCalledWith('income')

    fireEvent.click(screen.getByRole('button', { name: 'Saídas' }))
    expect(onTypeChange).toHaveBeenCalledWith('expense')
  })

  it('deve disparar onCategoryChange ao clicar em um chip de categoria', () => {
    const onCategoryChange = vi.fn()
    render(<TransactionFilters {...defaultProps} onCategoryChange={onCategoryChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'Moradia' }))
    expect(onCategoryChange).toHaveBeenCalledWith('Moradia')

    fireEvent.click(screen.getByRole('button', { name: 'Todas' }))
    expect(onCategoryChange).toHaveBeenCalledWith('all')
  })

  it('deve exibir contagem e botão de limpar filtros quando hasActiveFilters for true', () => {
    const onClearFilters = vi.fn()
    render(
      <TransactionFilters
        {...defaultProps}
        hasActiveFilters={true}
        totalFilteredCount={2}
        totalPeriodCount={8}
        onClearFilters={onClearFilters}
      />,
    )

    expect(screen.getByText(/Exibindo/i)).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()

    const clearFiltersBtn = screen.getByRole('button', { name: /Limpar filtros/i })
    fireEvent.click(clearFiltersBtn)
    expect(onClearFilters).toHaveBeenCalled()
  })
})
