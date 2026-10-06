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
      {/* Seletor de Período, Navegação Temporal & Ações de Exportação */}
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
        onExportCsv={handleExportCsv}
        onExportPdf={handleExportPdf}
        canExport={reportData.transactions.length > 0}
      />

      {/* Cards de Métricas e Comparativo Percentual */}
      <ReportSummaryCards report={reportData} />

      {/* Grid com Gráfico de Evolução e Distribuição por Categoria */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-7 space-y-6 min-w-0">
          <ReportEvolutionChart report={reportData} />
        </div>

        <div className="xl:col-span-5 space-y-6 min-w-0">
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
