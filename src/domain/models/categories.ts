/**
 * Categorias padronizadas e personalizadas do myFinance para receitas e despesas.
 * Suporta categorias padrão pré-definidas e categorias customizadas criadas pelo usuário.
 * Camada de Domínio Pura (Zero dependências de UI / React).
 */

export type CategoryType = 'income' | 'expense'

export interface Category {
  id: string
  name: string
  type: CategoryType
  icon: string
  userId?: string
  isCustom?: boolean
  createdAt?: string
}

export type CreateCategoryDTO = {
  name: string
  type: CategoryType
  icon?: string
}

export interface PredefinedCategory {
  id: string
  name: string
  icon: string
}

export const DEFAULT_EXPENSE_CATEGORIES: PredefinedCategory[] = [
  { id: 'alimentacao', name: 'Alimentação', icon: 'Utensils' },
  { id: 'transporte', name: 'Transporte', icon: 'Car' },
  { id: 'moradia', name: 'Moradia', icon: 'Home' },
  { id: 'saude', name: 'Saúde', icon: 'HeartPulse' },
  { id: 'lazer', name: 'Lazer', icon: 'Film' },
  { id: 'educacao', name: 'Educação', icon: 'GraduationCap' },
  { id: 'compras', name: 'Compras', icon: 'ShoppingBag' },
  { id: 'contas', name: 'Contas Fixas', icon: 'Receipt' },
  { id: 'outros', name: 'Outros', icon: 'Tag' },
]

export const DEFAULT_INCOME_CATEGORIES: PredefinedCategory[] = [
  { id: 'salario', name: 'Salário', icon: 'Briefcase' },
  { id: 'freelance', name: 'Freelance / Bico', icon: 'Laptop' },
  { id: 'investimentos', name: 'Investimentos', icon: 'TrendingUp' },
  { id: 'presentes', name: 'Presentes / Extras', icon: 'Gift' },
  { id: 'outros', name: 'Outros', icon: 'Tag' },
]
