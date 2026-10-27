import { ArrowRight, Layers, Plus, Receipt, Rocket, Upload } from 'lucide-react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import type {
  BudgetProgress,
  FinanceSummary,
  Transaction,
} from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'
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
  const recentSpotlightRef = useSpotlight<HTMLDivElement>()

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
        <div
          ref={recentSpotlightRef}
          data-testid="recent-transactions-card"
          className="glass-card spotlight-card p-6 sm:p-7 rounded-3xl space-y-5 min-w-0 w-full border border-white/10 shadow-xl bg-linear-to-b from-white/4 to-transparent relative overflow-hidden"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-xs">
                <Layers className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight drop-shadow-xs whitespace-nowrap">
                  Transações Recentes
                </h2>
                <span className="glass-pill px-2.5 py-0.5 rounded-full text-xs font-mono font-medium text-zinc-300 border border-white/8 whitespace-nowrap">
                  ({periodTransactions.length} no período)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  onOpenImportModal()
                }}
                className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/10 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
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
                className="glass-pill px-3 py-1.5 rounded-xl border border-white/10 text-xs font-medium text-zinc-300 hover:text-white hover:border-white/20 hover:bg-white/6 transition-all duration-200 cursor-pointer active:scale-95 inline-flex items-center gap-1.5"
              >
                <span>Ver todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {periodTransactions.length === 0 ? (
            <div className="text-center py-10 px-4 text-zinc-400">
              <div className="w-12 h-12 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <Receipt className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Nenhuma movimentação neste período.
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                Cadastre suas receitas ou despesas para visualizar o histórico imediato.
              </p>
              <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    onOpenNewTransaction()
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-semibold backdrop-blur-md cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-medium glass-pill text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-white/20 active:scale-95"
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
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-white/10 text-xs font-medium glass-pill text-zinc-300 hover:text-white cursor-pointer transition-all hover:border-white/20 active:scale-95"
                >
                  <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Guia de Início</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
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
