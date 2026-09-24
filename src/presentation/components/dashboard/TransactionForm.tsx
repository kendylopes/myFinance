import { ArrowDownCircle, ArrowUpCircle, Calendar, Pencil, PlusCircle, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Category, CreateCategoryDTO } from '../../../domain/models/categories'
import type {
  CreateTransactionDTO,
  Transaction,
  TransactionType,
} from '../../../domain/models/transaction'
import { predictCategoryFromDescription } from '../../../domain/services/categoryPredictor'
import { useSpotlight } from '../../hooks/useSpotlight'
import { CategorySelectDropdown } from './CategorySelectDropdown'

interface TransactionFormProps {
  onAdd: (dto: CreateTransactionDTO) => Promise<boolean>
  onEdit?: (id: string, dto: Partial<CreateTransactionDTO>) => Promise<boolean>
  transactionToEdit?: Transaction | null
  categories?: Category[]
  onAddCategory?: (dto: CreateCategoryDTO) => Promise<Category | null>
  initialType?: TransactionType
  onSuccess?: () => void
  onCancel?: () => void
  isModal?: boolean
}

export const TransactionForm = ({
  onAdd,
  onEdit,
  transactionToEdit,
  categories = [],
  onAddCategory,
  initialType,
  onSuccess,
  onCancel,
  isModal = false,
}: TransactionFormProps) => {
  const { currentCurrency } = useCurrency()
  const [title, setTitle] = useState(transactionToEdit?.title || '')
  const [amount, setAmount] = useState(transactionToEdit ? String(transactionToEdit.amount) : '')
  const [type, setType] = useState<TransactionType>(
    transactionToEdit?.type || initialType || 'expense',
  )
  const [category, setCategory] = useState(
    transactionToEdit?.category || (initialType === 'income' ? 'Salário' : 'Alimentação'),
  )
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [hasManualOverride, setHasManualOverride] = useState(Boolean(transactionToEdit))
  const [autoSuggested, setAutoSuggested] = useState<string | null>(null)
  const [date, setDate] = useState(
    transactionToEdit?.date || new Date().toISOString().split('T')[0],
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const formRef = useSpotlight<HTMLElement>()

  // Reage à alteração de transactionToEdit
  useEffect(() => {
    if (transactionToEdit) {
      setTitle(transactionToEdit.title)
      setAmount(String(transactionToEdit.amount))
      setType(transactionToEdit.type)
      setCategory(transactionToEdit.category)
      setDate(transactionToEdit.date)
      setHasManualOverride(true)
      setIsCustomCategory(false)
      setAutoSuggested(null)
    }
  }, [transactionToEdit])

  // Reage à alteração de initialType (ao reabrir modal ou alternar botões)
  useEffect(() => {
    if (!transactionToEdit && initialType) {
      setType(initialType)
      if (!hasManualOverride) {
        setCategory(initialType === 'income' ? 'Salário' : 'Alimentação')
      }
    }
  }, [initialType, hasManualOverride, transactionToEdit])

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
  }

  const handleEnableCustom = () => {
    soundFX.playClick()
    setIsCustomCategory(true)
    setCategory('')
    setHasManualOverride(true)
    setAutoSuggested(null)
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

    let success = false
    if (transactionToEdit && onEdit) {
      success = await onEdit(transactionToEdit.id, {
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: finalCategory,
        date,
      })
    } else {
      success = await onAdd({
        title: title.trim(),
        amount: parsedAmount,
        type,
        category: finalCategory,
        date,
      })
    }

    setIsSubmitting(false)

    if (success) {
      soundFX.playSuccess()
      if (!transactionToEdit) {
        setTitle('')
        setAmount('')
        setCategory(type === 'expense' ? 'Alimentação' : 'Salário')
        setIsCustomCategory(false)
        setHasManualOverride(false)
        setAutoSuggested(null)
      }
      setFormError(null)
      onSuccess?.()
    }
  }

  return (
    <section
      ref={formRef}
      aria-labelledby="form-title"
      className={`${
        isModal ? 'glass-card border border-white/20 shadow-2xl shadow-black/60' : 'glass-card'
      } spotlight-card p-6 rounded-3xl space-y-5 relative z-20 overflow-visible`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 id="form-title" className="text-lg font-bold text-white tracking-tight">
            {transactionToEdit ? 'Editar Transação' : 'Nova Transação'}
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            {transactionToEdit
              ? 'Atualize os dados desta transação financeira'
              : 'Adicione uma receita ou despesa à sua conta'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            {transactionToEdit ? (
              <Pencil className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            ) : (
              <PlusCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
            )}
          </div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fechar formulário"
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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
              Valor ({currentCurrency.symbol})
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

        {/* Linha 4: Categoria com Dropdown Personalizável Modularizado */}
        <div className="relative z-40">
          <CategorySelectDropdown
            category={category}
            onSelectCategory={handleSelectCategory}
            type={type}
            categories={categories}
            onAddCategory={onAddCategory}
            isCustomCategory={isCustomCategory}
            onEnableCustom={handleEnableCustom}
            autoSuggested={autoSuggested}
          />

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
          {transactionToEdit ? (
            <Pencil className="w-5 h-5 relative z-10" aria-hidden="true" />
          ) : (
            <PlusCircle className="w-5 h-5 relative z-10" aria-hidden="true" />
          )}
          <span className="relative z-10">
            {isSubmitting
              ? transactionToEdit
                ? 'Salvando alterações...'
                : 'Registrando...'
              : transactionToEdit
                ? 'Salvar Alterações'
                : 'Registrar Transação'}
          </span>
        </button>
      </form>
    </section>
  )
}
