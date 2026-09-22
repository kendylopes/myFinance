/**
 * Categorias padronizadas e personalizadas do myFinance para receitas e despesas.
 * Suporta categorias padrão pré-definidas e categorias customizadas criadas pelo usuário.
 */

import {
  Briefcase,
  Car,
  Coffee,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  type LucideIcon,
  Plane,
  Receipt,
  Shield,
  ShoppingBag,
  Sparkles,
  Tag,
  TrendingUp,
  Utensils,
  Zap,
} from 'lucide-react'

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

export const AVAILABLE_CATEGORY_ICONS: Record<string, LucideIcon> = {
  Tag,
  Utensils,
  Car,
  Home,
  HeartPulse,
  Film,
  GraduationCap,
  ShoppingBag,
  Receipt,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  Coffee,
  Plane,
  Shield,
  Zap,
  Sparkles,
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

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Alimentação: Utensils,
  Transporte: Car,
  Moradia: Home,
  Saúde: HeartPulse,
  Lazer: Film,
  Educação: GraduationCap,
  Compras: ShoppingBag,
  'Contas Fixas': Receipt,
  Salário: Briefcase,
  'Freelance / Bico': Laptop,
  Investimentos: TrendingUp,
  'Presentes / Extras': Gift,
  Outros: Tag,
}

/**
 * Retorna o ícone do Lucide apropriado para o nome ou identificador de ícone da categoria.
 * Suporta busca exata por nome, chave de ícone ou fallback inteligente.
 */
export function getCategoryIcon(categoryNameOrIcon: string): LucideIcon {
  if (!categoryNameOrIcon) return Tag
  const trimmed = categoryNameOrIcon.trim()

  // Se for o nome de um ícone disponível diretamente
  if (AVAILABLE_CATEGORY_ICONS[trimmed]) {
    return AVAILABLE_CATEGORY_ICONS[trimmed]
  }

  // Se corresponder exatamente ao mapa de nomes de categorias
  if (CATEGORY_ICON_MAP[trimmed]) {
    return CATEGORY_ICON_MAP[trimmed]
  }

  const lower = trimmed.toLowerCase()
  const foundKey = Object.keys(CATEGORY_ICON_MAP).find(
    (key) => key.toLowerCase() === lower || lower.includes(key.toLowerCase()),
  )
  return foundKey ? CATEGORY_ICON_MAP[foundKey] : Tag
}
