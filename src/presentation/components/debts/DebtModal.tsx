import { Calendar, DollarSign, Percent, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLocalDateString } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { useToast } from '../../../core/toast/toastContext'
import type { CreateDebtDTO, Debt, DebtInterestType } from '../../../domain/models/debt'

interface DebtModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateDebtDTO) => Promise<unknown>
  initialData?: Debt | null
}

export function DebtModal({ isOpen, onClose, onSave, initialData }: DebtModalProps) {
  const { currentTheme } = useTheme()
  const toast = useToast()

  const [lenderName, setLenderName] = useState('')
  const [description, setDescription] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [currentBalance, setCurrentBalance] = useState('')
  const [interestType, setInterestType] = useState<DebtInterestType>('monthly')
  const [interestRate, setInterestRate] = useState('')
  const [fixedInterestAmount, setFixedInterestAmount] = useState('')
  const [startDate, setStartDate] = useState(getLocalDateString())
  const [dueDate, setDueDate] = useState('')
  const [hasInstallments, setHasInstallments] = useState(false)
  const [totalInstallments, setTotalInstallments] = useState('')
  const [installmentAmount, setInstallmentAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Preenche dados ao abrir para edição ou zera para criação
  useEffect(() => {
    if (initialData) {
      setLenderName(initialData.lenderName)
      setDescription(initialData.description || '')
      setOriginalAmount(String(initialData.originalAmount))
      setCurrentBalance(String(initialData.currentBalance))
      setInterestType(initialData.interestType)
      setInterestRate(String(initialData.interestRate || ''))
      setFixedInterestAmount(
        initialData.fixedInterestAmount ? String(initialData.fixedInterestAmount) : '',
      )
      setStartDate(initialData.startDate)
      setDueDate(initialData.dueDate)
      setHasInstallments(!!initialData.totalInstallments && initialData.totalInstallments > 1)
      setTotalInstallments(
        initialData.totalInstallments ? String(initialData.totalInstallments) : '',
      )
      setInstallmentAmount(
        initialData.installmentAmount ? String(initialData.installmentAmount) : '',
      )
      setNotes(initialData.notes || '')
    } else {
      const today = getLocalDateString()
      // Sugere vencimento daqui a 30 dias
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 30)
      const nextMonthStr = nextMonth.toISOString().split('T')[0]

      setLenderName('')
      setDescription('')
      setOriginalAmount('')
      setCurrentBalance('')
      setInterestType('monthly')
      setInterestRate('10')
      setFixedInterestAmount('')
      setStartDate(today)
      setDueDate(nextMonthStr)
      setHasInstallments(false)
      setTotalInstallments('')
      setInstallmentAmount('')
      setNotes('')
    }
  }, [initialData])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lenderName.trim()) {
      toast.error('Campo obrigatório', 'Informe o nome do credor ou contato.')
      return
    }

    const origNum = Number.parseFloat(originalAmount.replace(',', '.'))
    if (!origNum || origNum <= 0) {
      toast.error('Valor inválido', 'Informe um valor original válido maior que zero.')
      return
    }

    if (!dueDate) {
      toast.error('Data obrigatória', 'Informe a data de vencimento.')
      return
    }

    const currentBalNum = currentBalance.trim()
      ? Number.parseFloat(currentBalance.replace(',', '.'))
      : origNum

    const rateNum = interestRate.trim() ? Number.parseFloat(interestRate.replace(',', '.')) : 0

    const fixedNum = fixedInterestAmount.trim()
      ? Number.parseFloat(fixedInterestAmount.replace(',', '.'))
      : undefined

    const totalInstNum =
      hasInstallments && totalInstallments.trim()
        ? Number.parseInt(totalInstallments, 10)
        : undefined

    const instAmtNum =
      hasInstallments && installmentAmount.trim()
        ? Number.parseFloat(installmentAmount.replace(',', '.'))
        : undefined

    try {
      setIsSubmitting(true)
      await onSave({
        lenderName: lenderName.trim(),
        description: description.trim() || undefined,
        originalAmount: origNum,
        currentBalance: currentBalNum,
        interestRate: rateNum,
        interestType,
        fixedInterestAmount: fixedNum,
        startDate,
        dueDate,
        totalInstallments: totalInstNum,
        installmentAmount: instAmtNum,
        notes: notes.trim() || undefined,
      })

      soundFX.playSuccess()
      toast.success(
        initialData ? 'Dívida atualizada!' : 'Dívida registrada!',
        initialData
          ? 'As informações do empréstimo foram salvas.'
          : 'Novo compromisso adicionado ao seu controle.',
      )
      onClose()
    } catch {
      toast.error('Erro ao salvar', 'Não foi possível registrar os dados da dívida.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 glass-card p-6 shadow-2xl relative"
        style={{
          boxShadow: `0 20px 50px -10px ${currentTheme.primaryColor}20`,
        }}
      >
        {/* Header do Modal */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: currentTheme.primaryColor }}
              />
              {initialData ? 'Editar Dívida / Empréstimo' : 'Novo Empréstimo / Dívida'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Controle de agiotas, empréstimos pessoais e rolagem de juros
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onClose()
            }}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Nome do Credor e Descrição */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="lenderName"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Credor / Contato *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="lenderName"
                  type="text"
                  required
                  placeholder="Ex: Agiota Zé, Carlos, Banco..."
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Motivo / Identificador
              </label>
              <input
                id="description"
                type="text"
                placeholder="Ex: Emergência, Reforma, Carro..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Valores: Original e Saldo Atual */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="originalAmount"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Valor Pego Emprestado (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="originalAmount"
                  type="text"
                  required
                  placeholder="0,00"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="currentBalance"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Saldo Devedor Atual (R$)
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="currentBalance"
                  type="text"
                  placeholder="Mesmo do valor original"
                  value={currentBalance}
                  onChange={(e) => setCurrentBalance(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Juros: Tipo e Taxa */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
            <span className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Regra de Juros Combinada
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setInterestType('monthly')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  interestType === 'monthly'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                % Ao Mês
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setInterestType('daily')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  interestType === 'daily'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                % Ao Dia (Mora)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setInterestType('fixed')
                }}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  interestType === 'fixed'
                    ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300 font-semibold'
                    : 'border-white/10 bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                Valor Fixo (R$)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {interestType !== 'fixed' ? (
                <div>
                  <label
                    htmlFor="interestRate"
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Taxa de Juros (%)
                  </label>
                  <div className="relative">
                    <Percent className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      id="interestRate"
                      type="text"
                      placeholder="Ex: 10, 15, 20"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="fixedInterestAmount"
                    className="block text-xs font-medium text-zinc-400 mb-1"
                  >
                    Juro Fixo Mensal (R$)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                    <input
                      id="fixedInterestAmount"
                      type="text"
                      placeholder="Ex: 300,00"
                      value={fixedInterestAmount}
                      onChange={(e) => setFixedInterestAmount(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Prévia do cálculo do juro por vencimento */}
              <div className="flex flex-col justify-center px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-emerald-400">
                  Custo para Rolar (Só Juros):
                </span>
                <span className="text-sm font-bold font-mono mt-0.5">
                  {(() => {
                    const bal =
                      Number.parseFloat(currentBalance.replace(',', '.')) ||
                      Number.parseFloat(originalAmount.replace(',', '.')) ||
                      0
                    if (interestType === 'fixed') {
                      const fixVal = Number.parseFloat(fixedInterestAmount.replace(',', '.')) || 0
                      return `R$ ${fixVal.toFixed(2)}`
                    }
                    const rate = Number.parseFloat(interestRate.replace(',', '.')) || 0
                    const val = (bal * rate) / 100
                    return `R$ ${val.toFixed(2)} / mês`
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Datas: Início e Próximo Vencimento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="startDate"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Data do Empréstimo
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dueDate"
                className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5"
              >
                Próximo Vencimento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-3.5" />
                <input
                  id="dueDate"
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-sm focus:outline-none focus:border-amber-400 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Parcelamento Opcional */}
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={hasInstallments}
                onChange={(e) => setHasInstallments(e.target.checked)}
                className="rounded border-zinc-700 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
              />
              <span>Dívida combinada em parcelas fixas</span>
            </label>

            {hasInstallments && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fade-in">
                <div>
                  <label
                    htmlFor="totalInstallments"
                    className="block text-[11px] font-medium text-zinc-400 mb-1"
                  >
                    Total de Parcelas
                  </label>
                  <input
                    id="totalInstallments"
                    type="number"
                    min="1"
                    placeholder="Ex: 5"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="installmentAmount"
                    className="block text-[11px] font-medium text-zinc-400 mb-1"
                  >
                    Valor de Cada Parcela (R$)
                  </label>
                  <input
                    id="installmentAmount"
                    type="text"
                    placeholder="Ex: 500,00"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Observações / Anotações */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Anotações & Acordos Verbais
            </label>
            <textarea
              id="notes"
              rows={2}
              placeholder="Ex: Pagamento todo dia 10 por PIX; taxa de 10% se atrasar mais de 3 dias..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onClose()
              }}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-black shadow-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
              style={{
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
              }}
            >
              {isSubmitting
                ? 'Salvando...'
                : initialData
                  ? 'Salvar Alterações'
                  : 'Registrar Dívida'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
