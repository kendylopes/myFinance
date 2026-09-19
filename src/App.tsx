import { SummaryCards } from './presentation/components/dashboard/SummaryCards'
import { TransactionForm } from './presentation/components/dashboard/TransactionForm'
import { TransactionList } from './presentation/components/dashboard/TransactionList'
import { Header } from './presentation/components/layout/Header'
import { useFinance } from './presentation/hooks/useFinance'

function App() {
  const { transactions, summary, isLoading, error, addTransaction, deleteTransaction } =
    useFinance()

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

        {/* CARDS DE RESUMO (DASHBOARD) */}
        <SummaryCards summary={summary} />

        {/* ÁREA PRINCIPAL: FORMULÁRIO (ESQUERDA) + LISTA (DIREITA) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <TransactionForm onAdd={addTransaction} />
          <TransactionList
            transactions={transactions}
            isLoading={isLoading}
            onDelete={deleteTransaction}
          />
        </div>
      </div>
    </div>
  )
}

export default App
