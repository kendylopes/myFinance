import type { Debt } from '../models/debt'

export interface PayoffDebtStep {
  debtId: string
  lenderName: string
  currentBalance: number
  interestRate: number
  estimatedMonthsToPayoff: number
}

export interface PayoffStrategyResult {
  strategy: 'avalanche' | 'snowball'
  name: string
  description: string
  totalMonths: number
  totalInterestPaid: number
  payoffOrder: PayoffDebtStep[]
  isFeasible: boolean
}

export interface SimulationComparison {
  avalanche: PayoffStrategyResult
  snowball: PayoffStrategyResult
  interestSavings: number
  monthsDifference: number
  recommendedStrategy: 'avalanche' | 'snowball'
}

/**
 * Calcula a taxa de juros mensal equivalente em %
 */
export const getEffectiveMonthlyRate = (debt: Debt): number => {
  if (debt.interestType === 'fixed') {
    if (debt.currentBalance <= 0) return 0
    return ((debt.fixedInterestAmount || 0) / debt.currentBalance) * 100
  }
  if (debt.interestType === 'daily') {
    return (debt.interestRate || 0) * 30
  }
  return debt.interestRate || 0
}

/**
 * Simula uma estratégia específica (Avalanche ou Bola de Neve)
 */
export const simulateStrategy = (
  activeDebts: Debt[],
  monthlyExtraBudget = 0,
  strategy: 'avalanche' | 'snowball',
): PayoffStrategyResult => {
  if (activeDebts.length === 0) {
    return {
      strategy,
      name: strategy === 'avalanche' ? 'Método Avalanche' : 'Bola de Neve',
      description:
        strategy === 'avalanche'
          ? 'Foca em pagar primeiro as dívidas com maiores juros para economizar o máximo de dinheiro.'
          : 'Foca em quitar primeiro as dívidas menores para gerar vitórias psicológicas rápidas.',
      totalMonths: 0,
      totalInterestPaid: 0,
      payoffOrder: [],
      isFeasible: true,
    }
  }

  // Clona e ordena as dívidas
  const debtsWorking = activeDebts.map((d) => ({
    id: d.id,
    lenderName: d.lenderName,
    balance: d.currentBalance,
    rate: getEffectiveMonthlyRate(d),
    fixedInterest: d.interestType === 'fixed' ? d.fixedInterestAmount || 0 : undefined,
    monthsToPayoff: 0,
    paid: false,
  }))

  if (strategy === 'avalanche') {
    // Maior taxa de juros primeiro
    debtsWorking.sort((a, b) => b.rate - a.rate)
  } else {
    // Menor saldo devedor primeiro
    debtsWorking.sort((a, b) => a.balance - b.balance)
  }

  let totalInterestPaid = 0
  let currentMonth = 0
  const MAX_MONTHS = 360 // Limite de 30 anos para proteção de loop
  let isFeasible = true

  // Loop mês a mês
  while (debtsWorking.some((d) => !d.paid) && currentMonth < MAX_MONTHS) {
    currentMonth++

    let extraPool = monthlyExtraBudget

    // 1. Apura juros do mês para todas as dívidas abertas
    for (const d of debtsWorking) {
      if (!d.paid) {
        const monthlyInterest =
          d.fixedInterest !== undefined ? d.fixedInterest : (d.balance * d.rate) / 100
        totalInterestPaid += monthlyInterest
      }
    }

    // Se o aporte extra for 0 e nenhuma dívida puder amortizar além dos juros
    if (monthlyExtraBudget <= 0) {
      // Sem aporte extra, apenas rolando dívidas sem amortização
      isFeasible = false
      break
    }

    // 2. Amortiza com o saldo extra na dívida prioritária
    for (const d of debtsWorking) {
      if (d.paid) continue

      if (extraPool > 0) {
        if (extraPool >= d.balance) {
          extraPool -= d.balance
          d.balance = 0
          d.paid = true
          d.monthsToPayoff = currentMonth
        } else {
          d.balance -= extraPool
          extraPool = 0
          break
        }
      }
    }
  }

  if (currentMonth >= MAX_MONTHS && debtsWorking.some((d) => !d.paid)) {
    isFeasible = false
  }

  return {
    strategy,
    name: strategy === 'avalanche' ? 'Método Avalanche' : 'Bola de Neve',
    description:
      strategy === 'avalanche'
        ? 'Foca em pagar primeiro as dívidas com maiores juros para economizar o máximo de dinheiro.'
        : 'Foca em quitar primeiro as dívidas menores para gerar vitórias psicológicas rápidas.',
    totalMonths: isFeasible ? currentMonth : MAX_MONTHS,
    totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
    payoffOrder: debtsWorking.map((d) => ({
      debtId: d.id,
      lenderName: d.lenderName,
      currentBalance: Math.round(d.balance * 100) / 100,
      interestRate: Math.round(d.rate * 10) / 10,
      estimatedMonthsToPayoff: d.monthsToPayoff || (isFeasible ? currentMonth : MAX_MONTHS),
    })),
    isFeasible,
  }
}

/**
 * Compara as duas principais estratégias de eliminação de dívidas
 */
export const comparePayoffStrategies = (
  debts: Debt[],
  monthlyExtraBudget = 0,
): SimulationComparison => {
  const active = debts.filter((d) => d.status !== 'paid' && d.currentBalance > 0)

  const avalanche = simulateStrategy(active, monthlyExtraBudget, 'avalanche')
  const snowball = simulateStrategy(active, monthlyExtraBudget, 'snowball')

  const interestSavings = Math.max(0, snowball.totalInterestPaid - avalanche.totalInterestPaid)
  const monthsDifference = Math.abs(snowball.totalMonths - avalanche.totalMonths)

  return {
    avalanche,
    snowball,
    interestSavings: Math.round(interestSavings * 100) / 100,
    monthsDifference,
    recommendedStrategy:
      avalanche.totalInterestPaid <= snowball.totalInterestPaid ? 'avalanche' : 'snowball',
  }
}
