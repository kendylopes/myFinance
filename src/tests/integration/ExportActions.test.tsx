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

  it('deve renderizar os botões de CSV e Imprimir / PDF habilitados quando houver transações', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    const csvButton = screen.getByRole('button', { name: /Exportar CSV/i })
    const pdfButton = screen.getByRole('button', { name: /Imprimir Extrato ou PDF/i })

    expect(csvButton).toBeInTheDocument()
    expect(csvButton).not.toBeDisabled()

    expect(pdfButton).toBeInTheDocument()
    expect(pdfButton).not.toBeDisabled()
  })

  it('deve desabilitar os botões se a lista de transações for vazia', () => {
    render(
      <ExportActions
        transactions={[]}
        summary={{ totalIncome: 0, totalExpense: 0, balance: 0 }}
        selectedMonth="2026-09"
      />,
    )

    const csvButton = screen.getByRole('button', { name: /Exportar CSV/i })
    const pdfButton = screen.getByRole('button', { name: /Imprimir Extrato ou PDF/i })

    expect(csvButton).toBeDisabled()
    expect(pdfButton).toBeDisabled()
  })

  it('deve acionar downloadBlob ao clicar no botão de CSV', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    const csvButton = screen.getByRole('button', { name: /Exportar CSV/i })
    fireEvent.click(csvButton)

    expect(downloadBlob).toHaveBeenCalledTimes(1)
    expect(downloadBlob).toHaveBeenCalledWith(
      expect.stringContaining('Consultoria'),
      'extrato_myfinance_2026-09.csv',
      'text/csv;charset=utf-8;',
    )
  })

  it('deve acionar openPrintWindow ao clicar no botão de PDF', () => {
    render(
      <ExportActions
        transactions={sampleTransactions}
        summary={sampleSummary}
        selectedMonth="2026-09"
      />,
    )

    const pdfButton = screen.getByRole('button', { name: /Imprimir Extrato ou PDF/i })
    fireEvent.click(pdfButton)

    expect(openPrintWindow).toHaveBeenCalledTimes(1)
    expect(openPrintWindow).toHaveBeenCalledWith(expect.stringContaining('Consultoria'))
  })
})
