import {
  Activity,
  ArrowDownRight,
  Award,
  CalendarClock,
  Flame,
  PiggyBank,
  Sparkles,
} from 'lucide-react'
import { useMemo } from 'react'
import type {
  BudgetProgress,
  FinanceSummary,
  Transaction,
} from '../../../domain/models/transaction'
import { calculateFinancialHealthScore } from '../../../domain/services/healthScoreService'

export interface FinancialInsightsProps {
  transactions: Transaction[]
  summary: FinanceSummary
  selectedMonth?: string
  budgetProgress?: BudgetProgress | null
}

export function FinancialInsights({
  transactions,
  summary,
  budgetProgress,
}: FinancialInsightsProps) {
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
      summary.totalExpense > 0 ? Math.round((topCategoryAmount / summary.totalExpense) * 100) : 0

    // 2. Média de gasto diário estimado (considerando 30 dias de referência)
    const dailyAverageExpense = summary.totalExpense > 0 ? summary.totalExpense / 30 : 0

    const savingsRate =
      summary.totalIncome > 0
        ? Math.max(
            0,
            Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100),
          )
        : 0

    // 3. Score de Saúde Financeira
    const healthScore = calculateFinancialHealthScore({
      summary,
      transactionsCount: transactions.length,
      topCategory,
      topCategoryAmount,
      topCategoryPercent,
      budgetProgress,
    })

    return {
      topCategory,
      topCategoryAmount,
      topCategoryPercent,
      dailyAverageExpense,
      expenseCount,
      incomeCount,
      totalCount: transactions.length,
      savingsRate,
      isDeficit: summary.totalExpense > summary.totalIncome && summary.totalIncome > 0,
      deficitAmount: summary.totalExpense - summary.totalIncome,
      healthScore,
    }
  }, [transactions, summary, budgetProgress])

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
            Adicione lançamentos neste período para visualizar análises de consumo, diagnóstico do
            Score de Saúde Financeira e ritmo diário.
          </p>
        </div>
      </div>
    )
  }

  const { healthScore } = insights
  const circleRadius = 28
  const circumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circumference - (circumference * healthScore.score) / 100

  return (
    <div className="space-y-3">
      {/* CARD PRINCIPAL: SCORE DE SAÚDE FINANCEIRA */}
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 relative overflow-hidden shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Lado Esquerdo: Gauge Circular + Diagnóstico */}
          <div className="flex items-center gap-4">
            <div className="relative w-18 h-18 sm:w-20 sm:h-20 shrink-0 flex items-center justify-center">
              <svg
                role="img"
                aria-label="Indicador visual do Score de Saúde Financeira"
                className="w-full h-full -rotate-90 transform"
                viewBox="0 0 68 68"
              >
                <title>Indicador visual do Score de Saúde Financeira</title>
                {/* Trilha de fundo */}
                <circle
                  cx="34"
                  cy="34"
                  r={circleRadius}
                  className="stroke-white/10"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Arco do Score */}
                <circle
                  cx="34"
                  cy="34"
                  r={circleRadius}
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className={`${healthScore.color} transition-all duration-1000 ease-out`}
                />
              </svg>
              {/* Número central do Score */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-lg sm:text-xl font-black font-mono text-white leading-none">
                  {healthScore.score}
                </span>
                <span className="text-3xs text-zinc-400 uppercase tracking-wider font-semibold">
                  / 100
                </span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-emerald-400" />
                  <span>Saúde Financeira</span>
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-2xs font-bold border uppercase tracking-wider ${
                    healthScore.rating === 'excellent'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : healthScore.rating === 'good'
                        ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                        : healthScore.rating === 'warning'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {healthScore.label}
                </span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed max-w-xl">
                {healthScore.recommendation}
              </p>
            </div>
          </div>

          {/* Lado Direito: Os 4 Pilares da Avaliação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/5">
            <div className="p-2 rounded-xl bg-white/4 border border-white/6 text-xs">
              <div className="flex items-center justify-between text-2xs text-zinc-400">
                <span>Poupança</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {healthScore.factors.savings.points}/{healthScore.factors.savings.maxPoints}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{
                    width: `${(healthScore.factors.savings.points / healthScore.factors.savings.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/4 border border-white/6 text-xs">
              <div className="flex items-center justify-between text-2xs text-zinc-400">
                <span>Orçamento</span>
                <span className="font-mono text-cyan-400 font-bold">
                  {healthScore.factors.budget.points}/{healthScore.factors.budget.maxPoints}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all"
                  style={{
                    width: `${(healthScore.factors.budget.points / healthScore.factors.budget.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/4 border border-white/6 text-xs">
              <div className="flex items-center justify-between text-2xs text-zinc-400">
                <span>Distribuição</span>
                <span className="font-mono text-amber-400 font-bold">
                  {healthScore.factors.distribution.points}/
                  {healthScore.factors.distribution.maxPoints}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{
                    width: `${(healthScore.factors.distribution.points / healthScore.factors.distribution.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="p-2 rounded-xl bg-white/4 border border-white/6 text-xs">
              <div className="flex items-center justify-between text-2xs text-zinc-400">
                <span>Controle</span>
                <span className="font-mono text-violet-400 font-bold">
                  {healthScore.factors.consistency.points}/
                  {healthScore.factors.consistency.maxPoints}
                </span>
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all"
                  style={{
                    width: `${(healthScore.factors.consistency.points / healthScore.factors.consistency.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE 4 CARDS COMPLEMENTARES DE INSIGHTS */}
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
                <span className="text-zinc-400 text-2xs">
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
            <span className="font-medium">Poupança Mensal</span>
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
            <span className="font-medium">Volume & Frequência</span>
            <div className="p-1.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              {insights.totalCount}{' '}
              <span className="text-zinc-400 text-xs font-normal">lançamentos</span>
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
