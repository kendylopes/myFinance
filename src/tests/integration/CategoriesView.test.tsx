import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import type { Category } from '../../domain/models/categories'
import type { Transaction } from '../../domain/models/transaction'
import { CategoriesView } from '../../presentation/components/categories/CategoriesView'

const mockCategories: Category[] = [
  {
    id: 'default-expense-alimentacao',
    name: 'Alimentação',
    type: 'expense',
    icon: 'Utensils',
    isCustom: false,
  },
  {
    id: 'default-expense-transporte',
    name: 'Transporte',
    type: 'expense',
    icon: 'Car',
    isCustom: false,
  },
  {
    id: 'default-income-salario',
    name: 'Salário',
    type: 'income',
    icon: 'Briefcase',
    isCustom: false,
  },
  {
    id: 'custom-cat-1',
    name: 'Streaming & Games',
    type: 'expense',
    icon: 'Tv',
    isCustom: true,
  },
]

const mockTransactions: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Supermercado',
    amount: 350,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-10-05',
    status: 'paid',
  },
  {
    id: 'tx-2',
    title: 'Uber Viagem',
    amount: 45,
    type: 'expense',
    category: 'Transporte',
    date: '2026-10-06',
    status: 'paid',
  },
  {
    id: 'tx-3',
    title: 'Assinatura Netflix',
    amount: 55,
    type: 'expense',
    category: 'Streaming & Games',
    date: '2026-10-07',
    status: 'paid',
  },
  {
    id: 'tx-4',
    title: 'Salário Mensal',
    amount: 5000,
    type: 'income',
    category: 'Salário',
    date: '2026-10-01',
    status: 'paid',
  },
]

describe('<CategoriesView /> (Gerenciador e Análise de Categorias)', () => {
  const renderComponent = (props: Partial<React.ComponentProps<typeof CategoriesView>> = {}) => {
    const handleAddCategory =
      props.onAddCategory ||
      vi.fn().mockResolvedValue({
        id: 'custom-cat-new',
        name: 'Academia',
        type: 'expense',
        icon: 'Dumbbell',
        isCustom: true,
      })
    const handleDeleteCategory = props.onDeleteCategory || vi.fn().mockResolvedValue(true)
    const handleSelectCategory = props.onSelectCategory || vi.fn()

    return {
      handleAddCategory,
      handleDeleteCategory,
      handleSelectCategory,
      ...render(
        <ToastProvider>
          <ThemeProvider>
            <CurrencyProvider>
              <CategoriesView
                transactions={mockTransactions}
                periodTransactions={mockTransactions}
                categories={mockCategories}
                onAddCategory={handleAddCategory}
                onDeleteCategory={handleDeleteCategory}
                onSelectCategory={handleSelectCategory}
                {...props}
              />
            </CurrencyProvider>
          </ThemeProvider>
        </ToastProvider>,
      ),
    }
  }

  it('deve renderizar a tela com abas e listar as categorias existentes', () => {
    renderComponent()

    expect(screen.getByTestId('tab-manage-categories')).toBeInTheDocument()
    expect(screen.getByTestId('tab-analysis-categories')).toBeInTheDocument()
    expect(screen.getByTestId('btn-open-create-category')).toBeInTheDocument()

    // Verifica que os cards das categorias estão visíveis
    expect(screen.getByTestId('category-card-default-expense-alimentacao')).toBeInTheDocument()
    expect(screen.getByTestId('category-card-default-expense-transporte')).toBeInTheDocument()
    expect(screen.getByTestId('category-card-default-income-salario')).toBeInTheDocument()
    expect(screen.getByTestId('category-card-custom-cat-1')).toBeInTheDocument()

    // Categoria customizada deve ter badge "Minha" e botão de excluir
    expect(screen.getByText('Minha')).toBeInTheDocument()
    expect(screen.getByTestId('btn-delete-category-custom-cat-1')).toBeInTheDocument()
  })

  it('deve filtrar as categorias através do campo de busca', () => {
    renderComponent()

    const searchInput = screen.getByTestId('input-search-categories')
    fireEvent.change(searchInput, { target: { value: 'Streaming' } })

    expect(screen.getByTestId('category-card-custom-cat-1')).toBeInTheDocument()
    expect(
      screen.queryByTestId('category-card-default-expense-alimentacao'),
    ).not.toBeInTheDocument()
    expect(screen.queryByTestId('category-card-default-expense-transporte')).not.toBeInTheDocument()
  })

  it('deve abrir o modal de nova categoria e permitir cadastrar com sucesso', async () => {
    const { handleAddCategory } = renderComponent()

    const openBtn = screen.getByTestId('btn-open-create-category')
    fireEvent.click(openBtn)

    expect(screen.getByRole('heading', { name: 'Nova Categoria' })).toBeInTheDocument()
    const nameInput = screen.getByTestId('input-category-name')
    fireEvent.change(nameInput, { target: { value: 'Pet Shop' } })

    const submitBtn = screen.getByTestId('btn-submit-category')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(handleAddCategory).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Pet Shop',
          type: 'expense',
        }),
      )
    })
  })

  it('deve abrir modal de confirmação de exclusão e chamar onDeleteCategory', async () => {
    const { handleDeleteCategory } = renderComponent()

    const deleteBtn = screen.getByTestId('btn-delete-category-custom-cat-1')
    fireEvent.click(deleteBtn)

    expect(screen.getByText('Excluir Categoria?')).toBeInTheDocument()

    const confirmBtn = screen.getByTestId('btn-confirm-delete-category')
    fireEvent.click(confirmBtn)

    await waitFor(() => {
      expect(handleDeleteCategory).toHaveBeenCalledWith('custom-cat-1')
    })
  })

  it('deve alternar para a aba de Distribuição & Métricas', () => {
    renderComponent()

    const analysisTab = screen.getByTestId('tab-analysis-categories')
    fireEvent.click(analysisTab)

    expect(screen.getByText('Detalhamento por Categorias')).toBeInTheDocument()
  })
})
