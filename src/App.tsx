import { Wallet } from 'lucide-react'
import { useState } from 'react'
import { getCurrentYearMonth } from './core/formatters/date'
import { ThemeProvider, useTheme } from './core/theme/themeContext'
import { AuthPage } from './presentation/components/auth/AuthPage'
import { BudgetProgressBar } from './presentation/components/dashboard/BudgetProgressBar'
import { ExpenseCategoryChart } from './presentation/components/dashboard/ExpenseCategoryChart'
import { MonthSelector } from './presentation/components/dashboard/MonthSelector'
import { SummaryCards } from './presentation/components/dashboard/SummaryCards'
import { TransactionForm } from './presentation/components/dashboard/TransactionForm'
import { TransactionList } from './presentation/components/dashboard/TransactionList'
import { Header } from './presentation/components/layout/Header'
import { Sidebar } from './presentation/components/layout/Sidebar'
import { ThemeSelectorModal } from './presentation/components/theme/ThemeSelectorModal'
import { useAuth } from './presentation/hooks/useAuth'
import { useFinance } from './presentation/hooks/useFinance'

export function AppContent() {
  const { user, isLoading: isAuthLoading, login, register, logout } = useAuth()
  const { currentTheme } = useTheme()

  const [activeSection, setActiveSection] = useState('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)

  const {
    transactions,
    periodTransactions,
    filteredTransactions,
    availableCategories,
    categories,
    addCategory,
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
    dataSource,
    addTransaction,
    deleteTransaction,
  } = useFinance(undefined, undefined, user)

  const handleToggleAllPeriods = () => {
    setSelectedMonth(selectedMonth === 'all' ? getCurrentYearMonth() : 'all')
  }

  const handleSelectSection = (section: string) => {
    setActiveSection(section)
    if (section === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (section === 'transactions') {
      const el = document.getElementById('section-transactions')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else if (section === 'budget') {
      const el = document.getElementById('section-budget')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } else if (section === 'categories') {
      const el = document.getElementById('section-transactions')
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      const catBtn = document.getElementById('category-select-btn')
      catBtn?.focus()
    }
  }

  // 1. Tela de Carregamento Inicial da Sessão na Nuvem
  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: 'var(--bg-app)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="p-3.5 border rounded-3xl backdrop-blur-md shadow-xl animate-pulse"
            style={{
              backgroundColor: `${currentTheme.primaryColor}15`,
              borderColor: `${currentTheme.primaryColor}35`,
              color: currentTheme.primaryColor,
            }}
          >
            <Wallet className="w-10 h-10" />
          </div>
          <div className="flex items-center gap-2.5 text-xs text-zinc-400">
            <span
              className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: currentTheme.primaryColor }}
            />
            <span>Sincronizando com a nuvem...</span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Auth Gate: Usuário não autenticado vê a tela de Login e Cadastro
  if (!user) {
    return <AuthPage onLogin={login} onRegister={register} />
  }

  // 3. Usuário Autenticado: Dashboard Completo com Menu Lateral e Temas Dev
  return (
    <div
      className="relative min-h-screen text-zinc-100 antialiased overflow-x-hidden transition-colors duration-300"
      style={{
        backgroundColor: 'var(--bg-app)',
      }}
    >
      {/* Background Ambient Glow Orbs Temáticos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -top-40 -left-40 w-125 h-125 rounded-full blur-[140px] animate-liquid-slow"
          style={{ backgroundColor: `${currentTheme.primaryColor}18` }}
        />
        <div
          className="absolute top-1/4 -right-40 w-137.5 h-137.5 rounded-full blur-[150px] animate-liquid-reverse"
          style={{ backgroundColor: `${currentTheme.accentColor}12` }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-100 h-100 rounded-full blur-[160px] animate-iridescent"
          style={{ backgroundColor: `${currentTheme.primaryColor}10` }}
        />
        <div className="absolute -bottom-28 left-1/3 w-150 h-112.5 bg-white/3 rounded-full blur-[160px] animate-liquid-slow" />
      </div>

      {/* Menu Lateral (Sidebar) */}
      <Sidebar
        user={user}
        onLogout={logout}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Área Principal de Conteúdo */}
      <div className="relative z-10 lg:pl-64 transition-all duration-300">
        <main className="max-w-5xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
          {/* CABEÇALHO DO USUÁRIO NA NUVEM */}
          <Header
            transactionCount={transactions.length}
            dataSource={dataSource}
            user={user}
            onLogout={logout}
            onOpenMobileMenu={() => setIsMobileSidebarOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
          />

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
          <div id="section-summary">
            <SummaryCards summary={summary} />
          </div>

          {/* BARRA DE META E ORÇAMENTO MENSAL */}
          <div id="section-budget">
            <BudgetProgressBar progress={budgetProgress} onUpdateBudget={updateBudget} />
          </div>

          {/* GRÁFICO DE DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA */}
          <ExpenseCategoryChart transactions={periodTransactions} />

          {/* ÁREA PRINCIPAL: FORMULÁRIO (ESQUERDA) + LISTA DO PERÍODO (DIREITA) */}
          <div
            id="section-transactions"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start scroll-mt-6"
          >
            <TransactionForm
              onAdd={addTransaction}
              categories={categories}
              onAddCategory={addCategory}
            />
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
        </main>
      </div>

      {/* Modal Seletor dos 5 Temas Dev */}
      <ThemeSelectorModal isOpen={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
