import {
  Activity,
  ArrowDownRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Flame,
  Info,
  PiggyBank,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { useMemo } from 'react'
import type {
  BudgetProgress,
  FinanceSummary,
  Transaction,
} from '../../../domain/models/transaction'
import { calculateFinancialHealthScore } from '../../../domain/services/healthScoreService'
import { useSpotlight } from '../../hooks/useSpotlight'

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
  const spotlightRef = useSpotlight<HTMLDivElement>()

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
      <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/8 flex items-center gap-3.5 text-xs text-zinc-400">
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shrink-0 shadow-xs">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="font-semibold text-zinc-200 text-sm">Insights Inteligentes</p>
          <p className="text-zinc-400 mt-0.5 leading-relaxed">
            Adicione lançamentos neste período para visualizar análises de consumo, diagnóstico do
            Score de Saúde Financeira e ritmo diário.
          </p>
        </div>
      </div>
    )
  }

  const { healthScore } = insights
  const circleRadius = 30
  const circumference = 2 * Math.PI * circleRadius
  const strokeDashoffset = circumference - (circumference * healthScore.score) / 100

  // Cores dinâmicas para o gradiente SVG e aura
  const scoreColors = {
    excellent: {
      gradientStart: '#10b981',
      gradientEnd: '#34d399',
      badgeBg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      glow: 'shadow-emerald-500/15',
    },
    good: {
      gradientStart: '#06b6d4',
      gradientEnd: '#22d3ee',
      badgeBg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      glow: 'shadow-cyan-500/15',
    },
    warning: {
      gradientStart: '#f59e0b',
      gradientEnd: '#fbbf24',
      badgeBg: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      glow: 'shadow-amber-500/15',
    },
    critical: {
      gradientStart: '#f43f5e',
      gradientEnd: '#fb7185',
      badgeBg: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      glow: 'shadow-rose-500/15',
    },
  }[healthScore.rating]

  return (
    <div className="space-y-3.5">
      {/* CARD PRINCIPAL: HUB DE SAÚDE FINANCEIRA */}
      <div
        ref={spotlightRef}
        className={`glass-card spotlight-card p-5 sm:p-6 rounded-3xl border border-white/10 relative overflow-hidden shadow-xl ${scoreColors.glow} bg-linear-to-b from-white/4 to-transparent`}
      >
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          {/* Lado Esquerdo: Gauge Circular + Diagnóstico */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4.5 min-w-0">
            {/* Medidor Circular Lapidado */}
            <div className="relative w-20 h-20 sm:w-22 sm:h-22 shrink-0 flex items-center justify-center">
              <svg
                role="img"
                aria-label="Indicador visual do Score de Saúde Financeira"
                className="w-full h-full -rotate-90 transform drop-shadow-md"
                viewBox="0 0 76 76"
              >
                <title>Indicador visual do Score de Saúde Financeira</title>
                <defs>
                  <linearGradient id="scoreGaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={scoreColors.gradientStart} />
                    <stop offset="100%" stopColor={scoreColors.gradientEnd} />
                  </linearGradient>
                </defs>
                {/* Trilha de fundo com opacidade sutil */}
                <circle
                  cx="38"
                  cy="38"
                  r={circleRadius}
                  className="stroke-white/8"
                  strokeWidth="5"
                  fill="transparent"
                />
                {/* Arco de preenchimento com gradiente de alta fidelidade */}
                <circle
                  cx="38"
                  cy="38"
                  r={circleRadius}
                  stroke="url(#scoreGaugeGradient)"
                  strokeWidth="5"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              {/* Centro com valor do Score */}
              <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tighter leading-none">
                  {healthScore.score}
                </span>
                <span className="text-3xs text-zinc-400 uppercase tracking-widest font-semibold mt-0.5">
                  / 100
                </span>
              </div>
            </div>

            {/* Diagnóstico e Recomendação */}
            <div className="space-y-2 min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <h4 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Saúde Financeira
                  </h4>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-2xs font-bold border uppercase tracking-wider backdrop-blur-md shadow-xs ${scoreColors.badgeBg}`}
                >
                  {healthScore.label}
                </span>
              </div>

              {/* Recomendação inteligente */}
              <div className="flex items-start gap-2 p-2.5 rounded-2xl bg-white/3 border border-white/6 max-w-xl">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-zinc-300 leading-relaxed font-normal">
                  {healthScore.recommendation}
                </p>
              </div>
            </div>
          </div>

          {/* Lado Direito: Os 4 Pilares da Avaliação */}
          <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-2 gap-2.5 shrink-0 pt-3 xl:pt-0 border-t xl:border-t-0 border-white/6">
            {/* Pilar 1: Poupança */}
            <div className="p-2.5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/6 transition-all duration-200">
              <div className="flex items-center justify-between text-2xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <PiggyBank className="w-3 h-3 text-emerald-400" />
                  Poupança
                </span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  {healthScore.factors.savings.points}/{healthScore.factors.savings.maxPoints}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/8 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${(healthScore.factors.savings.points / healthScore.factors.savings.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Pilar 2: Orçamento */}
            <div className="p-2.5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/6 transition-all duration-200">
              <div className="flex items-center justify-between text-2xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  Orçamento
                </span>
                <span className="font-mono text-cyan-400 font-bold tabular-nums">
                  {healthScore.factors.budget.points}/{healthScore.factors.budget.maxPoints}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/8 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-cyan-500 to-blue-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${(healthScore.factors.budget.points / healthScore.factors.budget.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Pilar 3: Distribuição */}
            <div className="p-2.5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/6 transition-all duration-200">
              <div className="flex items-center justify-between text-2xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-amber-400" />
                  Distribuição
                </span>
                <span className="font-mono text-amber-400 font-bold tabular-nums">
                  {healthScore.factors.distribution.points}/
                  {healthScore.factors.distribution.maxPoints}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/8 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-700"
                  style={{
                    width: `${(healthScore.factors.distribution.points / healthScore.factors.distribution.maxPoints) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Pilar 4: Controle */}
            <div className="p-2.5 rounded-2xl bg-white/3 hover:bg-white/5 border border-white/6 transition-all duration-200">
              <div className="flex items-center justify-between text-2xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-violet-400" />
                  Controle
                </span>
                <span className="font-mono text-violet-400 font-bold tabular-nums">
                  {healthScore.factors.consistency.points}/
                  {healthScore.factors.consistency.maxPoints}
                </span>
              </div>
              <div className="w-full h-1.5 bg-white/8 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-700"
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
        <div className="glass-card spotlight-card p-4 rounded-3xl border border-white/8 hover:border-rose-500/30 transition-all duration-300 hover:scale-[1.015] space-y-2.5 group relative overflow-hidden bg-linear-to-b from-white/3 to-transparent shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Maior Despesa
            </span>
            <div className="p-2 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 group-hover:scale-110 group-hover:shadow-rose-500/20 transition-all duration-200">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          {insights.topCategory ? (
            <div className="space-y-1">
              <p className="text-base font-bold text-white truncate tracking-tight">
                {insights.topCategory}
              </p>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xs text-rose-400 font-semibold font-mono tabular-nums">
                  {formatCurrency(insights.topCategoryAmount)}
                </span>
                <span className="text-2xs text-rose-300/80 font-medium px-1.5 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20">
                  {insights.topCategoryPercent}% dos gastos
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">Sem despesas registradas.</p>
          )}
        </div>

        {/* INSIGHT 2: TAXA DE ECONOMIA OU ALERTA */}
        <div className="glass-card spotlight-card p-4 rounded-3xl border border-white/8 hover:border-emerald-500/30 transition-all duration-300 hover:scale-[1.015] space-y-2.5 group relative overflow-hidden bg-linear-to-b from-white/3 to-transparent shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Poupança Mensal
            </span>
            <div
              className={`p-2 rounded-2xl border transition-all duration-200 group-hover:scale-110 ${
                insights.isDeficit
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:shadow-amber-500/20'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 group-hover:shadow-emerald-500/20'
              }`}
            >
              {insights.isDeficit ? (
                <ArrowDownRight className="w-3.5 h-3.5" />
              ) : (
                <PiggyBank className="w-3.5 h-3.5" />
              )}
            </div>
          </div>
          <div className="space-y-1">
            {insights.isDeficit ? (
              <>
                <p className="text-base font-bold text-amber-400 tracking-tight">
                  Gastos &gt; Receitas
                </p>
                <p className="text-xs text-zinc-400 font-mono tabular-nums">
                  Déficit de {formatCurrency(insights.deficitAmount)}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-emerald-400 tracking-tight flex items-center gap-1.5">
                  <span>{insights.savingsRate}% Poupado</span>
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
        <div className="glass-card spotlight-card p-4 rounded-3xl border border-white/8 hover:border-cyan-500/30 transition-all duration-300 hover:scale-[1.015] space-y-2.5 group relative overflow-hidden bg-linear-to-b from-white/3 to-transparent shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Ritmo Médio
            </span>
            <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 group-hover:shadow-cyan-500/20 transition-all duration-200">
              <CalendarClock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white font-mono tabular-nums tracking-tight">
              {formatCurrency(insights.dailyAverageExpense)}
              <span className="text-zinc-400 text-xs font-normal"> /dia</span>
            </p>
            <p className="text-xs text-zinc-400">Média estimada de desembolso</p>
          </div>
        </div>

        {/* INSIGHT 4: VOLUME DE ATIVIDADE */}
        <div className="glass-card spotlight-card p-4 rounded-3xl border border-white/8 hover:border-violet-500/30 transition-all duration-300 hover:scale-[1.015] space-y-2.5 group relative overflow-hidden bg-linear-to-b from-white/3 to-transparent shadow-md">
          <div className="flex items-center justify-between text-zinc-400 text-xs">
            <span className="font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">
              Volume & Frequência
            </span>
            <div className="p-2 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-violet-400 group-hover:scale-110 group-hover:shadow-violet-500/20 transition-all duration-200">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-white font-mono tabular-nums tracking-tight">
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
