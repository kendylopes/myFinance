import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ToastProvider } from '../../core/toast/toastContext'
import type { Transaction } from '../../domain/models/transaction'
import {
  ImportStatementModal,
  type ImportStatementModalProps,
} from '../../presentation/components/dashboard/ImportStatementModal'

describe('<ImportStatementModal /> (Importação de Extrato Bancário)', () => {
  const defaultProps: ImportStatementModalProps = {
    isOpen: true,
    onClose: vi.fn(),
    existingTransactions: [],
    availableCategories: ['Alimentação', 'Transporte', 'Saúde', 'Salário', 'Outros'],
    onImport: vi.fn().mockResolvedValue(true),
  }

  const renderModal = (props: Partial<ImportStatementModalProps> = {}) => {
    return render(
      <ToastProvider>
        <CurrencyProvider>
          <ImportStatementModal {...defaultProps} {...props} />
        </CurrencyProvider>
      </ToastProvider>,
    )
  }

  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = renderModal({ isOpen: false })
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar a área de upload e o botão de carregar demonstração quando aberto', () => {
    renderModal()
    expect(screen.getByText('Importar Extrato Bancário')).toBeInTheDocument()
    expect(screen.getByText(/Arraste e solte o arquivo de extrato aqui/i)).toBeInTheDocument()
    expect(screen.getByTestId('load-demo-statement-btn')).toBeInTheDocument()
  })

  it('deve carregar os lançamentos de exemplo e exibir a tabela de conferência', () => {
    renderModal()

    const demoBtn = screen.getByTestId('load-demo-statement-btn')
    fireEvent.click(demoBtn)

    // Deve exibir o resumo de lançamentos encontrados
    expect(screen.getByDisplayValue('SUPERMERCADO CARREFOUR')).toBeInTheDocument()
    expect(screen.getByDisplayValue('POSTO IPIRANGA COMBUSTIVEL')).toBeInTheDocument()
    expect(screen.getByDisplayValue('TRANSFERENCIA PIX SALARIO')).toBeInTheDocument()
    expect(screen.getByTestId('confirm-import-btn')).toBeInTheDocument()
  })

  it('deve acionar onImport com as transações selecionadas ao clicar em confirmar', async () => {
    const mockImport = vi.fn().mockResolvedValue(true)
    const mockClose = vi.fn()
    renderModal({ onImport: mockImport, onClose: mockClose })

    // Carrega demo
    fireEvent.click(screen.getByTestId('load-demo-statement-btn'))

    // Confirma importação
    const confirmBtn = screen.getByTestId('confirm-import-btn')
    fireEvent.click(confirmBtn)

    expect(mockImport).toHaveBeenCalledTimes(1)
    const importedDtos = mockImport.mock.calls[0][0]
    expect(importedDtos.length).toBeGreaterThanOrEqual(1)
  })

  it('deve sinalizar transações duplicadas se já existirem no sistema', () => {
    const existing: Transaction[] = [
      {
        id: 'tx-1',
        title: 'SUPERMERCADO CARREFOUR',
        amount: 125.8,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-10-01',
      },
    ]

    renderModal({ existingTransactions: existing })
    fireEvent.click(screen.getByTestId('load-demo-statement-btn'))

    expect(screen.getByText('Duplicata')).toBeInTheDocument()
  })
})
