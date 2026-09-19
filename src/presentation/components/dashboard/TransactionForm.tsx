import { ArrowDownCircle, ArrowUpCircle, Calendar, PlusCircle, Tag } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { CreateTransactionDTO, TransactionType } from '../../../domain/models/transaction'

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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)

    const parsedAmount = parseFloat(amount.replace(',', '.'))
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
      setTitle('')
      setAmount('')
      setCategory('Geral')
      setFormError(null)
    }
  }

  return (
    <section
      aria-labelledby="form-title"
      className="bg-slate-900/60 border border-slate-800/80 p-6 rounded-2xl shadow-sm space-y-5"
    >
      <div className="flex items-center gap-2 border-b border-slate-800/60 pb-3">
        <PlusCircle className="w-5 h-5 text-emerald-400" aria-hidden="true" />
        <h2 id="form-title" className="text-lg font-semibold text-white">
          Nova Transação
        </h2>
      </div>

      {formError && (
        <div
          role="alert"
          className="p-3 text-xs bg-rose-950/50 border border-rose-800/50 text-rose-300 rounded-xl"
        >
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Tipo: Entrada ou Saída */}
        <fieldset className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <legend className="sr-only">Tipo de transação</legend>
          <button
            type="button"
            data-testid="type-income-btn"
            onClick={() => setType('income')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" aria-hidden="true" />
            Entrada
          </button>
          <button
            type="button"
            data-testid="type-expense-btn"
            onClick={() => setType('expense')}
            className={`flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              type === 'expense'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" aria-hidden="true" />
            Saída
          </button>
        </fieldset>

        {/* Descrição */}
        <div>
          <label htmlFor="tx-title" className="block text-xs font-medium text-slate-400 mb-1.5">
            Descrição
          </label>
          <input
            id="tx-title"
            data-testid="input-title"
            type="text"
            required
            placeholder="Ex: Almoço, Salário, Freelance..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Valor */}
        <div>
          <label htmlFor="tx-amount" className="block text-xs font-medium text-slate-400 mb-1.5">
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
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Categoria */}
        <div>
          <label
            htmlFor="tx-category"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5"
          >
            <Tag className="w-3.5 h-3.5" aria-hidden="true" />
            Categoria
          </label>
          <input
            id="tx-category"
            data-testid="input-category"
            type="text"
            placeholder="Ex: Alimentação, Lazer..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Data */}
        <div>
          <label
            htmlFor="tx-date"
            className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-1.5"
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            Data
          </label>
          <input
            id="tx-date"
            data-testid="input-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" aria-hidden="true" />
          {isSubmitting ? 'Registrando...' : 'Registrar Movimentação'}
        </button>
      </form>
    </section>
  )
}
