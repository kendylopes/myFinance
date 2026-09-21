/**
 * Categorias padronizadas do myFinance para receitas e despesas.
 * Utilizadas para sugestões rápidas, consistência em gráficos e futura automação com IA.
 */

import {
  Briefcase,
  Car,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  type LucideIcon,
  Receipt,
  ShoppingBag,
  Tag,
  TrendingUp,
  Utensils,
} from 'lucide-react'

export interface PredefinedCategory {
  id: string
  name: string
  icon: string // Identificador do ícone
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
 * Retorna o ícone do Lucide apropriado para o nome da categoria.
 * Suporta busca exata ou normalizada para categorias personalizadas.
 */
export function getCategoryIcon(categoryName: string): LucideIcon {
  if (!categoryName) return Tag
  const trimmed = categoryName.trim()
  if (CATEGORY_ICON_MAP[trimmed]) {
    return CATEGORY_ICON_MAP[trimmed]
  }

  const lower = trimmed.toLowerCase()
  const foundKey = Object.keys(CATEGORY_ICON_MAP).find(
    (key) => key.toLowerCase() === lower || lower.includes(key.toLowerCase()),
  )
  return foundKey ? CATEGORY_ICON_MAP[foundKey] : Tag
}
