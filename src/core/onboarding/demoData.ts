import type { CreateTransactionDTO } from '../../domain/models/transaction'

export function getDemoTransactions(): CreateTransactionDTO[] {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  // Gera datas realistas dentro do mês corrente
  return [
    {
      title: 'Salário Mensal',
      amount: 5500,
      type: 'income',
      category: 'Trabalho',
      date: `${year}-${month}-05`,
    },
    {
      title: 'Aluguel do Imóvel',
      amount: 1650,
      type: 'expense',
      category: 'Moradia',
      date: `${year}-${month}-08`,
    },
    {
      title: 'Supermercado Mensal',
      amount: 820,
      type: 'expense',
      category: 'Alimentação',
      date: `${year}-${month}-12`,
    },
    {
      title: 'Internet Fibra Óptica',
      amount: 140,
      type: 'expense',
      category: 'Serviços',
      date: `${year}-${month}-15`,
    },
    {
      title: 'Jantar em Família',
      amount: 210,
      type: 'expense',
      category: 'Lazer',
      date: `${year}-${month}-18`,
    },
    {
      title: 'Farmácia & Vitaminas',
      amount: 130,
      type: 'expense',
      category: 'Saúde',
      date: `${year}-${month}-20`,
    },
  ]
}

export const DEMO_BUDGET_AMOUNT = 3800
