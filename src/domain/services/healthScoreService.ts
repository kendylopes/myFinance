import type { BudgetProgress, FinanceSummary } from '../models/transaction'

export type HealthRating = 'critical' | 'warning' | 'good' | 'excellent'

export interface HealthScoreResult {
  score: number // 0 a 100
  rating: HealthRating
  label: string
  color: string
  savingsRate: number
  factors: {
    savings: { points: number; maxPoints: number; text: string }
    budget: { points: number; maxPoints: number; text: string }
    distribution: { points: number; maxPoints: number; text: string }
    consistency: { points: number; maxPoints: number; text: string }
  }
  recommendation: string
}

export interface CalculateHealthScoreParams {
  summary: FinanceSummary
  transactionsCount: number
  topCategory?: string
  topCategoryAmount?: number
  topCategoryPercent?: number
  budgetProgress?: BudgetProgress | null
}

/**
 * Calcula o Score de Saúde Financeira de 0 a 100 baseado em 4 pilares:
 * 1. Taxa de Poupança / Superávit (até 40 pts)
 * 2. Controle do Orçamento Mensal (até 30 pts)
 * 3. Diversificação dos Gastos (até 20 pts)
 * 4. Frequência de Registros e Controle Ativo (até 10 pts)
 */
export function calculateFinancialHealthScore({
  summary,
  transactionsCount,
  topCategory,
  topCategoryAmount: _topCategoryAmount = 0,
  topCategoryPercent = 0,
  budgetProgress,
}: CalculateHealthScoreParams): HealthScoreResult {
  // 1. Pilar Poupança (máx 40)
  let savingsPoints = 0
  let savingsText = ''
  const hasIncome = summary.totalIncome > 0
  const savingsRate = hasIncome
    ? Math.max(
        0,
        Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100),
      )
    : 0

  if (hasIncome) {
    if (summary.totalExpense > summary.totalIncome) {
      savingsPoints = 5
      savingsText = 'Déficit no período: gastos maiores que os ganhos'
    } else if (savingsRate >= 30) {
      savingsPoints = 40
      savingsText = `Excelente taxa de economia (${savingsRate}%)`
    } else if (savingsRate >= 20) {
      savingsPoints = 35
      savingsText = `Ótima taxa de economia (${savingsRate}%)`
    } else if (savingsRate >= 10) {
      savingsPoints = 25
      savingsText = `Poupança moderada (${savingsRate}%)`
    } else {
      savingsPoints = 15
      savingsText = `Poupança baixa (${savingsRate}%)`
    }
  } else if (summary.totalExpense === 0) {
    savingsPoints = 20
    savingsText = 'Sem movimentações no período'
  } else {
    savingsPoints = 5
    savingsText = 'Despesas registradas sem entrada informada'
  }

  // 2. Pilar Orçamento / Teto Mensal (máx 30)
  let budgetPoints = 0
  let budgetText = ''
  if (budgetProgress && budgetProgress.budgetAmount > 0) {
    if (budgetProgress.spentPercentage <= 80) {
      budgetPoints = 30
      budgetText = `Dentro da meta (${Math.round(budgetProgress.spentPercentage)}% utilizado)`
    } else if (budgetProgress.spentPercentage <= 100) {
      budgetPoints = 20
      budgetText = `Atenção: próximo do limite (${Math.round(budgetProgress.spentPercentage)}%)`
    } else {
      budgetPoints = 5
      budgetText = `Teto de gastos ultrapassado (${Math.round(budgetProgress.spentPercentage)}%)`
    }
  } else {
    budgetPoints = 20
    budgetText = 'Teto mensal não definido no Planejamento'
  }

  // 3. Pilar Diversificação de Despesas (máx 20)
  let distPoints = 0
  let distText = ''
  if (summary.totalExpense === 0) {
    distPoints = 20
    distText = 'Nenhuma despesa para concentrar'
  } else if (topCategoryPercent <= 35) {
    distPoints = 20
    distText = 'Custos bem distribuídos entre as categorias'
  } else if (topCategoryPercent <= 50) {
    distPoints = 15
    distText = `Distribuição equilibrada (maior: ${topCategory || 'Diversos'} com ${topCategoryPercent}%)`
  } else if (topCategoryPercent <= 70) {
    distPoints = 10
    distText = `Concentração elevada em ${topCategory || 'uma categoria'} (${topCategoryPercent}%)`
  } else {
    distPoints = 5
    distText = `Alerta: ${topCategory || 'uma categoria'} absorve ${topCategoryPercent}% dos gastos`
  }

  // 4. Pilar Frequência & Controle (máx 10)
  let consistencyPoints = 0
  let consistencyText = ''
  if (transactionsCount >= 5 && hasIncome && summary.totalExpense > 0) {
    consistencyPoints = 10
    consistencyText = 'Controle ativo com entradas e saídas frequentes'
  } else if (transactionsCount >= 1) {
    consistencyPoints = 7
    consistencyText = 'Controle inicial com registros parciais'
  } else {
    consistencyPoints = 2
    consistencyText = 'Poucos registros para análise detalhada'
  }

  const score = Math.min(
    100,
    Math.max(0, savingsPoints + budgetPoints + distPoints + consistencyPoints),
  )

  let rating: HealthRating = 'good'
  let label = 'Bom'
  let color = 'text-sky-400'

  if (score >= 80) {
    rating = 'excellent'
    label = 'Excelente'
    color = 'text-emerald-400'
  } else if (score >= 65) {
    rating = 'good'
    label = 'Equilibrado'
    color = 'text-cyan-400'
  } else if (score >= 45) {
    rating = 'warning'
    label = 'Atenção'
    color = 'text-amber-400'
  } else {
    rating = 'critical'
    label = 'Em Alerta'
    color = 'text-rose-400'
  }

  // Recomendação inteligente baseada no menor gargalo
  let recommendation = ''
  if (summary.totalExpense > summary.totalIncome && hasIncome) {
    recommendation =
      'Seus gastos superaram as entradas no período. Priorize cortar despesas supérfluas para evitar endividamento.'
  } else if (budgetProgress?.isExceeded) {
    recommendation =
      'Você ultrapassou o teto definido no Planejamento. Ajuste o orçamento ou contenha saídas nos próximos dias.'
  } else if (topCategoryPercent > 50 && topCategory) {
    recommendation = `A categoria "${topCategory}" representa ${topCategoryPercent}% do seu total. Analisar alternativas nela trará grande economia.`
  } else if (savingsRate < 20 && hasIncome) {
    recommendation =
      'Tente guardar ao menos 20% das suas receitas mensais para montar sua reserva de emergência.'
  } else if (score >= 80) {
    recommendation =
      'Parabéns! Sua gestão financeira está sólida, com gastos controlados e excelente taxa de retenção.'
  } else {
    recommendation =
      'Mantenha o registro contínuo de entradas e saídas para análises preditivas mais precisas.'
  }

  return {
    score,
    rating,
    label,
    color,
    savingsRate,
    factors: {
      savings: { points: savingsPoints, maxPoints: 40, text: savingsText },
      budget: { points: budgetPoints, maxPoints: 30, text: budgetText },
      distribution: { points: distPoints, maxPoints: 20, text: distText },
      consistency: { points: consistencyPoints, maxPoints: 10, text: consistencyText },
    },
    recommendation,
  }
}
