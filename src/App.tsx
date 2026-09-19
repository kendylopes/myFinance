import { getCurrentYearMonth } from './core/formatters/date'
import { BudgetProgressBar } from './presentation/components/dashboard/BudgetProgressBar'
import { ExpenseCategoryChart } from './presentation/components/dashboard/ExpenseCategoryChart'
import { MonthSelector } from './presentation/components/dashboard/MonthSelector'
import { SummaryCards } from './presentation/components/dashboard/SummaryCards'
import { TransactionForm } from './presentation/components/dashboard/TransactionForm'
import { TransactionList } from './presentation/components/dashboard/TransactionList'
import { Header } from './presentation/components/layout/Header'
import { useFinance } from './presentation/hooks/useFinance'

function App() {
  const {
    transactions,
    filteredTransactions,
    summary,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    budgetProgress,
    updateBudget,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
  } = useFinance()

  const handleToggleAllPeriods = () => {
    setSelectedMonth(selectedMonth === 'all' ? getCurrentYearMonth() : 'all')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-200">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* CABEÇALHO DESACOPLADO */}
        <Header transactionCount={transactions.length} />

        {/* FEEDBACK DE ERRO GLOBAL (SE HOUVER) */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-950/60 border border-rose-800/80 rounded-2xl text-rose-200 text-sm flex items-center justify-between"
          >
            <span>{error}</span>
          </div>
        )}

        {/* SELETOR E FILTRO POR PERÍODO / MÊS */}
        <MonthSelector
          selectedMonth={selectedMonth}
          onPreviousMonth={goToPreviousMonth}
          onNextMonth={goToNextMonth}
          onCurrentMonth={goToCurrentMonth}
          onToggleAllPeriods={handleToggleAllPeriods}
        />

        {/* CARDS DE RESUMO DO PERÍODO SELECIONADO */}
        <SummaryCards summary={summary} />

        {/* BARRA DE META E ORÇAMENTO MENSAL */}
        <BudgetProgressBar progress={budgetProgress} onUpdateBudget={updateBudget} />

        {/* GRÁFICO DE DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA */}
        <ExpenseCategoryChart transactions={filteredTransactions} />

        {/* ÁREA PRINCIPAL: FORMULÁRIO (ESQUERDA) + LISTA DO PERÍODO (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <TransactionForm onAdd={addTransaction} />
          <TransactionList
            transactions={filteredTransactions}
            isLoading={isLoading}
            onDelete={deleteTransaction}
          />
        </div>
      </div>
    </div>
  )
}

export default App
