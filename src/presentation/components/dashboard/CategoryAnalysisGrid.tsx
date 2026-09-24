import { ChevronRight, FolderTree, PieChart, Receipt, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Transaction, TransactionType } from '../../../domain/models/transaction'

export interface CategoryAnalysisGridProps {
  transactions: Transaction[]
  onSelectCategory?: (category: string) => void
}

interface CategoryMetric {
  category: string
  totalAmount: number
  count: number
  percent: number
  averageTicket: number
  type: TransactionType
}

export function CategoryAnalysisGrid({
  transactions,
  onSelectCategory,
}: CategoryAnalysisGridProps) {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense')

  const { metrics, totalForType } = useMemo(() => {
    const filtered = transactions.filter((tx) => tx.type === activeTab)
    const total = filtered.reduce((acc, curr) => acc + curr.amount, 0)

    const map: Record<string, { totalAmount: number; count: number }> = {}

    for (const tx of filtered) {
      if (!map[tx.category]) {
        map[tx.category] = { totalAmount: 0, count: 0 }
      }
      map[tx.category].totalAmount += tx.amount
      map[tx.category].count += 1
    }

    const list: CategoryMetric[] = Object.entries(map).map(([category, data]) => ({
      category,
      totalAmount: data.totalAmount,
      count: data.count,
      percent: total > 0 ? (data.totalAmount / total) * 100 : 0,
      averageTicket: data.count > 0 ? data.totalAmount / data.count : 0,
      type: activeTab,
    }))

    list.sort((a, b) => b.totalAmount - a.totalAmount)

    return { metrics: list, totalForType: total }
  }, [transactions, activeTab])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  const handleTabChange = (type: TransactionType) => {
    soundFX.playClick()
    setActiveTab(type)
  }

  const handleCategoryClick = (category: string) => {
    soundFX.playClick()
    onSelectCategory?.(category)
  }

  return (
    <div className="space-y-4">
      {/* CABEÇALHO DO GRID + SELETOR DE ABA (DESPESAS / RECEITAS) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/8 pb-3">
        <div className="flex items-center gap-2">
          <FolderTree className="w-5 h-5 text-emerald-400" aria-hidden="true" />
          <h2 className="text-base sm:text-lg font-semibold text-white drop-shadow-sm">
            Detalhamento por Categorias
          </h2>
          <span className="text-xs text-zinc-400">
            ({metrics.length} {metrics.length === 1 ? 'categoria' : 'categorias'})
          </span>
        </div>

        {/* ABAS SEGMENTADAS */}
        <div className="flex glass-pill p-1 rounded-2xl self-start sm:self-auto shadow-sm border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => handleTabChange('expense')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'expense'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-rose-400'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Despesas</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('income')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'income'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-emerald-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Receitas</span>
          </button>
        </div>
      </div>

      {/* TOTAL ACUMULADO DA ABA */}
      <div className="glass-card p-4 rounded-2xl border border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-2xl border ${
              activeTab === 'expense'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            }`}
          >
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium">
              Total em {activeTab === 'expense' ? 'Despesas' : 'Receitas'} no Período
            </p>
            <p className="text-lg font-bold text-white drop-shadow-sm">
              {formatCurrency(totalForType)}
            </p>
          </div>
        </div>

        <span className="text-xs text-zinc-400 hidden sm:block">
          Distribuição proporcional sobre 100%
        </span>
      </div>

      {/* GRID DE CARDS POR CATEGORIA */}
      {metrics.length === 0 ? (
        <div className="text-center py-12 text-zinc-400 border border-dashed border-white/10 rounded-2xl p-6 glass-pill">
          <p className="font-medium text-zinc-300">
            Nenhuma categoria de {activeTab === 'expense' ? 'despesa' : 'receita'} registrada neste
            período.
          </p>
          <p className="text-xs mt-1 text-zinc-500">
            Alterne entre Despesas e Receitas ou selecione outro mês para conferir os dados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {metrics.map((item) => (
            <div
              key={item.category}
              className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/20 transition-all flex flex-col justify-between gap-3 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-400 shadow-xs shadow-emerald-400/50" />
                    <h3 className="text-sm font-semibold text-white truncate drop-shadow-xs">
                      {item.category}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-zinc-300 shrink-0">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>

                <div className="mt-2.5 flex items-baseline justify-between">
                  <span
                    className={`text-base font-bold ${
                      item.type === 'expense' ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {formatCurrency(item.totalAmount)}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {item.count} {item.count === 1 ? 'transação' : 'transações'}
                  </span>
                </div>

                {/* BARRA DE PROGRESSO PROPORCIONAL */}
                <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mt-2.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.type === 'expense'
                        ? 'bg-linear-to-r from-rose-500 to-amber-500'
                        : 'bg-linear-to-r from-emerald-500 to-teal-400'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(4, item.percent))}%` }}
                  />
                </div>

                <p className="text-[11px] text-zinc-400 mt-2">
                  Média por lançamento:{' '}
                  <strong className="text-zinc-300 font-medium">
                    {formatCurrency(item.averageTicket)}
                  </strong>
                </p>
              </div>

              {/* BOTÃO INTERATIVO: VER TRANSAÇÕES */}
              {onSelectCategory && (
                <button
                  type="button"
                  onClick={() => handleCategoryClick(item.category)}
                  className="w-full pt-2 border-t border-white/5 flex items-center justify-between text-xs font-medium text-zinc-400 group-hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Ver transações</span>
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
