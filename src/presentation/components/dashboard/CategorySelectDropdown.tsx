import { Check, ChevronDown, FolderPlus, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import {
  type Category,
  type CreateCategoryDTO,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  getCategoryIcon,
} from '../../../domain/models/categories'
import type { TransactionType } from '../../../domain/models/transaction'

export interface CategorySelectDropdownProps {
  category: string
  onSelectCategory: (categoryName: string) => void
  type: TransactionType
  categories?: Category[]
  onAddCategory?: (dto: CreateCategoryDTO) => Promise<Category | null>
  isCustomCategory: boolean
  onEnableCustom: () => void
  autoSuggested?: string | null
}

export function CategorySelectDropdown({
  category,
  onSelectCategory,
  type,
  categories = [],
  onAddCategory,
  isCustomCategory,
  onEnableCustom,
  autoSuggested,
}: CategorySelectDropdownProps) {
  const toast = useToast()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lista de categorias filtrada pelo tipo ativo (Receita ou Despesa)
  const currentCategoryList = (() => {
    const listFromProps = categories.filter((c) => c.type === type)
    if (listFromProps.length > 0) {
      return listFromProps
    }
    const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES
    return defaults.map((d) => ({
      id: d.id,
      name: d.name,
      type,
      icon: d.icon,
      isCustom: false,
    }))
  })()

  const CurrentIcon = getCategoryIcon(category)

  // Fechar o dropdown ao clicar fora ou apertar Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false)
        setIsCreatingNewCategory(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false)
        setIsCreatingNewCategory(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const handleSelect = (categoryName: string) => {
    onSelectCategory(categoryName)
    setIsDropdownOpen(false)
    setIsCreatingNewCategory(false)
  }

  const handleCustomClick = () => {
    onEnableCustom()
    setIsDropdownOpen(false)
    setIsCreatingNewCategory(false)
  }

  const handleCreateCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const trimmed = newCategoryName.trim()
    if (!trimmed) return

    setIsSavingCategory(true)
    try {
      if (onAddCategory) {
        await onAddCategory({
          name: trimmed,
          type,
          icon: 'Tag',
        })
      }
      soundFX.playSuccess()
      toast.success(
        'Categoria criada!',
        `A categoria "${trimmed}" já está disponível para suas movimentações.`,
      )
      onSelectCategory(trimmed)
      setNewCategoryName('')
      setIsCreatingNewCategory(false)
      setIsDropdownOpen(false)
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
    } finally {
      setIsSavingCategory(false)
    }
  }

  return (
    <div className="space-y-1.5 relative" ref={dropdownRef}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-300">
            Categoria <span className="text-rose-400">*</span>
          </span>
          {autoSuggested && !isCustomCategory && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-300 font-semibold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full animate-fade-in shadow-xs">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" aria-hidden="true" />
              Sugerido
            </span>
          )}
        </div>
        <span className="text-[11px] text-zinc-400">
          {type === 'expense' ? 'Despesa' : 'Receita'}
        </span>
      </div>

      {/* Botão Seletor Principal */}
      <button
        id="category-select-btn"
        data-testid="category-select-btn"
        type="button"
        onClick={() => {
          soundFX.playClick()
          setIsDropdownOpen(!isDropdownOpen)
        }}
        aria-expanded={isDropdownOpen}
        aria-haspopup="listbox"
        aria-label={`Categoria selecionada: ${category}`}
        className={`w-full glass-input rounded-xl px-3.5 py-2.5 text-sm flex items-center justify-between text-left cursor-pointer transition-all ${
          isDropdownOpen
            ? 'border-emerald-500/70 ring-2 ring-emerald-500/20'
            : 'hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <div
            className={`p-1.5 rounded-lg ${
              type === 'expense'
                ? 'bg-rose-500/15 text-rose-300'
                : 'bg-emerald-500/15 text-emerald-300'
            }`}
          >
            {isCustomCategory ? (
              <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
            ) : (
              <CurrentIcon className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <span className="text-white font-medium">
            {isCustomCategory ? category || 'Personalizada (digite abaixo)...' : category}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
            isDropdownOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Menu Flutuante: Lista de Categorias + Nova Categoria */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-[#16171b] border border-white/15 rounded-2xl p-2 shadow-[0_25px_60px_rgba(0,0,0,0.95)] max-h-80 overflow-y-auto custom-scrollbar">
          <div className="space-y-1">
            {/* Categorias Padrão e Personalizadas */}
            {currentCategoryList.map((item) => {
              const ItemIcon = getCategoryIcon(item.icon || item.name)
              const isSelected = !isCustomCategory && category === item.name

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isSelected
                      ? type === 'expense'
                        ? 'bg-rose-500/20 text-rose-200 font-semibold border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-200 font-semibold border border-emerald-500/40'
                      : 'text-zinc-300 hover:bg-white/8 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <ItemIcon className="w-4 h-4 opacity-80 shrink-0" aria-hidden="true" />
                    <span className="truncate">{item.name}</span>
                    {item.isCustom && (
                      <span className="text-[10px] bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-1.5 py-0.5 rounded-md font-mono">
                        Sua
                      </span>
                    )}
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" aria-hidden="true" />}
                </button>
              )
            })}

            {/* Bloco de Criação de Nova Categoria */}
            <div className="pt-2 mt-1 border-t border-white/10 space-y-1.5">
              {!isCreatingNewCategory ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFX.playClick()
                    setIsCreatingNewCategory(true)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all cursor-pointer"
                >
                  <FolderPlus className="w-4 h-4" aria-hidden="true" />
                  <span>+ Criar nova categoria de {type === 'expense' ? 'Saída' : 'Entrada'}</span>
                </button>
              ) : (
                <div className="p-2 bg-white/5 border border-emerald-500/30 rounded-xl space-y-2 animate-fade-in">
                  <div className="text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5">
                    <FolderPlus className="w-3.5 h-3.5" />
                    <span>Nova Categoria de {type === 'expense' ? 'Saída' : 'Entrada'}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Ex: Dividendos, Pet Shop, etc."
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCreateCategorySubmit(e)
                      }
                    }}
                    className="w-full glass-input rounded-lg px-2.5 py-1.5 text-xs placeholder:text-zinc-500 border-white/20 focus:border-emerald-400"
                  />
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCreatingNewCategory(false)
                        setNewCategoryName('')
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={!newCategoryName.trim() || isSavingCategory}
                      onClick={handleCreateCategorySubmit}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isSavingCategory ? 'Salvando...' : 'Salvar Categoria'}
                    </button>
                  </div>
                </div>
              )}

              {/* Opção para digitar uma categoria avulsa */}
              <button
                type="button"
                onClick={handleCustomClick}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  isCustomCategory
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-zinc-400 hover:bg-white/8 hover:text-zinc-200'
                }`}
              >
                <span>Outra categoria personalizada...</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
