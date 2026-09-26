import { BarChart3, Download, Printer } from 'lucide-react'
import { useMemo, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import { downloadBlob, openPrintWindow } from '../../../core/utils/download'
import type { Category } from '../../../domain/models/categories'
import type { Transaction } from '../../../domain/models/transaction'
import { generateCsvContent, generatePrintableHtml } from '../../../domain/services/exportService'
import {
  generateReportData,
  type ReportPeriodType,
  toLocalISODate,
} from '../../../domain/services/reportCalculations'
import { ExpenseCategoryChart } from '../dashboard/ExpenseCategoryChart'
import { ReportEvolutionChart } from './ReportEvolutionChart'
import { ReportPeriodSelector } from './ReportPeriodSelector'
import { ReportSummaryCards } from './ReportSummaryCards'
import { ReportTopExpenses } from './ReportTopExpenses'

interface ReportsViewProps {
  transactions: Transaction[]
  categories?: Category[]
}

export function ReportsView({ transactions }: ReportsViewProps) {
  const toast = useToast()
  const [periodType, setPeriodType] = useState<ReportPeriodType>('month')
  const [referenceDate, setReferenceDate] = useState<Date>(() => new Date())

  // Intervalo padrão para o modo customizado (últimos 30 dias)
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return toLocalISODate(d)
  })
  const [customEnd, setCustomEnd] = useState<string>(() => toLocalISODate(new Date()))

  // Calcula todas as métricas agregadas do relatório
  const reportData = useMemo(() => {
    return generateReportData(transactions, periodType, referenceDate, customStart, customEnd)
  }, [transactions, periodType, referenceDate, customStart, customEnd])

  const handlePreviousPeriod = () => {
    setReferenceDate((prev) => {
      const next = new Date(prev)
      if (periodType === 'week') {
        next.setDate(next.getDate() - 7)
      } else if (periodType === 'month') {
        next.setMonth(next.getMonth() - 1)
      } else if (periodType === 'year') {
        next.setFullYear(next.getFullYear() - 1)
      }
      return next
    })
  }

  const handleNextPeriod = () => {
    setReferenceDate((prev) => {
      const next = new Date(prev)
      if (periodType === 'week') {
        next.setDate(next.getDate() + 7)
      } else if (periodType === 'month') {
        next.setMonth(next.getMonth() + 1)
      } else if (periodType === 'year') {
        next.setFullYear(next.getFullYear() + 1)
      }
      return next
    })
  }

  const handleCurrentPeriod = () => {
    setReferenceDate(new Date())
  }

  const handleCustomRangeChange = (start: string, end: string) => {
    setCustomStart(start)
    setCustomEnd(end)
  }

  // Exportação CSV do período
  const handleExportCsv = () => {
    if (reportData.transactions.length === 0) {
      toast.warning('Sem dados', 'Não há transações no período selecionado para exportar.')
      return
    }
    soundFX.playSuccess()
    const csv = generateCsvContent(reportData.transactions)
    const filename = `relatorio_myfinance_${reportData.periodType}_${reportData.range.startDate}_a_${reportData.range.endDate}.csv`
    downloadBlob(csv, filename, 'text/csv;charset=utf-8;')
    toast.success('Relatório CSV Baixado', `Extrato de ${reportData.range.label} exportado.`)
  }

  // Impressão / PDF do período
  const handleExportPdf = () => {
    if (reportData.transactions.length === 0) {
      toast.warning('Sem dados', 'Não há transações no período selecionado para exportar.')
      return
    }
    soundFX.playSuccess()
    const html = generatePrintableHtml(
      reportData.transactions,
      reportData.summary,
      reportData.range.label,
    )
    openPrintWindow(html)
    toast.info('Visualização de Relatório', 'Janela de impressão e exportação aberta.')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Seção de Relatórios */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Relatórios & Inteligência
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                Visão semanal, mensal, anual e personalizada das suas finanças
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação para o Relatório Ativo */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={reportData.transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold glass-pill border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={reportData.transactions.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold glass-pill border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-purple-400" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Seletor de Período & Navegação Temporal */}
      <ReportPeriodSelector
        periodType={periodType}
        onPeriodTypeChange={setPeriodType}
        currentRange={reportData.range}
        onPreviousPeriod={handlePreviousPeriod}
        onNextPeriod={handleNextPeriod}
        onCurrentPeriod={handleCurrentPeriod}
        customStart={customStart}
        customEnd={customEnd}
        onCustomRangeChange={handleCustomRangeChange}
      />

      {/* Cards de Métricas e Comparativo Percentual */}
      <ReportSummaryCards report={reportData} />

      {/* Grid com Gráfico de Evolução e Distribuição por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-6">
          <ReportEvolutionChart report={reportData} />
        </div>

        <div className="lg:col-span-5 space-y-6">
          <ExpenseCategoryChart transactions={reportData.transactions} />
        </div>
      </div>

      {/* Maiores Gastos do Período */}
      <ReportTopExpenses
        expenses={reportData.topExpenses}
        totalExpense={reportData.summary.totalExpense}
      />
    </div>
  )
}
