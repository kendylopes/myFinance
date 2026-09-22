import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  ChevronDown,
  FolderPlus,
  PlusCircle,
  Sparkles,
  Tag,
} from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import {
  type Category,
  type CreateCategoryDTO,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  getCategoryIcon,
} from '../../../domain/models/categories'
import type { CreateTransactionDTO, TransactionType } from '../../../domain/models/transaction'
import { predictCategoryFromDescription } from '../../../domain/services/categoryPredictor'
import { useSpotlight } from '../../hooks/useSpotlight'

interface TransactionFormProps {
  onAdd: (dto: CreateTransactionDTO) => Promise<boolean>
  categories?: Category[]
  onAddCategory?: (dto: CreateCategoryDTO) => Promise<Category | null>
}

export const TransactionForm = ({
  onAdd,
  categories = [],
  onAddCategory,
}: TransactionFormProps) => {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState('Alimentação')
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [hasManualOverride, setHasManualOverride] = useState(false)
  const [autoSuggested, setAutoSuggested] = useState<string | null>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isCreatingNewCategory, setIsCreatingNewCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [isSavingCategory, setIsSavingCategory] = useState(false)
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const formRef = useSpotlight<HTMLElement>()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Lista de categorias filtrada pelo tipo ativo (Receita ou Despesa)
  const currentCategoryList = (() => {
    const listFromProps = categories.filter((c) => c.type === type)
    if (listFromProps.length > 0) {
      return listFromProps
    }
    // Fallback inicial padrão
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

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)

    // Se o usuário ainda não escolheu manualmente uma categoria, sugerir automaticamente
    if (!hasManualOverride && !isCustomCategory) {
      const prediction = predictCategoryFromDescription(newTitle)
      if (prediction) {
        setCategory(prediction.category)
        setAutoSuggested(prediction.category)
        if (prediction.suggestedType && prediction.suggestedType !== type) {
          setType(prediction.suggestedType)
        }
      } else {
        setAutoSuggested(null)
      }
    }
  }

  const handleTypeChange = (newType: TransactionType) => {
    soundFX.playClick()
    setType(newType)
    setIsCustomCategory(false)
    setIsDropdownOpen(false)
    setIsCreatingNewCategory(false)
    setCategory(newType === 'expense' ? 'Alimentação' : 'Salário')
    setHasManualOverride(false)
    setAutoSuggested(null)
  }

  const handleSelectCategory = (categoryName: string) => {
    soundFX.playClick()
    setIsCustomCategory(false)
    setCategory(categoryName)
    setHasManualOverride(true)
    setAutoSuggested(null)
    setIsDropdownOpen(false)
    setIsCreatingNewCategory(false)
  }

  const handleEnableCustom = () => {
    soundFX.playClick()
    setIsCustomCategory(true)
    setCategory('')
    setHasManualOverride(true)
    setAutoSuggested(null)
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
      setCategory(trimmed)
      setIsCustomCategory(false)
      setHasManualOverride(true)
      setAutoSuggested(null)
      setNewCategoryName('')
      setIsCreatingNewCategory(false)
      setIsDropdownOpen(false)
    } catch (err) {
      console.error('Erro ao criar categoria:', err)
    } finally {
      setIsSavingCategory(false)
    }
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsedAmount = Number.parseFloat(amount.replace(',', '.'))
    if (!title.trim()) {
      setFormError('Por favor, informe uma descrição.')
      return
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Informe um valor válido maior que zero.')
      return
    }

    const finalCategory = category.trim() || (type === 'expense' ? 'Alimentação' : 'Salário')

    setIsSubmitting(true)

    const success = await onAdd({
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: finalCategory,
      date,
    })

    setIsSubmitting(false)

    if (success) {
      soundFX.playSuccess()
      setTitle('')
      setAmount('')
      setCategory(type === 'expense' ? 'Alimentação' : 'Salário')
      setIsCustomCategory(false)
      setHasManualOverride(false)
      setAutoSuggested(null)
      setIsDropdownOpen(false)
      setFormError(null)
    }
  }

  return (
    <section
      ref={formRef}
      aria-labelledby="form-title"
      className="glass-card spotlight-card p-6 rounded-3xl space-y-5 relative z-20 overflow-visible"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="form-title" className="text-lg font-bold text-white tracking-tight">
            Nova Movimentação
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Adicione uma receita ou despesa à sua conta
          </p>
        </div>
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
          <PlusCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        </div>
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Linha 1: Tipo de Transação (Receita ou Despesa) */}
        <div>
          <span className="block text-xs font-medium text-zinc-300 mb-2">Tipo de Transação</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              aria-pressed={type === 'expense'}
              onClick={() => handleTypeChange('expense')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-sm shadow-rose-950/30 ring-1 ring-rose-500/30'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/8 hover:text-zinc-200'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />
              <span>Despesa (Para onde vai)</span>
            </button>

            <button
              type="button"
              aria-pressed={type === 'income'}
              onClick={() => handleTypeChange('income')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                type === 'income'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/8 hover:text-zinc-200'
              }`}
            >
              <ArrowUpCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>Receita (De onde vem)</span>
            </button>
          </div>
        </div>

        {/* Linha 2: Descrição */}
        <div>
          <label htmlFor="tx-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Descrição
          </label>
          <input
            id="tx-title"
            data-testid="input-title"
            type="text"
            required
            placeholder={
              type === 'expense'
                ? 'Ex: Supermercado, Aluguel, Cinema...'
                : 'Ex: Salário da Empresa, Dividendos...'
            }
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500"
          />
        </div>

        {/* Linha 3: Valor e Data em 2 Colunas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Valor */}
          <div>
            <label htmlFor="tx-amount" className="block text-xs font-medium text-zinc-300 mb-1.5">
              Valor (R$)
            </label>
            <input
              id="tx-amount"
              data-testid="input-amount"
              type="text"
              inputMode="decimal"
              required
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500"
            />
          </div>

          {/* Data */}
          <div>
            <label
              htmlFor="tx-date"
              className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
              Data
            </label>
            <input
              id="tx-date"
              data-testid="input-date"
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        {/* Linha 4: Categoria com Dropdown Personalizável */}
        <div ref={dropdownRef} className="relative z-40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                <Tag className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                <span>
                  {type === 'expense'
                    ? 'Categoria de Saída (Para onde vai)'
                    : 'Categoria de Entrada (De onde vem)'}
                </span>
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
            aria-haspopup="true"
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
                      onClick={() => handleSelectCategory(item.name)}
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
                      <span>
                        + Criar nova categoria de {type === 'expense' ? 'Saída' : 'Entrada'}
                      </span>
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
                    onClick={handleEnableCustom}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isCustomCategory
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'text-zinc-400 hover:bg-white/8 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" aria-hidden="true" />
                      <span>Digitar avulsa no campo...</span>
                    </div>
                    {isCustomCategory && <Check className="w-4 h-4" aria-hidden="true" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Campo de Texto para Categoria Avulsa */}
          {isCustomCategory && (
            <div className="mt-2">
              <input
                id="tx-category"
                data-testid="input-category"
                type="text"
                placeholder="Digite o nome da categoria personalizada..."
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500 border-amber-500/40 focus:border-amber-400"
              />
            </div>
          )}

          {/* Input oculto para retrocompatibilidade com formulários e testes */}
          {!isCustomCategory && (
            <input
              type="hidden"
              id="tx-category"
              data-testid="input-category"
              value={category}
              readOnly
            />
          )}
        </div>

        {/* Linha 5: Botão de Envio com Laser Shimmer */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 relative overflow-hidden bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 disabled:opacity-50 text-zinc-950 font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer group"
        >
          {/* Brilho Laser Translúcido */}
          <div
            aria-hidden="true"
            className="absolute inset-0 w-24 bg-linear-to-r from-transparent via-white/35 to-transparent animate-shimmer-sweep pointer-events-none"
          />
          <PlusCircle className="w-5 h-5 relative z-10" aria-hidden="true" />
          <span className="relative z-10">
            {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
          </span>
        </button>
      </form>
    </section>
  )
}
