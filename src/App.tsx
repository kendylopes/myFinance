import { Wallet } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
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
import { BudgetSummaryCards } from './presentation/components/dashboard/BudgetSummaryCards'
import { DashboardView } from './presentation/components/dashboard/DashboardView'
import { MonthSelector } from './presentation/components/dashboard/MonthSelector'
import { TransactionList } from './presentation/components/dashboard/TransactionList'
import { BottomNavBar } from './presentation/components/layout/BottomNavBar'
import { Header } from './presentation/components/layout/Header'
import { Sidebar } from './presentation/components/layout/Sidebar'
import { useAuth } from './presentation/hooks/useAuth'
import { useFinance } from './presentation/hooks/useFinance'
import { useGlobalShortcuts } from './presentation/hooks/useGlobalShortcuts'
import { usePwaUpdate } from './presentation/hooks/usePwaUpdate'

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
const CommandPaletteModal = lazy(() =>
  import('./presentation/components/common/CommandPaletteModal').then((m) => ({
    default: m.CommandPaletteModal,
  })),
)
const CardsAndInvoicesView = lazy(() =>
  import('./presentation/components/cards/CardsAndInvoicesView').then((m) => ({
    default: m.CardsAndInvoicesView,
  })),
)
const InstallmentsForecastModal = lazy(() =>
  import('./presentation/components/dashboard/InstallmentsForecastModal').then((m) => ({
    default: m.InstallmentsForecastModal,
  })),
)
const CategoriesView = lazy(() =>
  import('./presentation/components/categories/CategoriesView').then((m) => ({
    default: m.CategoriesView,
  })),
)
const WhatsAppView = lazy(() =>
  import('./presentation/components/whatsapp/WhatsAppView').then((m) => ({
    default: m.WhatsAppView,
  })),
)

// Mapa de rotas via Hash para sincronização com histórico do navegador
const SECTION_HASH_MAP: Record<string, string> = {
  dashboard: '#/dashboard',
  transactions: '#/transacoes',
  cards: '#/cartoes',
  debts: '#/dividas',
  budget: '#/planejamento',
  categories: '#/categorias',
  reports: '#/relatorios',
  whatsapp: '#/whatsapp',
}

const HASH_TO_SECTION_MAP: Record<string, string> = {
  '#/dashboard': 'dashboard',
  '#/': 'dashboard',
  '#': 'dashboard',
  '': 'dashboard',
  '#/transacoes': 'transactions',
  '#/transactions': 'transactions',
  '#/cartoes': 'cards',
  '#/cards': 'cards',
  '#/dividas': 'debts',
  '#/debts': 'debts',
  '#/planejamento': 'budget',
  '#/budget': 'budget',
  '#/categorias': 'categories',
  '#/categories': 'categories',
  '#/relatorios': 'reports',
  '#/reports': 'reports',
  '#/whatsapp': 'whatsapp',
}

function getInitialSection(): string {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.toLowerCase()
    if (HASH_TO_SECTION_MAP[hash]) {
      return HASH_TO_SECTION_MAP[hash]
    }
  }
  return 'dashboard'
}

