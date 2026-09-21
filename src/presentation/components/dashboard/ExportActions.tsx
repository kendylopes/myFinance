import { formatMonthYear } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { downloadBlob, openPrintWindow } from '../../../core/utils/download'
import type { FinanceSummary, Transaction } from '../../../domain/models/transaction'
import { generateCsvContent, generatePrintableHtml } from '../../../domain/services/exportService'

export interface ExportActionsProps {
  transactions: Transaction[]
  summary: FinanceSummary
  selectedMonth: string
}

export function ExportActions({ transactions, summary, selectedMonth }: ExportActionsProps) {
  const hasTransactions = transactions.length > 0

  const handleExportCsv = () => {
    if (!hasTransactions) return
    soundFX.playSuccess()
    const csv = generateCsvContent(transactions)
    const monthSuffix = selectedMonth === 'all' ? 'todos_periodos' : selectedMonth
    const filename = `extrato_myfinance_${monthSuffix}.csv`
    downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
  }

  const handleExportPdf = () => {
    if (!hasTransactions) return
    soundFX.playSuccess()
    const periodLabel = formatMonthYear(selectedMonth)
    const html = generatePrintableHtml(transactions, summary, periodLabel)
    openPrintWindow(html)
  }

  return (
    <div data-testid="export-actions" className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExportCsv}
        disabled={!hasTransactions}
        title={hasTransactions ? 'Baixar planilha em formato CSV' : 'Sem dados para exportar'}
        aria-label="Exportar CSV"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium glass-pill hover:border-white/25 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 shadow-sm cursor-pointer"
      >
        <svg
          className="w-3.5 h-3.5 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        <span>CSV</span>
      </button>

      <button
        type="button"
        onClick={handleExportPdf}
        disabled={!hasTransactions}
        title={hasTransactions ? 'Imprimir extrato ou salvar como PDF' : 'Sem dados para exportar'}
        aria-label="Imprimir Extrato ou PDF"
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium glass-pill hover:border-white/25 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 shadow-sm cursor-pointer"
      >
        <svg
          className="w-3.5 h-3.5 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.72 13.829c-.24-1.076-.673-2.023-1.28-2.829m13.12 2.829c.24-1.076.673-2.023 1.28-2.829M6 8.25V6.75A2.25 2.25 0 018.25 4.5h7.5A2.25 2.25 0 0118 6.75v1.5m-12 0h12M4.5 19.5h15a2.25 2.25 0 002.25-2.25V10.5A2.25 2.25 0 0019.5 8.25H4.5A2.25 2.25 0 002.25 10.5v6.75A2.25 2.25 0 004.5 19.5z"
          />
        </svg>
        <span>Imprimir / PDF</span>
      </button>
    </div>
  )
}
