import { ArrowRight, Layers, Plus, Rocket, Upload, Wallet } from 'lucide-react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { CurrencyProvider } from './core/currency/currencyContext'
import { getCurrentYearMonth, getLocalDateString } from './core/formatters/date'
import { DEMO_BUDGET_AMOUNT, getDemoTransactions } from './core/onboarding/demoData'
import { soundFX } from './core/sound/soundEffects'
import { ThemeProvider, useTheme } from './core/theme/themeContext'
import { ToastProvider, useToast } from './core/toast/toastContext'
import type { Transaction } from './domain/models/transaction'
import { AuthPage } from './presentation/components/auth/AuthPage'
import { ToastContainer } from './presentation/components/common/ToastContainer'
import { BudgetProgressBar } from './presentation/components/dashboard/BudgetProgressBar'
import { CategoryAnalysisGrid } from './presentation/components/dashboard/CategoryAnalysisGrid'
import { DashboardSkeleton } from './presentation/components/dashboard/DashboardSkeleton'
import { ExpenseCategoryChart } from './presentation/components/dashboard/ExpenseCategoryChart'
import { FinancialFlowChart } from './presentation/components/dashboard/FinancialFlowChart'
import { FinancialInsights } from './presentation/components/dashboard/FinancialInsights'
import { MonthSelector } from './presentation/components/dashboard/MonthSelector'
import { SummaryCards } from './presentation/components/dashboard/SummaryCards'
import { TransactionItem } from './presentation/components/dashboard/TransactionItem'
import { TransactionList } from './presentation/components/dashboard/TransactionList'
import { Header } from './presentation/components/layout/Header'
import { Sidebar } from './presentation/components/layout/Sidebar'
import { useAuth } from './presentation/hooks/useAuth'
import { useFinance } from './presentation/hooks/useFinance'

// Lazy Loading dos modais e visões pesadas para code-splitting e performance otimizada
const ReportsView = lazy(() =>
  import('./presentation/components/reports/ReportsView').then((m) => ({
    default: m.ReportsView,
  })),
)
const TransactionModal = lazy(() =>
  import('./presentation/components/dashboard/TransactionModal').then((m) => ({
    default: m.TransactionModal,
  })),
)
const OnboardingModal = lazy(() =>
  import('./presentation/components/onboarding/OnboardingModal').then((m) => ({
    default: m.OnboardingModal,
  })),
)
const SettingsModal = lazy(() =>
  import('./presentation/components/settings/SettingsModal').then((m) => ({
    default: m.SettingsModal,
  })),
)
const ThemeSelectorModal = lazy(() =>
  import('./presentation/components/theme/ThemeSelectorModal').then((m) => ({
    default: m.ThemeSelectorModal,
  })),
)
const ImportStatementModal = lazy(() =>
  import('./presentation/components/dashboard/ImportStatementModal').then((m) => ({
    default: m.ImportStatementModal,
  })),
)
const DebtsView = lazy(() =>
  import('./presentation/components/debts/DebtsView').then((m) => ({
    default: m.DebtsView,
  })),
)
const InstallmentsForecastModal = lazy(() =>
  import('./presentation/components/dashboard/InstallmentsForecastModal').then((m) => ({
    default: m.InstallmentsForecastModal,
  })),
)