export function AppContent() {
  const toast = useToast()
  const { user, isLoading: isAuthLoading, login, register, logout } = useAuth()
  const { currentTheme } = useTheme()

  const handleLogout = async () => {
    handleSelectSection('dashboard')
    setEditingTransaction(null)
    setIsTxModalOpen(false)
    setIsSettingsModalOpen(false)
    setIsImportModalOpen(false)
    setIsForecastModalOpen(false)
    await logout()
    toast.info('Sessão encerrada', 'Você saiu da sua conta myFinance.')
  }

  const [activeSection, setActiveSection] = useState<string>(getInitialSection)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [settingsInitialTab, setSettingsInitialTab] = useState<'general' | 'themes'>('general')
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [isTxModalOpen, setIsTxModalOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
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
    deleteCategory,
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
    updateMultipleTransactionsStatus,
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

  // Monitoramento de nova versão PWA e disparo de toast amigável
  usePwaUpdate()

  const handleCloseAllModals = () => {
    if (
      isTxModalOpen ||
      isCommandPaletteOpen ||
      isImportModalOpen ||
      isForecastModalOpen ||
      isThemeModalOpen ||
      isSettingsModalOpen ||
      isOnboardingOpen
    ) {
      soundFX.playClick()
      setIsTxModalOpen(false)
      setIsCommandPaletteOpen(false)
      setEditingTransaction(null)
      setIsImportModalOpen(false)
      setIsForecastModalOpen(false)
      setIsThemeModalOpen(false)
      setIsSettingsModalOpen(false)
      setIsOnboardingOpen(false)
    }
  }

  const handleShowShortcutsHelp = () => {
    toast.info(
      'Atalhos de Teclado Rápidos',
      'N ou Ctrl+K: Nova transação • 1-7: Alternar telas • I: Importar • T: Temas • S: Configurações • ESC: Fechar',
      { duration: 6000 },
    )
  }

  const handleSelectSection = useCallback((section: string, updateHash = true) => {
    const update = () => {
      setActiveSection(section)

      if (updateHash && typeof window !== 'undefined') {
        const targetHash = SECTION_HASH_MAP[section] || '#/dashboard'
        if (window.location.hash.toLowerCase() !== targetHash) {
          window.history.pushState(null, '', targetHash)
        }
      }

      if (section === 'dashboard') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else if (section === 'transactions') {
        const el = document.getElementById('section-transactions')
        el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      } else if (section === 'cards') {
        const el = document.getElementById('section-cards')
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

    // Suporte nativo à View Transitions API com fallback gracioso
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      // biome-ignore lint/suspicious/noExplicitAny: View Transitions API standard
      ;(document as any).startViewTransition(update)
    } else {
      update()
    }
  }, [])

  // Sincronização reativa de histórico e botão voltar/avançar do navegador
  useEffect(() => {
    const handleLocationChange = () => {
      if (typeof window === 'undefined') return
      const hash = window.location.hash.toLowerCase()
      const matched = HASH_TO_SECTION_MAP[hash]
      if (matched && matched !== activeSection) {
        handleSelectSection(matched, false)
      }
    }

    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [activeSection, handleSelectSection])

  // Atalhos Globais de Teclado para produtividade
  useGlobalShortcuts({
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenNewTransaction: handleOpenNewTransaction,
    onOpenImport: () => setIsImportModalOpen(true),
    onOpenSettings: () => setIsSettingsModalOpen(true),
    onOpenThemes: () => setIsThemeModalOpen(true),
    onSelectSection: handleSelectSection,
    onCloseModals: handleCloseAllModals,
    onShowShortcutsHelp: handleShowShortcutsHelp,
  })

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
      key={user.id}
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

      {/* Área Principal de Conteúdo - Tela cheia no mobile com respiro inferior para a barra e recuo lateral no desktop */}
      <div
        className={`relative z-10 pb-24 md:pb-8 ${
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-52'
        } transition-all duration-300 min-w-0`}
      >
        <main className="max-w-387.5 mx-auto p-3 sm:p-5 md:p-6 lg:p-8 space-y-6 min-w-0">
          {/* CABEÇALHO DA TELA ATIVA */}
          <Header
            activeSection={activeSection}
            user={user}
            onLogout={logout}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
          {activeSection !== 'debts' &&
            activeSection !== 'reports' &&
            activeSection !== 'cards' &&
            activeSection !== 'whatsapp' && (
              <MonthSelector
                selectedMonth={selectedMonth}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                onCurrentMonth={goToCurrentMonth}
                onToggleAllPeriods={handleToggleAllPeriods}
              />
            )}

          {/* 1. TELA: DASHBOARD (Resumo Financeiro, Gráficos e Transações Recentes Modularizados) */}
          {activeSection === 'dashboard' && (
            <DashboardView
              isLoading={isLoading}
              summary={summary}
              periodTransactions={periodTransactions}
              transactions={transactions}
              selectedMonth={selectedMonth}
              budgetProgress={budgetProgress}
              onSelectType={setSelectedType}
              onSelectSection={handleSelectSection}
              onOpenNewTransaction={handleOpenNewTransaction}
              onOpenImportModal={() => setIsImportModalOpen(true)}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
              onDeleteTransaction={deleteTransaction}
              onEditTransaction={handleOpenEditTransaction}
              onDuplicateTransaction={handleDuplicateTransaction}
              onToggleTransactionStatus={toggleTransactionStatus}
            />
          )}

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
                onUpdateMultipleStatus={updateMultipleTransactionsStatus}
                onOpenNewTransaction={handleOpenNewTransaction}
                onOpenOnboarding={() => setIsOnboardingOpen(true)}
                onOpenImport={() => setIsImportModalOpen(true)}
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

          {/* TELA: CARTÕES & FATURAS (Previsão de Parcelamentos e Faturas) */}
          {activeSection === 'cards' && (
            <div className="space-y-6 min-w-0" id="section-cards">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Carregando faturas e compras parceladas...</p>
                  </div>
                }
              >
                <CardsAndInvoicesView
                  transactions={transactions}
                  onOpenNewInstallment={handleOpenNewTransaction}
                  onToggleStatus={toggleTransactionStatus}
                />
              </Suspense>
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
            <div className="space-y-6 min-w-0" id="section-budget">
              {/* 1. CARDS ANALÍTICOS DE KPI DE PLANEJAMENTO */}
              <BudgetSummaryCards progress={budgetProgress} selectedMonth={selectedMonth} />

              {/* 2. PROGRESSO E SIMULADOR DO TETO MENSAL EM LARGURA TOTAL */}
              <div className="space-y-6">
                <BudgetProgressBar progress={budgetProgress} onUpdateBudget={updateBudget} />
              </div>
            </div>
          )}

          {/* 5. TELA: CATEGORIAS (Distribuição de Gastos, Origens e Gerenciador Completo) */}
          {activeSection === 'categories' && (
            <div className="space-y-6 min-w-0" id="section-categories">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Carregando categorias e distribuição...</p>
                  </div>
                }
              >
                <CategoriesView
                  transactions={transactions}
                  periodTransactions={periodTransactions}
                  categories={categories}
                  onAddCategory={addCategory}
                  onDeleteCategory={deleteCategory}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat)
                    handleSelectSection('transactions')
                  }}
                />
              </Suspense>
            </div>
          )}

          {/* 6. TELA: WHATSAPP INTELIGENTE (IA) */}
          {activeSection === 'whatsapp' && (
            <div className="space-y-6 min-w-0" id="section-whatsapp">
              <Suspense
                fallback={
                  <div className="py-20 text-center text-zinc-400">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs">Carregando WhatsApp Inteligente (IA)...</p>
                  </div>
                }
              >
                <WhatsAppView userId={user?.id} onAddTransaction={addTransaction} />
              </Suspense>
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

        {isCommandPaletteOpen && (
          <CommandPaletteModal
            isOpen={isCommandPaletteOpen}
            onClose={() => setIsCommandPaletteOpen(false)}
            onSelectSection={handleSelectSection}
            onOpenNewTransaction={handleOpenNewTransaction}
            onOpenImport={() => setIsImportModalOpen(true)}
            onOpenSettings={() => {
              setSettingsInitialTab('general')
              setIsSettingsModalOpen(true)
            }}
            onOpenThemes={() => {
              setSettingsInitialTab('themes')
              setIsSettingsModalOpen(true)
            }}
            transactions={transactions}
            onSelectTransaction={(tx) => {
              handleOpenEditTransaction(tx)
            }}
          />
        )}
      </Suspense>

      {/* BARRA DE NAVEGAÇÃO INFERIOR PARA DISPOSITIVOS MÓVEIS (THUMB ZONE) */}
      <BottomNavBar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenNewTransaction={handleOpenNewTransaction}
        onOpenSettings={() => {
          setSettingsInitialTab('general')
          setIsSettingsModalOpen(true)
        }}
      />

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
