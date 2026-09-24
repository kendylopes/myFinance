import { z } from 'zod'

/**
 * Esquema de validação para criação e edição de transações financeiras.
 */
export const createTransactionSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'A descrição é obrigatória.')
    .max(100, 'A descrição deve ter no máximo 100 caracteres.'),
  amount: z
    .number({ message: 'O valor deve ser um número.' })
    .positive('O valor deve ser um número positivo maior que zero.'),
  type: z.enum(['income', 'expense'] as const, {
    message: 'O tipo da transação deve ser receita ou despesa.',
  }),
  category: z
    .string()
    .trim()
    .min(1, 'A categoria é obrigatória.')
    .max(60, 'A categoria deve ter no máximo 60 caracteres.'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'A data informada é inválida (use o formato AAAA-MM-DD).'),
})

export type ValidatedTransactionInput = z.infer<typeof createTransactionSchema>

/**
 * Esquema de validação para categorias personalizadas.
 */
export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome da categoria deve ter no mínimo 2 caracteres.')
    .max(50, 'O nome da categoria deve ter no máximo 50 caracteres.'),
  type: z.enum(['income', 'expense'] as const, {
    message: 'O tipo da categoria deve ser receita ou despesa.',
  }),
  icon: z.string().optional(),
})

export type ValidatedCategoryInput = z.infer<typeof createCategorySchema>
