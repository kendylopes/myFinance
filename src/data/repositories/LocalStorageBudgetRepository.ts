import type { IBudgetRepository } from '../../domain/repositories/IBudgetRepository'

const STORAGE_KEY = 'myfinance_budgets'
export const DEFAULT_BUDGET_AMOUNT = 3000

export class LocalStorageBudgetRepository implements IBudgetRepository {
  private getStorageData(): Record<string, number> {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return {}
      }
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return {}
      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch {
      return {}
    }
  }

  private setStorageData(data: Record<string, number>): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      }
    } catch (err) {
      console.error('[LocalStorageBudgetRepository] Falha ao persistir orçamento:', err)
    }
  }

  async getBudget(yearMonth: string): Promise<number> {
    const data = this.getStorageData()

    // 1. Se existir orçamento específico para o mês solicitado
    if (data[yearMonth] !== undefined && typeof data[yearMonth] === 'number') {
      return data[yearMonth]
    }

    // 2. Se existir um orçamento global/padrão salvo pelo usuário
    if (data.default !== undefined && typeof data.default === 'number') {
      return data.default
    }

    // 3. Fallback padrão da aplicação
    return DEFAULT_BUDGET_AMOUNT
  }

  async setBudget(yearMonth: string, amount: number): Promise<void> {
    const data = this.getStorageData()
    const safeAmount = Number.isNaN(amount) || amount < 0 ? 0 : amount

    // Se yearMonth for 'all' ou 'default', atualiza a meta padrão
    if (yearMonth === 'all' || yearMonth === 'default') {
      data.default = safeAmount
    } else {
      data[yearMonth] = safeAmount
      // Se ainda não tiver default, define também como default
      if (data.default === undefined) {
        data.default = safeAmount
      }
    }

    this.setStorageData(data)
  }
}
