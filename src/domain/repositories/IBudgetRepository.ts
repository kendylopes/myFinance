export interface IBudgetRepository {
  getBudget(yearMonth: string): Promise<number>
  setBudget(yearMonth: string, amount: number): Promise<void>
}