export function AppContent() {
  const toast = useToast()
  const { user, isLoading: isAuthLoading, login, register, logout } = useAuth()
  const { currentTheme } = useTheme()

  const handleLogout = async () => {
    await logout()
    toast.info('Sessão encerrada', 'Você saiu da sua conta myFinance.')
  }

  const [activeSection, setActiveSection] = useState('dashboard')
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'themes'>('general')
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isForecastModalOpen, setIsForecastModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 1024
    }
    return false
  })

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
    selectedStatus,
    setSelectedStatus,
    clearFilters,
    hasActiveFilters,
    totalFilteredCount,
    totalPeriodCount,
    isLoading,
    error,
    addTransaction,
    duplicateTransaction,
    editTransaction,
    toggleTransactionStatus,
    deleteTransaction,
    deleteMultipleTransactions,
    importTransactions,
  } = useFinance(undefined, undefined, user)

  const handleDuplicateTransaction = async (id: string) => {
    const success = await duplicateTransaction(id)
    if (success) {
      soundFX.playSuccess()
      toast.success('Transação Duplicada', 'Movimentação clonada com sucesso!')
    }
  }

  // Disparo automático de boas-vindas no primeiro acesso com 0 transações
  useEffect(() => {
    if (!user || isLoading) return
    try {
      const storageKey = `myfinance_onboarding_dismissed_${user.id}`
      const isDismissed = localStorage.getItem(storageKey)
      if (!isDismissed && transactions.length === 0) {
        setIsOnboardingOpen(true)
      }
    } catch {
      // Ignora erro de acesso a localStorage
    }
  }, [user, isLoading, transactions.length])

  const handleDismissOnboarding = () => {
    setIsOnboardingOpen(false)
    if (user) {
      try {
        localStorage.setItem(`myfinance_onboarding_dismissed_${user.id}`, 'true')
      } catch {
        // Ignora
      }
    }
  }

  const handleInjectDemoData = async () => {
    const demoList = getDemoTransactions()
    for (const item of demoList) {
      await addTransaction(item)
    }
    await updateBudget(DEMO_BUDGET_AMOUNT)
    handleDismissOnboarding()
  }

  const handleCompleteZeroSetup = async (initialBalance: number, budgetAmount: number) => {
    if (initialBalance > 0) {
      const today = getLocalDateString()
      await addTransaction({
        title: 'Saldo Inicial',
        amount: initialBalance,
        type: 'income',
        category: 'Trabalho',
        date: today,
      })
    }
    if (budgetAmount > 0) {
      await updateBudget(budgetAmount)
    }
    handleDismissOnboarding()
  }

  const handleToggleAllPeriods = () => {
    setSelectedMonth(selectedMonth === 'all' ? getCurrentYearMonth() : 'all')
  }

  const handleOpenNewTransaction = () => {
    setEditingTransaction(null)
    setIsTxModalOpen(true)
  }

  const handleOpenEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx)
    setIsTxModalOpen(true)
  }

  const handleCloseTxModal = () => {
    setIsTxModalOpen(false)
    setEditingTransaction(null)
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
        onLogout={handleLogout}
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenThemeModal={() => {
          setSettingsInitialTab('themes')
          setIsSettingsModalOpen(true)
        }}
        onOpenSettingsModal={() => {
          setSettingsInitialTab('general')
          setIsSettingsModalOpen(true)
        }}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Área Principal de Conteúdo - Se adapta ao tamanho da tela e à sidebar expandida */}
      <div
        className={`relative z-10 ${
          isSidebarCollapsed ? 'pl-14 sm:pl-16' : 'pl-48 sm:pl-52'
        } transition-all duration-300 min-w-0`}
      >
        <main className="max-w-[1550px] mx-auto p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 min-w-0">
          {/* CABEÇALHO DA TELA ATIVA */}
          <Header
            activeSection={activeSection}
            user={user}
            onLogout={logout}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenForecastModal={() => setIsForecastModalOpen(true)}
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

          {/* SELETOR E FILTRO POR PERÍODO / MÊS (Visível apenas nas seções com escopo mensal) */}
          {activeSection !== 'debts' && activeSection !== 'reports' && (
            <MonthSelector
              selectedMonth={selectedMonth}
              onPreviousMonth={goToPreviousMonth}
              onNextMonth={goToNextMonth}
              onCurrentMonth={goToCurrentMonth}
              onToggleAllPeriods={handleToggleAllPeriods}
            />
          )}

          {/* 1. TELA: DASHBOARD (Apenas Informações Principais: Resumo Financeiro, Gráfico de Categorias e Transações Recentes) */}
          {activeSection === 'dashboard' &&
            (isLoading ? (
              <DashboardSkeleton />
            ) : (
              <div className="space-y-6">
                {/* CARDS DE RESUMO DO PERÍODO SELECIONADO */}
                <div id="section-summary">
                  <SummaryCards
                    summary={summary}
                    onSelectType={(type) => {
                      setSelectedType(type)
                      handleSelectSection('transactions')
                    }}
                  />
                </div>

                {/* INSIGHTS FINANCEIROS INTELIGENTES */}
                <div id="section-insights">
                  <FinancialInsights
                    transactions={periodTransactions}
                    summary={summary}
                    selectedMonth={selectedMonth}
                  />
                </div>

                {/* GRÁFICO DE FLUXO FINANCEIRO SEMESTRAL (ENTRADAS VS SAÍDAS VS SALDO) */}
                <div id="section-flow-chart">
                  <FinancialFlowChart transactions={transactions} selectedMonth={selectedMonth} />
                </div>

                {/* GRID PRINCIPAL: GRÁFICO DE CATEGORIAS E TRANSAÇÕES RECENTES (Responsivo: 1 coluna em telas compactas/médias e 2 colunas em telas amplas) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                  {/* 1. GRÁFICO DE DISTRIBUIÇÃO DE DESPESAS POR CATEGORIA */}
                  <div className="min-w-0 w-full">
                    <ExpenseCategoryChart transactions={periodTransactions} />
                  </div>

                  {/* 2. CARD DE TRANSAÇÕES RECENTES */}
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
                            setIsImportModalOpen(true)
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
                            handleSelectSection('transactions')
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
                              handleOpenNewTransaction()
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
                              setIsImportModalOpen(true)
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
                              setIsOnboardingOpen(true)
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
                            onDelete={deleteTransaction}
                            onEdit={handleOpenEditTransaction}
                            onDuplicate={() => handleDuplicateTransaction(tx.id)}
                            onToggleStatus={toggleTransactionStatus}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {/* 2. TELA: RELATÓRIOS (Inteligência Semanal, Mensal, Anual e Customizada) */}
          {activeSection === 'reports' && (
            <div className="space-y-6 min-w-0" id="section-reports">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Carregando relatórios financeiros...</p>
                  </div>
                }
              >
                <ReportsView transactions={transactions} categories={categories} />
              </Suspense>
            </div>
          )}

          {/* 2. TELA: TRANSAÇÕES (Histórico Limpo em Largura Total com Busca, Filtros e Exportação) */}
          {activeSection === 'transactions' && (
            <div className="space-y-6 min-w-0" id="section-transactions">
              <TransactionList
                transactions={filteredTransactions}
                isLoading={isLoading}
                onDelete={deleteTransaction}
                onEdit={handleOpenEditTransaction}
                onDuplicate={handleDuplicateTransaction}
                onToggleStatus={toggleTransactionStatus}
                onDeleteMultiple={deleteMultipleTransactions}
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onOpenImport={() => setIsImportModalOpen(true)}
                onOpenForecastModal={() => setIsForecastModalOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
                categories={availableCategories}
                totalFilteredCount={totalFilteredCount}
                totalPeriodCount={totalPeriodCount}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearFilters}
                exportSummary={summary}
                selectedMonth={selectedMonth}
              />
            </div>
          )}

          {/* 3. TELA: DÍVIDAS & EMPRÉSTIMOS (Agiotas, Empréstimos Pessoais, Renovações e Juros) */}
          {activeSection === 'debts' && (
            <div className="space-y-6 min-w-0" id="section-debts">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Carregando painel de dívidas e empréstimos...</p>
                  </div>
                }
              >
                <DebtsView onAddTransaction={addTransaction} />
              </Suspense>
            </div>
          )}

          {/* 4. TELA: PLANEJAMENTO (Metas, Teto Mensal e Comparativos) */}
          {activeSection === 'budget' && (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              <div className="xl:col-span-7 space-y-6 min-w-0">
                <BudgetProgressBar progress={budgetProgress} onUpdateBudget={updateBudget} />
              </div>

              <div className="xl:col-span-5 space-y-6 min-w-0">
                <SummaryCards
                  summary={summary}
                  onSelectType={(type) => {
                    setSelectedType(type)
                    handleSelectSection('transactions')
                  }}
                />
              </div>
            </div>
          )}

          {/* 4. TELA: CATEGORIAS (Distribuição de Gastos e Origens) */}
          {activeSection === 'categories' && (
            <div className="space-y-6 min-w-0">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
                <div className="xl:col-span-8 space-y-6 min-w-0">
                  <ExpenseCategoryChart transactions={periodTransactions} />
                </div>

                <div className="xl:col-span-4 space-y-6 min-w-0">
                  <SummaryCards
                    summary={summary}
                    onSelectType={(type) => {
                      setSelectedType(type)
                      handleSelectSection('transactions')
                    }}
                  />
                </div>
              </div>

              {/* GRID ANALÍTICO COMPLETO POR CATEGORIAS */}
              <div className="glass-card p-5 sm:p-6 rounded-3xl shadow-xl">
                <CategoryAnalysisGrid
                  transactions={periodTransactions}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat)
                    handleSelectSection('transactions')
                  }}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modais Carregados Sob Demanda via Code Splitting */}
      <Suspense fallback={null}>
        {isThemeModalOpen && (
          <ThemeSelectorModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
          />
        )}

        {isSettingsModalOpen && (
          <SettingsModal
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            initialTab={settingsInitialTab}
          />
        )}

        {isOnboardingOpen && (
          <OnboardingModal
            isOpen={isOnboardingOpen}
            onClose={handleDismissOnboarding}
            onInjectDemoData={handleInjectDemoData}
            onCompleteZeroSetup={handleCompleteZeroSetup}
            userName={user?.name}
          />
        )}

        {isTxModalOpen && (
          <TransactionModal
            isOpen={isTxModalOpen}
            onClose={handleCloseTxModal}
            onAdd={addTransaction}
            onEdit={editTransaction}
            transactionToEdit={editingTransaction}
            categories={categories}
            onAddCategory={addCategory}
          />
        )}

        {isImportModalOpen && (
          <ImportStatementModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            existingTransactions={transactions}
            availableCategories={availableCategories}
            onImport={importTransactions}
          />
        )}

        {isForecastModalOpen && (
          <InstallmentsForecastModal
            isOpen={isForecastModalOpen}
            onClose={() => setIsForecastModalOpen(false)}
            transactions={transactions}
            onOpenNewInstallment={() => {
              setIsForecastModalOpen(false)
              handleOpenNewTransaction()
            }}
          />
        )}
      </Suspense>

      <ToastContainer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </CurrencyProvider>
    </ThemeProvider>
  )
}
