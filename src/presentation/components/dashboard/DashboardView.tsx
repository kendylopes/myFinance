import { ArrowRight, Layers, Plus, Rocket, Upload } from 'lucide-react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import type {
  BudgetProgress,
  FinanceSummary,
  Transaction,
} from '../../../domain/models/transaction'
import { DashboardSkeleton } from './DashboardSkeleton'
import { ExpenseCategoryChart } from './ExpenseCategoryChart'
import { FinancialFlowChart } from './FinancialFlowChart'
import { FinancialInsights } from './FinancialInsights'
import { SummaryCards } from './SummaryCards'
import { TransactionItem } from './TransactionItem'

export interface DashboardViewProps {
  isLoading: boolean
  summary: FinanceSummary
  periodTransactions: Transaction[]
  transactions: Transaction[]
  selectedMonth: string
  budgetProgress: BudgetProgress
  onSelectType: (type: 'income' | 'expense') => void
  onSelectSection: (section: string) => void
  onOpenNewTransaction: () => void
  onOpenImportModal: () => void
  onOpenOnboarding: () => void
  onDeleteTransaction: (id: string) => Promise<boolean>
  onEditTransaction: (tx: Transaction) => void
  onDuplicateTransaction: (id: string) => void
  onToggleTransactionStatus: (id: string) => Promise<boolean>
}

export function DashboardView({
  isLoading,
  summary,
  periodTransactions,
  transactions,
  selectedMonth,
  budgetProgress,
  onSelectType,
  onSelectSection,
  onOpenNewTransaction,
  onOpenImportModal,
  onOpenOnboarding,
  onDeleteTransaction,
  onEditTransaction,
  onDuplicateTransaction,
  onToggleTransactionStatus,
}: DashboardViewProps) {
  const { currentTheme } = useTheme()

  if (isLoading) {
    return <DashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE RESUMO DO PERÍODO SELECIONADO */}
      <div id="section-summary">
        <SummaryCards
          summary={summary}
          onSelectType={(type) => {
            onSelectType(type)
            onSelectSection('transactions')
          }}
        />
      </div>

      {/* 2. INSIGHTS FINANCEIROS INTELIGENTES */}
      <div id="section-insights">
        <FinancialInsights
          transactions={periodTransactions}
          summary={summary}
          selectedMonth={selectedMonth}
          budgetProgress={budgetProgress}
        />
      </div>

      {/* 3. GRÁFICO DE FLUXO FINANCEIRO SEMESTRAL */}
      <div id="section-flow-chart">
        <FinancialFlowChart transactions={transactions} selectedMonth={selectedMonth} />
      </div>

      {/* 4. GRID: GRÁFICO DE CATEGORIAS E TRANSAÇÕES RECENTES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Gráfico de Distribuição por Categoria */}
        <div className="min-w-0 w-full">
          <ExpenseCategoryChart transactions={periodTransactions} />
        </div>

        {/* Card de Transações Recentes */}
        <div className="glass-card p-5 sm:p-6 rounded-3xl space-y-4 min-w-0 w-full">
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-white/8 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <Layers className="w-5 h-5 text-emerald-400 shrink-0" aria-hidden="true" />
              <h2 className="text-base sm:text-lg font-semibold text-white drop-shadow-sm whitespace-nowrap">
                Transações Recentes
              </h2>
              <span className="text-xs text-zinc-400 whitespace-nowrap">
                ({periodTransactions.length} no período)
              </span>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  onOpenImportModal()
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                title="Importar extrato bancário OFX ou CSV"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Importar Extrato</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  onSelectSection('transactions')
                }}
                className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {periodTransactions.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <p className="text-sm">Nenhuma movimentação neste período.</p>
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    onOpenNewTransaction()
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md cursor-pointer transition-all hover:scale-105"
                  style={{
                    backgroundColor: `${currentTheme.primaryColor}20`,
                    borderColor: `${currentTheme.primaryColor}40`,
                    color: currentTheme.primaryColor,
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Transação</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    onOpenImportModal()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium glass-pill text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-white/20"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Importar Extrato</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    onOpenOnboarding()
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium glass-pill text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-white/20"
                >
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guia de Início</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              {periodTransactions.slice(0, 5).map((tx) => (
                <TransactionItem
                  key={tx.id}
                  transaction={tx}
                  onDelete={onDeleteTransaction}
                  onEdit={onEditTransaction}
                  onDuplicate={() => onDuplicateTransaction(tx.id)}
                  onToggleStatus={onToggleTransactionStatus}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
