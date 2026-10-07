import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import type { Debt } from '../../domain/models/debt'
import { DebtsView } from '../../presentation/components/debts/DebtsView'

// Mock do hook useDebts
const mockDebts: Debt[] = [
  {
    id: 'debt-1',
    lenderName: 'Agiota Zé',
    description: 'Empréstimo urgente',
    originalAmount: 3000,
    currentBalance: 2500,
    interestRate: 15,
    interestType: 'monthly',
    startDate: '2026-09-01',
    dueDate: '2026-10-15',
    paidInstallments: 0,
    status: 'active',
    createdAt: '2026-09-01',
    updatedAt: '2026-09-01',
  },
  {
    id: 'debt-2',
    lenderName: 'Nubank Crédito',
    description: 'Renegociação',
    originalAmount: 1200,
    currentBalance: 600,
    interestRate: 5,
    interestType: 'monthly',
    startDate: '2026-08-01',
    dueDate: '2026-10-20',
    paidInstallments: 1,
    status: 'active',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01',
  },
]

vi.mock('../../presentation/hooks/useDebts', () => ({
  useDebts: () => ({
    debts: mockDebts,
    payments: [],
    activeDebts: mockDebts,
    paidDebts: [],
    overdueDebts: [],
    totalDebtBalance: 3100,
    totalInterestPaid: 450,
    totalAmountPaid: 1100,
    isLoading: false,
    isPrivacyMode: false,
    togglePrivacyMode: vi.fn(),
    addDebt: vi.fn(),
    updateDebt: vi.fn(),
    deleteDebt: vi.fn(),
    payDebt: vi.fn(),
  }),
}))

describe('<DebtsView /> (Central de Dívidas & Simulador de Quitação)', () => {
  const renderComponent = () => {
    return render(
      <ToastProvider>
        <ThemeProvider>
          <CurrencyProvider>
            <DebtsView />
          </CurrencyProvider>
        </ThemeProvider>
      </ToastProvider>,
    )
  }

  it('deve renderizar a tela de contratos com os cards de resumo e credores', () => {
    renderComponent()

    expect(screen.getByText('Contratos & Compromissos')).toBeInTheDocument()
    expect(screen.getByText('Meus Contratos (2)')).toBeInTheDocument()
    expect(screen.getByText('Simulador de Quitação')).toBeInTheDocument()
    expect(screen.getByText('Agiota Zé')).toBeInTheDocument()
    expect(screen.getByText('Nubank Crédito')).toBeInTheDocument()
  })

  it('deve alternar para a aba do Simulador de Quitação e comparar estratégias', () => {
    renderComponent()

    const simulatorTab = screen.getByText('Simulador de Quitação')
    fireEvent.click(simulatorTab)

    expect(screen.getByText('Simulador Inteligente de Amortização')).toBeInTheDocument()
    expect(screen.getByText('Método Avalanche')).toBeInTheDocument()
    expect(screen.getByText('Método Bola de Neve')).toBeInTheDocument()
    expect(screen.getByText(/Ordem de Ataque Recomendada/i)).toBeInTheDocument()

    // Clica no método bola de neve
    const snowballCard = screen.getByText('Mais Motivacional').closest('button')
    if (snowballCard) {
      fireEvent.click(snowballCard)
      expect(screen.getByText(/Ordem de Ataque Recomendada \(Bola de Neve\)/i)).toBeInTheDocument()
    }
  })
})
