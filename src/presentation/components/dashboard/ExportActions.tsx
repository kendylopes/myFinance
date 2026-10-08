import { ChevronDown, Download, FileSpreadsheet, Printer, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatMonthYear } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import { downloadBlob, openPrintWindow } from '../../../core/utils/download'
import type { FinanceSummary, Transaction } from '../../../domain/models/transaction'
import { generateCsvContent, generatePrintableHtml } from '../../../domain/services/exportService'

export interface ExportActionsProps {
  transactions: Transaction[]
  summary: FinanceSummary
  selectedMonth: string
  onOpenImport?: () => void
}

export function ExportActions({
  transactions,
  summary,
  selectedMonth,
  onOpenImport,
}: ExportActionsProps) {
  const toast = useToast()
  const [isExportOpen, setIsExportOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const hasTransactions = transactions.length > 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleExportCsv = () => {
    if (!hasTransactions) return
    soundFX.playSuccess()
    const csv = generateCsvContent(transactions)
    const monthSuffix = selectedMonth === 'all' ? 'todos_periodos' : selectedMonth
    const filename = `extrato_myfinance_${monthSuffix}.csv`
    downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
    toast.success('Relatório CSV Baixado', `Arquivo ${filename} gerado com sucesso.`)
  }

  const handleExportPdf = () => {
    if (!hasTransactions) return
    soundFX.playSuccess()
    const periodLabel = formatMonthYear(selectedMonth)
    const html = generatePrintableHtml(transactions, summary, periodLabel)
    openPrintWindow(html)
    toast.info('Visualização de Impressão', 'Janela de impressão e exportação aberta.')
  }

  return (
    <div data-testid="export-actions" className="flex items-center gap-2">
      {/* Botão de Exportação Agrupado em Menu Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            setIsExportOpen((prev) => !prev)
          }}
          disabled={!hasTransactions}
          title={hasTransactions ? 'Opções de exportação' : 'Sem dados para exportar'}
          aria-label="Exportar"
          aria-expanded={isExportOpen}
          aria-haspopup="true"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium glass-pill hover:border-white/25 hover:bg-white/10 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all duration-150 shadow-xs cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
          <span>Exportar</span>
          <ChevronDown
            className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${
              isExportOpen ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {isExportOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-white/15 shadow-2xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100 space-y-0.5"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsExportOpen(false)
                handleExportCsv()
              }}
              title="Baixar planilha em formato CSV"
              aria-label="Exportar CSV"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" aria-hidden="true" />
              <div>
                <span className="font-medium block text-white">Planilha CSV</span>
                <span className="text-[10px] text-zinc-400 block">Para Excel ou Planilhas</span>
              </div>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setIsExportOpen(false)
                handleExportPdf()
              }}
              title="Imprimir extrato ou salvar como PDF"
              aria-label="Imprimir Extrato ou PDF"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-left text-zinc-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4 text-cyan-400 shrink-0" aria-hidden="true" />
              <div>
                <span className="font-medium block text-white">Imprimir / PDF</span>
                <span className="text-[10px] text-zinc-400 block">Visualizar ou salvar</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Botão de Destaque: Importar Extrato */}
      {onOpenImport && (
        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            onOpenImport()
          }}
          title="Importar extrato bancário (OFX ou CSV)"
          aria-label="Importar Extrato"
          data-testid="open-import-statement-btn"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 transition-all duration-150 shadow-xs cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Importar Extrato</span>
        </button>
      )}
    </div>
  )
}
