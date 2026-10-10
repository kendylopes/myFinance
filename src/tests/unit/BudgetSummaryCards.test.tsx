import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import type { BudgetProgress } from '../../domain/models/transaction'
import { BudgetSummaryCards } from '../../presentation/components/dashboard/BudgetSummaryCards'

describe('<BudgetSummaryCards /> (Cards de KPI de Planejamento)', () => {
  const sampleProgress: BudgetProgress = {
    budgetAmount: 5000,
    totalExpense: 3200,
    remainingAmount: 1800,
    spentPercentage: 64,
    isExceeded: false,
    status: 'safe',
  }

  const renderComponent = (progress = sampleProgress, selectedMonth = '2026-10') => {
    return render(
      <CurrencyProvider>
        <BudgetSummaryCards progress={progress} selectedMonth={selectedMonth} />
      </CurrencyProvider>,
    )
  }

  it('deve renderizar os 4 cards analíticos de planejamento corretamente', () => {
    renderComponent()

    expect(screen.getByText('Teto Mensal')).toBeInTheDocument()
    expect(screen.getByText('Total Gasto')).toBeInTheDocument()
    expect(screen.getByText('Margem Livre')).toBeInTheDocument()
    expect(screen.getByText('Meta Diária Segura')).toBeInTheDocument()
    expect(screen.getByText(/64.0% do teto consumido/i)).toBeInTheDocument()
  })

  it('deve indicar alerta de Teto Excedido caso o orçamento seja estourado', () => {
    const exceededProgress: BudgetProgress = {
      budgetAmount: 4000,
      totalExpense: 4800,
      remainingAmount: -800,
      spentPercentage: 120,
      isExceeded: true,
      status: 'exceeded',
    }

    renderComponent(exceededProgress)

    expect(screen.getByText('Teto Excedido')).toBeInTheDocument()
    expect(screen.getByText(/Gastos além da meta estipulada/i)).toBeInTheDocument()
  })
})
