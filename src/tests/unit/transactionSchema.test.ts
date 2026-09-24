import { describe, expect, it } from 'vitest'
import {
  createCategorySchema,
  createTransactionSchema,
} from '../../domain/schemas/transactionSchema'

describe('Zod Schemas (Segurança & Validação)', () => {
  describe('createTransactionSchema', () => {
    it('deve validar com sucesso uma transação completa e válida', () => {
      const validData = {
        title: 'Almoço Executivo',
        amount: 45.9,
        type: 'expense',
        category: 'Alimentação',
        date: '2026-09-24',
      }

      const result = createTransactionSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.title).toBe('Almoço Executivo')
        expect(result.data.amount).toBe(45.9)
      }
    })

    it('deve rejeitar transação sem título ou com título vazio', () => {
      const invalidData = {
        title: '   ',
        amount: 100,
        type: 'income',
        category: 'Salário',
        date: '2026-09-24',
      }

      const result = createTransactionSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('A descrição é obrigatória.')
      }
    })

    it('deve rejeitar valor igual a zero ou negativo', () => {
      const zeroData = {
        title: 'Depósito',
        amount: 0,
        type: 'income',
        category: 'Salário',
        date: '2026-09-24',
      }

      const result = createTransactionSchema.safeParse(zeroData)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe(
          'O valor deve ser um número positivo maior que zero.',
        )
      }
    })

    it('deve rejeitar formato de data inválido', () => {
      const invalidDate = {
        title: 'Conta de Luz',
        amount: 150,
        type: 'expense',
        category: 'Moradia',
        date: '24/09/2026',
      }

      const result = createTransactionSchema.safeParse(invalidDate)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('A data informada é inválida')
      }
    })

    it('deve rejeitar título excessivamente longo (> 100 caracteres)', () => {
      const longTitle = {
        title: 'a'.repeat(105),
        amount: 200,
        type: 'expense',
        category: 'Geral',
        date: '2026-09-24',
      }

      const result = createTransactionSchema.safeParse(longTitle)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('máximo 100 caracteres')
      }
    })
  })

  describe('createCategorySchema', () => {
    it('deve validar categoria com nome e tipo válidos', () => {
      const validCategory = {
        name: 'Investimentos',
        type: 'income',
      }

      const result = createCategorySchema.safeParse(validCategory)
      expect(result.success).toBe(true)
    })

    it('deve rejeitar categoria com menos de 2 caracteres', () => {
      const shortCategory = {
        name: 'A',
        type: 'expense',
      }

      const result = createCategorySchema.safeParse(shortCategory)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toContain('mínimo 2 caracteres')
      }
    })
  })
})
