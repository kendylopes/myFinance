import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ThemeProvider } from '../../core/theme/themeContext'
import type { Transaction } from '../../domain/models/transaction'
import { CardsAndInvoicesView } from '../../presentation/components/cards/CardsAndInvoicesView'

describe('<CardsAndInvoicesView /> (Tela de Cartões & Faturas Futuras)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      title: 'Notebook Dell (1/2)',
      amount: 450,
      type: 'expense',
      category: 'Tecnologia',
      date: '2026-10-10',
      recurrence: 'installment',
      status: 'pending',
    },
    {
      id: 'tx-2',
      title: 'Notebook Dell (2/2)',
      amount: 450,
      type: 'expense',
      category: 'Tecnologia',
      date: '2026-11-10',
      recurrence: 'installment',
      status: 'pending',
    },
  ]

  const renderComponent = (props = {}) => {
    return render(
      <ThemeProvider>
        <CurrencyProvider>
          <CardsAndInvoicesView transactions={sampleTransactions} {...props} />
        </CurrencyProvider>
      </ThemeProvider>,
    )
  }

  it('deve renderizar os cards de resumo analítico de parcelamentos', () => {
    renderComponent()

    expect(screen.getByText(/Total Futuro a Pagar/i)).toBeInTheDocument()
    expect(screen.getByText(/Compras Ativas/i)).toBeInTheDocument()
    expect(screen.getByText(/Maior Fatura Prevista/i)).toBeInTheDocument()
  })

  it('deve alternar entre a aba de Evolução de Faturas e a aba de Compras Parceladas', () => {
    renderComponent()

    expect(screen.getByText('Evolução das Faturas (12 Meses)')).toBeInTheDocument()
    const purchasesTab = screen.getByRole('button', { name: /Compras Parceladas/i })
    fireEvent.click(purchasesTab)

    expect(screen.getByText('Notebook Dell')).toBeInTheDocument()
    expect(screen.getByText(/0\/2 pagas/i)).toBeInTheDocument()
  })

  it('deve expandir detalhes das parcelas ao clicar no card da compra', () => {
    const onToggleStatus = vi.fn()
    renderComponent({ onToggleStatus })

    // Alterna para aba de compras
    fireEvent.click(screen.getByRole('button', { name: /Compras Parceladas/i }))

    // Clica no card para expandir
    const purchaseCardBtn = screen.getByText('Notebook Dell').closest('button')
    if (purchaseCardBtn) {
      fireEvent.click(purchaseCardBtn)
    }

    expect(screen.getByText('Detalhamento das Parcelas')).toBeInTheDocument()
    expect(screen.getByText('Notebook Dell (1/2)')).toBeInTheDocument()

    // Clica no botão de status da parcela
    const toggleBtns = screen.getAllByRole('button', { name: /Pendente/i })
    expect(toggleBtns.length).toBeGreaterThan(0)
    fireEvent.click(toggleBtns[0])

    expect(onToggleStatus).toHaveBeenCalledWith('tx-1')
  })
})
