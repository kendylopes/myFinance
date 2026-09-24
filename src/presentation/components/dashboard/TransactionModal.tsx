import { useEffect } from 'react'
import type { Category, CreateCategoryDTO } from '../../../domain/models/categories'
import type {
  CreateTransactionDTO,
  Transaction,
  TransactionType,
} from '../../../domain/models/transaction'
import { TransactionForm } from './TransactionForm'

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (dto: CreateTransactionDTO) => Promise<boolean>
  onEdit?: (id: string, dto: Partial<CreateTransactionDTO>) => Promise<boolean>
  transactionToEdit?: Transaction | null
  categories?: Category[]
  onAddCategory?: (dto: CreateCategoryDTO) => Promise<Category | null>
  initialType?: TransactionType
}

export function TransactionModal({
  isOpen,
  onClose,
  onAdd,
  onEdit,
  transactionToEdit,
  categories = [],
  onAddCategory,
  initialType = 'expense',
}: TransactionModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="form-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      {/* Backdrop com Blur suave */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Conteúdo do Modal */}
      <div className="relative z-10 w-full max-w-xl my-auto animate-scale-in">
        <TransactionForm
          onAdd={onAdd}
          onEdit={onEdit}
          transactionToEdit={transactionToEdit}
          categories={categories}
          onAddCategory={onAddCategory}
          initialType={initialType}
          onSuccess={onClose}
          onCancel={onClose}
          isModal={true}
        />
      </div>
    </div>
  )
}
