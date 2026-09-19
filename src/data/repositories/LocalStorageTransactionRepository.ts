import type { CreateTransactionDTO, Transaction } from '../../domain/models/transaction'
import type { ITransactionRepository } from '../../domain/repositories/ITransactionRepository'

const STORAGE_KEY = 'myfinance_transactions_v1'

const DEFAULT_SEEDS: Transaction[] = [
  {
    id: '1',
    title: 'Salário Mensal',
    amount: 3500.0,
    type: 'income',
    category: 'Trabalho',
    date: '2026-09-01',
  },
  {
    id: '2',
    title: 'Supermercado Semanal',
    amount: 450.5,
    type: 'expense',
    category: 'Alimentação',
    date: '2026-09-05',
  },
  {
    id: '3',
    title: 'Freelance Design',
    amount: 800.0,
    type: 'income',
    category: 'Serviços',
    date: '2026-09-10',
  },
  {
    id: '4',
    title: 'Conta de Luz & Internet',
    amount: 320.0,
    type: 'expense',
    category: 'Moradia',
    date: '2026-09-12',
  },
]

export class LocalStorageTransactionRepository implements ITransactionRepository {
  private key: string

  constructor(customKey = STORAGE_KEY) {
    this.key = customKey
  }

  async getAll(): Promise<Transaction[]> {
    try {
      const raw = localStorage.getItem(this.key)
      if (!raw) {
        // Inicializa com os dados de demonstração na primeira execução
        await this.persist(DEFAULT_SEEDS)
        return DEFAULT_SEEDS
      }
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.error('[LocalStorageTransactionRepository] Erro ao carregar transações:', error)
      return []
    }
  }

  async create(data: CreateTransactionDTO): Promise<Transaction> {
    const currentList = await this.getAll()
    const newTransaction: Transaction = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: data.title.trim(),
      amount: Number(data.amount),
      type: data.type,
      category: data.category.trim() || 'Geral',
      date: data.date,
    }

    const updated = [newTransaction, ...currentList]
    await this.persist(updated)
    return newTransaction
  }

  async delete(id: string): Promise<boolean> {
    const currentList = await this.getAll()
    const filtered = currentList.filter((item) => item.id !== id)
    if (filtered.length === currentList.length) {
      return false
    }
    await this.persist(filtered)
    return true
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.key)
  }

  private async persist(items: Transaction[]): Promise<void> {
    try {
      localStorage.setItem(this.key, JSON.stringify(items))
    } catch (error) {
      console.error('[LocalStorageTransactionRepository] Erro ao gravar no localStorage:', error)
      throw new Error('Falha ao persistir transação no armazenamento local.')
    }
  }
}
