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
    periodTransactions,
    filteredTransactions,
    availableCategories,
    summary,
    selectedMonth,
    setSelectedMonth,
    goToPreviousMonth,
    goToNextMonth,
    goToCurrentMonth,
    budgetProgress,
    updateBudget,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedType,
    setSelectedType,
    clearFilters,
    hasActiveFilters,
    totalFilteredCount,
    totalPeriodCount,
    isLoading,
    error,
    addTransaction,
    deleteTransaction,
  } = useFinance()

  const handleToggleAllPeriods = () => {
    setSelectedMonth(selectedMonth === 'all' ? getCurrentYearMonth() : 'all')
  }

  return (
    <div className="relative min-h-screen bg-[#111215] text-zinc-100 antialiased p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.03),rgba(17,18,21,0))]">
      {/* Background Ambient Glow Orbs para Refração de Cristal Líquido Charcoal */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-emerald-500/10 rounded-full blur-[140px] animate-liquid-slow" />
        <div className="absolute top-1/4 -right-40 w-137.5 h-137.5 bg-zinc-400/8 rounded-full blur-[150px] animate-liquid-reverse" />
        <div className="absolute top-1/2 left-1/4 w-100 h-100 bg-emerald-500/5 rounded-full blur-[160px] animate-iridescent" />
        <div className="absolute -bottom-28 left-1/3 w-150 h-112.5 bg-zinc-500/10 rounded-full blur-[160px] animate-liquid-slow" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8">
        {/* CABEÇALHO DESACOPLADO */}
        <Header transactionCount={transactions.length} />

        {/* FEEDBACK DE ERRO GLOBAL (SE HOUVER) */}
        {error && (
          <div
            role="alert"
            className="p-4 bg-rose-950/40 border border-rose-500/30 backdrop-blur-xl rounded-2xl text-rose-200 text-sm flex items-center justify-between shadow-lg shadow-rose-950/20"
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
        <ExpenseCategoryChart transactions={periodTransactions} />

        {/* ÁREA PRINCIPAL: FORMULÁRIO (ESQUERDA) + LISTA DO PERÍODO (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <TransactionForm onAdd={addTransaction} />
          <TransactionList
            transactions={filteredTransactions}
            isLoading={isLoading}
            onDelete={deleteTransaction}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            categories={availableCategories}
            totalFilteredCount={totalFilteredCount}
            totalPeriodCount={totalPeriodCount}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            exportSummary={summary}
            selectedMonth={selectedMonth}
          />
        </div>
      </div>
    </div>
  )
}

export default App
