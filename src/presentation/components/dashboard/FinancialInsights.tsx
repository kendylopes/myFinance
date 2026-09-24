import { Activity, ArrowDownRight, CalendarClock, Flame, PiggyBank, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import type { FinanceSummary, Transaction } from '../../../domain/models/transaction'

export interface FinancialInsightsProps {
  transactions: Transaction[]
  summary: FinanceSummary
  selectedMonth?: string
}

export function FinancialInsights({ transactions, summary }: FinancialInsightsProps) {
  const insights = useMemo(() => {
    if (transactions.length === 0) return null

    // 1. Agrupar despesas por categoria para encontrar a maior
    const expensesByCategory: Record<string, number> = {}
    let expenseCount = 0
    let incomeCount = 0

    for (const tx of transactions) {
      if (tx.type === 'expense') {
        expenseCount += 1
        expensesByCategory[tx.category] = (expensesByCategory[tx.category] || 0) + tx.amount
      } else {
        incomeCount += 1
      }
    }

    let topCategory = ''
    let topCategoryAmount = 0

    for (const [cat, amt] of Object.entries(expensesByCategory)) {
      if (amt > topCategoryAmount) {
        topCategoryAmount = amt
        topCategory = cat
      }
    }

    const topCategoryPercent =
      summary.totalExpenses > 0 ? Math.round((topCategoryAmount / summary.totalExpenses) * 100) : 0

    // 2. Média de gasto diário estimado (considerando 30 dias de referência)
    const dailyAverageExpense = summary.totalExpenses > 0 ? summary.totalExpenses / 30 : 0

    return {
      topCategory,
      topCategoryAmount,
      topCategoryPercent,
      dailyAverageExpense,
      expenseCount,
      incomeCount,
      totalCount: transactions.length,
      savingsRate: summary.savingsRate,
      isDeficit: summary.totalExpenses > summary.totalIncome && summary.totalIncome > 0,
      deficitAmount: summary.totalExpenses - summary.totalIncome,
    }
  }, [transactions, summary])

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val)
  }

  if (!insights) {
    return (
      <div className="glass-card p-4 rounded-3xl border border-white/8 flex items-center gap-3.5 text-xs text-zinc-400">
        <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <p className="font-semibold text-zinc-200">Insights Inteligentes</p>
          <p className="text-zinc-400">
            Adicione lançamentos neste período para visualizar análises de consumo, maior centro de
            custos e ritmo diário.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-semibold tracking-wide uppercase text-zinc-400">
          Insights do Período
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* INSIGHT 1: MAIOR CENTRO DE CUSTO */}
        <div className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Maior Despesa</span>
            <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          {insights.topCategory ? (
            <div>
              <p className="text-sm font-bold text-white truncate">{insights.topCategory}</p>
              <p className="text-xs text-rose-400 font-medium">
                {formatCurrency(insights.topCategoryAmount)}{' '}
                <span className="text-zinc-400 text-[11px]">
                  ({insights.topCategoryPercent}% dos gastos)
                </span>
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Sem despesas registradas.</p>
          )}
        </div>

        {/* INSIGHT 2: TAXA DE ECONOMIA OU ALERTA */}
        <div className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Saúde Financeira</span>
            <div
              className={`p-1.5 rounded-xl border ${
                insights.isDeficit
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              {insights.isDeficit ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <PiggyBank className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div>
            {insights.isDeficit ? (
              <>
                <p className="text-sm font-bold text-amber-400">Gastos &gt; Receitas</p>
                <p className="text-xs text-zinc-400">
                  Déficit de {formatCurrency(insights.deficitAmount)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-bold text-emerald-400">
                  {insights.savingsRate}% Poupado
                </p>
                <p className="text-xs text-zinc-400">
                  {insights.savingsRate >= 20
                    ? 'Ótima taxa de economia!'
                    : 'Dentro da faixa positiva.'}
                </p>
              </>
            )}
          </div>
        </div>

        {/* INSIGHT 3: MÉDIA DIÁRIA DE GASTOS */}
        <div className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Ritmo Médio</span>
            <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {formatCurrency(insights.dailyAverageExpense)}
              <span className="text-zinc-400 text-xs font-normal"> /dia</span>
            </p>
            <p className="text-xs text-zinc-400">Média estimada de desembolso</p>
          </div>
        </div>

        {/* INSIGHT 4: VOLUME DE ATIVIDADE */}
        <div className="glass-card p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all space-y-2">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium">Volume</span>
            <div className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {insights.totalCount}{' '}
              <span className="text-zinc-400 text-xs font-normal">transações</span>
            </p>
            <p className="text-xs text-zinc-400">
              {insights.incomeCount} entradas · {insights.expenseCount} saídas
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
