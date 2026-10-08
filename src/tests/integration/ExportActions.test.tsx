import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FinanceSummary, Transaction } from '../../domain/models/transaction'
import { ExportActions } from '../../presentation/components/dashboard/ExportActions'

// Mock dos utilitários de download e impressão do navegador
vi.mock('../../core/utils/download', () => ({
  downloadBlob: vi.fn(),
  openPrintWindow: vi.fn(),
}))

import { downloadBlob, openPrintWindow } from '../../core/utils/download'

describe('<ExportActions /> (Botões de Exportação CSV e PDF)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Consultoria',
      amount: 2000,
      type: 'income',
      category: 'Serviços',
      date: '2026-09-01',
    },
  ]

  const sampleSummary: FinanceSummary = {
    totalIncome: 2000,
    totalExpense: 0,
    balance: 2000,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve renderizar o menu de exportação e exibir opções de CSV e PDF ao abrir', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    const exportTrigger = screen.getByRole('button', { name: 'Exportar' })
    expect(exportTrigger).toBeInTheDocument()
    expect(exportTrigger).not.toBeDisabled()

    // Abre o dropdown
    fireEvent.click(exportTrigger)

    const csvButton = screen.getByRole('menuitem', { name: /Exportar CSV/i })
    const pdfButton = screen.getByRole('menuitem', { name: /Imprimir Extrato ou PDF/i })

    expect(csvButton).toBeInTheDocument()
    expect(pdfButton).toBeInTheDocument()
  })

  it('deve desabilitar o botão de exportar se a lista de transações for vazia', () => {
    render(
      <ExportActions
        transactions={[]}
        summary={{ totalIncome: 0, totalExpense: 0, balance: 0 }}
        selectedMonth="2026-09"
      />,
    )

    const exportTrigger = screen.getByRole('button', { name: 'Exportar' })
    expect(exportTrigger).toBeDisabled()
  })

  it('deve acionar downloadBlob ao clicar no botão de CSV dentro do menu', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    // Abre o menu
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))

    const csvButton = screen.getByRole('menuitem', { name: /Exportar CSV/i })
    fireEvent.click(csvButton)

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.stringContaining('Consultoria'),
      'extrato_myfinance_2026-09.csv',
      'text/csv;charset=utf-8;',
    )
  })

  it('deve acionar openPrintWindow ao clicar no botão de PDF dentro do menu', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    // Abre o menu
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }))

    const pdfButton = screen.getByRole('menuitem', { name: /Imprimir Extrato ou PDF/i })
    fireEvent.click(pdfButton)

    expect(openPrintWindow).toHaveBeenCalledTimes(1)
    expect(openPrintWindow).toHaveBeenCalledWith(expect.stringContaining('Consultoria'))
  })
})
