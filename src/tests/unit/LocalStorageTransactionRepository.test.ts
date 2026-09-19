import { beforeEach, describe, expect, it } from 'vitest'
import { LocalStorageTransactionRepository } from '../../data/repositories/LocalStorageTransactionRepository'

describe('LocalStorageTransactionRepository (Acesso a Dados)', () => {
  const TEST_KEY = 'test_myfinance_key'
  let repository: LocalStorageTransactionRepository

  beforeEach(() => {
    localStorage.clear()
    repository = new LocalStorageTransactionRepository(TEST_KEY)
  })

  it('deve inicializar com sementes padrão se o storage estiver vazio', async () => {
    const items = await repository.getAll()
    expect(items.length).toBeGreaterThan(0)
    expect(items[0]).toHaveProperty('title')
  })

  it('deve criar uma nova transação e persistir no topo da lista', async () => {
    const created = await repository.create({
      title: 'Consultoria Web',
      amount: 1500,
      type: 'income',
      category: 'Serviços',
      date: '2026-09-15',
    })

    expect(created.id).toBeDefined()
    expect(created.title).toBe('Consultoria Web')
    expect(created.amount).toBe(1500)

    const all = await repository.getAll()
    expect(all[0].id).toBe(created.id)
  })

  it('deve excluir uma transação existente com sucesso', async () => {
    const items = await repository.getAll()
    const idToDelete = items[0].id

    const deleted = await repository.delete(idToDelete)
    expect(deleted).toBe(true)

    const remaining = await repository.getAll()
    expect(remaining.some((item) => item.id === idToDelete)).toBe(false)
  })

  it('deve retornar false ao tentar excluir id inexistente', async () => {
    const result = await repository.delete('id_inexistente_999')
    expect(result).toBe(false)
  })
})
