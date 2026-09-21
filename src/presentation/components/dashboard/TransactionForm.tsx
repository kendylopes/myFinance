import { ArrowDownCircle, ArrowUpCircle, Calendar, PlusCircle, Tag } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import type { CreateTransactionDTO, TransactionType } from '../../../domain/models/transaction'
import { useSpotlight } from '../../hooks/useSpotlight'

interface TransactionFormProps {
  onAdd: (dto: CreateTransactionDTO) => Promise<boolean>
}

export const TransactionForm = ({ onAdd }: TransactionFormProps) => {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<TransactionType>('expense')
  const [category, setCategory] = useState('Geral')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const formRef = useSpotlight<HTMLElement>()

  const handleTypeChange = (newType: TransactionType) => {
    soundFX.playClick()
    setType(newType)
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

    setIsSubmitting(true)

    const success = await onAdd({
      title: title.trim(),
      amount: parsedAmount,
      type,
      category: category.trim() || 'Geral',
      date,
    })

    setIsSubmitting(false)

    if (success) {
      soundFX.playSuccess()
      setTitle('')
      setAmount('')
      setCategory('Geral')
      setFormError(null)
    }
  }

  return (
    <section
      ref={formRef}
      aria-labelledby="form-title"
      className="glass-card spotlight-card p-6 rounded-3xl space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-white/8 pb-3">
        <PlusCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        <h2 id="form-title" className="text-lg font-semibold text-white drop-shadow-sm">
          Nova Transação
        </h2>
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center justify-between"
        >
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo: Entrada vs Saída */}
        <fieldset className="grid grid-cols-2 gap-3" aria-label="Tipo de Transação">
          <button
            type="button"
            data-testid="type-income"
            onClick={() => handleTypeChange('income')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                : 'glass-pill text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
            Entrada
          </button>
          <button
            type="button"
            data-testid="type-expense"
            onClick={() => handleTypeChange('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 cursor-pointer ${
              type === 'expense'
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-sm'
                : 'glass-pill text-zinc-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-rose-400" aria-hidden="true" />
            Saída
          </button>
        </fieldset>

        {/* Descrição */}
        <div>
          <label htmlFor="tx-title" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Descrição
          </label>
          <input
            id="tx-title"
            data-testid="input-title"
            type="text"
            placeholder="Ex: Salário, Mercado..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500"
          />
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="tx-amount" className="block text-xs font-medium text-zinc-300 mb-1.5">
            Valor (R$)
          </label>
          <input
            id="tx-amount"
            data-testid="input-amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full glass-input rounded-xl px-3.5 py-2.5 text-sm placeholder:text-zinc-500"
          />
        </div>

        {/* Categoria */}
        <div>
          <label
            htmlFor="tx-category"
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1.5"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
            Categoria
          </label>
          <input
            id="tx-category"
            data-testid="input-category"
            type="text"
            placeholder="Ex: Alimentação, Lazer..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
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

        {/* Botão de Envio com Laser Shimmer */}
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
