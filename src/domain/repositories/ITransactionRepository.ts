import type { CreateTransactionDTO, Transaction } from '../models/transaction'

export interface ITransactionRepository {
  /**
   * Obtém todas as transações cadastradas.
   */
  getAll(): Promise<Transaction[]>

  /**
   * Cria e persiste uma nova transação.
   */
  create(data: CreateTransactionDTO): Promise<Transaction>

  /**
   * Remove uma transação pelo identificador único.
   */
  delete(id: string): Promise<boolean>

  /**
   * Remove todas as transações (útil para testes ou reset de dados).
   */
  clear(): Promise<void>
}
