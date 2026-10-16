import {
  Baby,
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dog,
  Dumbbell,
  Film,
  Gift,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  type LucideIcon,
  Music,
  PiggyBank,
  Plane,
  Receipt,
  Shield,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Tag,
  TrendingUp,
  Tv,
  Utensils,
  Wrench,
  Zap,
} from 'lucide-react'

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
  CreditCard,
  PiggyBank,
  Smartphone,
  BookOpen,
  Dumbbell,
  Music,
  Heart,
  Tv,
  Baby,
  Dog,
  Wrench,
}

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
