import { FolderPlus, Search, Sparkles, TrendingDown, TrendingUp, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { useToast } from '../../../core/toast/toastContext'
import type { Category, CategoryType, CreateCategoryDTO } from '../../../domain/models/categories'
import { AVAILABLE_CATEGORY_ICONS } from './categoryIcons'

export interface CategoryCreateModalProps {
  isOpen: boolean
  onClose: () => void
  existingCategories: Category[]
  onAddCategory: (dto: CreateCategoryDTO) => Promise<Category | null>
  initialType?: CategoryType
}

export function CategoryCreateModal({
  isOpen,
  onClose,
  existingCategories,
  onAddCategory,
  initialType = 'expense',
}: CategoryCreateModalProps) {
  const { currentTheme } = useTheme()
  const toast = useToast()

  const [name, setName] = useState('')
  const [type, setType] = useState<CategoryType>(initialType)
  const [selectedIconName, setSelectedIconName] = useState('Tag')
  const [iconSearch, setIconSearch] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Resetar campos ao abrir o modal
  useEffect(() => {
    if (isOpen) {
      setName('')
      setType(initialType)
      setSelectedIconName(initialType === 'expense' ? 'ShoppingBag' : 'TrendingUp')
      setIconSearch('')
      setErrorMessage(null)
      setIsSubmitting(false)
    }
  }, [isOpen, initialType])

  // Fechar com tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Filtragem dos ícones disponíveis
  const filteredIcons = useMemo(() => {
    const searchLower = iconSearch.trim().toLowerCase()
    return Object.entries(AVAILABLE_CATEGORY_ICONS).filter(([iconKey]) => {
      if (!searchLower) return true
      return iconKey.toLowerCase().includes(searchLower)
    })
  }, [iconSearch])

  if (!isOpen) return null

  const SelectedIconComponent =
    AVAILABLE_CATEGORY_ICONS[selectedIconName] || AVAILABLE_CATEGORY_ICONS.Tag

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const trimmedName = name.trim()
    if (!trimmedName) {
      setErrorMessage('Digite o nome da categoria.')
      soundFX.playError?.()
      return
    }

    // Verifica duplicação de nome dentro do mesmo tipo
    const alreadyExists = existingCategories.some(
      (c) => c.type === type && c.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (alreadyExists) {
      setErrorMessage(
        `Já existe uma categoria de ${type === 'expense' ? 'despesa' : 'receita'} com o nome "${trimmedName}".`,
      )
      soundFX.playError?.()
      return
    }

    setIsSubmitting(true)

    try {
      const created = await onAddCategory({
        name: trimmedName,
        type,
        icon: selectedIconName,
      })

      if (created) {
        soundFX.playSuccess()
        toast.success(
          'Categoria Criada!',
          `A categoria "${trimmedName}" foi adicionada com sucesso.`,
        )
        onClose()
      } else {
        setErrorMessage('Não foi possível salvar a categoria. Tente novamente.')
        soundFX.playError?.()
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao cadastrar categoria.')
      soundFX.playError?.()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop com Blur */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 w-full max-w-lg my-auto animate-scale-in glass-card border border-white/20 p-5 sm:p-7 rounded-3xl shadow-2xl shadow-black/70 space-y-5">
        {/* Topo: Título & Botão Fechar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="category-modal-title"
                className="text-base sm:text-lg font-bold text-white tracking-tight"
              >
                Nova Categoria
              </h2>
              <p className="text-xs text-zinc-400">
                Personalize suas finanças com ícones e identificação única
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
            aria-label="Fechar modal de nova categoria"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mensagem de Erro */}
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="font-semibold">Aviso:</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Nome da Categoria */}
          <div className="space-y-1.5">
            <label htmlFor="cat-name-input" className="text-xs font-semibold text-zinc-300 block">
              Nome da Categoria
            </label>
            <input
              id="cat-name-input"
              data-testid="input-category-name"
              type="text"
              required
              maxLength={40}
              placeholder="Ex: Streaming, Pet Shop, Cursos, Academia..."
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errorMessage) setErrorMessage(null)
              }}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500 border-white/10 focus:border-emerald-500 transition-all text-white"
            />
          </div>

          {/* 2. Tipo: Despesa ou Receita */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-zinc-300 block">Tipo de Movimentação</span>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/4 border border-white/10 text-xs font-semibold">
              <button
                type="button"
                data-testid="cat-type-expense"
                onClick={() => {
                  soundFX.playClick()
                  setType('expense')
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  type === 'expense'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Despesa (Saída)</span>
              </button>

              <button
                type="button"
                data-testid="cat-type-income"
                onClick={() => {
                  soundFX.playClick()
                  setType('income')
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl transition-all cursor-pointer ${
                  type === 'income'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-xs font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Receita (Entrada)</span>
              </button>
            </div>
          </div>

          {/* 3. Seletor de Ícones */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="cat-icon-search" className="text-xs font-semibold text-zinc-300">
                Ícone Representativo
              </label>
              <div className="relative w-36">
                <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2" />
                <input
                  id="cat-icon-search"
                  type="text"
                  placeholder="Buscar ícone..."
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg pl-6 pr-2 py-1 text-[11px] text-white placeholder:text-zinc-500 focus:outline-hidden focus:border-white/30"
                />
              </div>
            </div>

            {/* Grid de Ícones Rolável */}
            <div
              data-testid="icon-picker-grid"
              className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2.5 rounded-2xl bg-white/3 border border-white/8 max-h-36 overflow-y-auto custom-scrollbar"
            >
              {filteredIcons.map(([iconKey, IconComp]) => {
                const isSelected = selectedIconName === iconKey
                return (
                  <button
                    key={iconKey}
                    type="button"
                    title={iconKey}
                    onClick={() => {
                      soundFX.playClick()
                      setSelectedIconName(iconKey)
                    }}
                    className={`flex items-center justify-center p-2 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm scale-110'
                        : 'border-white/5 bg-white/2 text-zinc-400 hover:text-white hover:bg-white/8 hover:border-white/20'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* 4. Pré-visualização ao Vivo */}
          <div className="p-3 rounded-2xl bg-white/4 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border flex items-center justify-center ${
                  type === 'expense'
                    ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                    : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                }`}
              >
                <SelectedIconComponent className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-white block">
                  {name.trim() || 'Nome da Categoria'}
                </span>
                <span className="text-2xs text-zinc-400">
                  {type === 'expense' ? 'Despesa' : 'Receita'} • Ícone: {selectedIconName}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-md text-2xs font-bold bg-white/10 text-zinc-300 border border-white/15">
              Personalizada
            </span>
          </div>

          {/* Rodapé: Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              data-testid="btn-submit-category"
              disabled={isSubmitting || !name.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-zinc-950 shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
              style={{
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Salvar Categoria</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
