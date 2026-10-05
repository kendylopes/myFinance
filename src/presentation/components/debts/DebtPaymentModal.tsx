import { Calendar, CheckCircle2, DollarSign, RefreshCw, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { getLocalDateString } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import { useToast } from '../../../core/toast/toastContext'
import type { Debt, DebtPaymentType, RecordDebtPaymentDTO } from '../../../domain/models/debt'

interface DebtPaymentModalProps {
  isOpen: boolean
  debt: Debt | null
  onClose: () => void
  onRecordPayment: (dto: RecordDebtPaymentDTO) => Promise<unknown>
}

export function DebtPaymentModal({
  isOpen,
  debt,
  onClose,
  onRecordPayment,
}: DebtPaymentModalProps) {
  const { currentTheme } = useTheme()
  const { formatValue } = useCurrency()
  const toast = useToast()

  const [paymentType, setPaymentType] = useState<DebtPaymentType>('renewal')
  const [paymentDate, setPaymentDate] = useState(getLocalDateString())
  const [newDueDate, setNewDueDate] = useState('')
  const [amountInput, setAmountInput] = useState('')
  const [principalPaidInput, setPrincipalPaidInput] = useState('')
  const [notes, setNotes] = useState('')
  const [registerAsExpense, setRegisterAsExpense] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Calcula o valor dos juros baseado no tipo da dívida
  const calculatedInterest = debt
    ? debt.interestType === 'fixed'
      ? debt.fixedInterestAmount || 0
      : (debt.currentBalance * (debt.interestRate || 0)) / 100
    : 0

  useEffect(() => {
    if (!debt || !isOpen) return

    setPaymentDate(getLocalDateString())

    // Sugere próximo vencimento (+30 dias a partir da data de vencimento atual ou hoje)
    const baseDate = new Date(
      debt.dueDate > getLocalDateString() ? debt.dueDate : getLocalDateString(),
    )
    baseDate.setDate(baseDate.getDate() + 30)
    setNewDueDate(baseDate.toISOString().split('T')[0])

    // Se a dívida for parcelada, sugere o modo parcela
    if (debt.totalInstallments && debt.totalInstallments > 1 && debt.installmentAmount) {
      setPaymentType('installment')
      setAmountInput(String(debt.installmentAmount))
      setPrincipalPaidInput(
        String(
          debt.installmentAmount - calculatedInterest > 0
            ? debt.installmentAmount - calculatedInterest
            : debt.installmentAmount,
        ),
      )
    } else {
      // Padrão: Renovação (rolar dívida pagando só os juros)
      setPaymentType('renewal')
      setAmountInput(String(calculatedInterest.toFixed(2)))
      setPrincipalPaidInput('0')
    }

    setNotes('')
    setRegisterAsExpense(true)
  }, [debt, isOpen, calculatedInterest])

  // Ajusta valores quando troca o modo de pagamento
  const handleSelectPaymentType = (type: DebtPaymentType) => {
    soundFX.playClick()
    setPaymentType(type)
    if (!debt) return

    if (type === 'renewal') {
      // Pagar apenas os juros do mês
      setAmountInput(String(calculatedInterest.toFixed(2)))
      setPrincipalPaidInput('0')
    } else if (type === 'full_payoff') {
      // Quitação total: Saldo do principal + juros do mês
      const totalToPay = debt.currentBalance + calculatedInterest
      setAmountInput(String(totalToPay.toFixed(2)))
      setPrincipalPaidInput(String(debt.currentBalance.toFixed(2)))
    } else if (type === 'amortization') {
      // Amortização: sugere metade do saldo + juros
      const suggestedPrincipal = Math.round(debt.currentBalance / 2)
      setPrincipalPaidInput(String(suggestedPrincipal))
      setAmountInput(String((suggestedPrincipal + calculatedInterest).toFixed(2)))
    } else if (type === 'installment') {
      const inst = debt.installmentAmount || debt.currentBalance / (debt.totalInstallments || 1)
      setAmountInput(String(inst.toFixed(2)))
      const principalPart = Math.max(0, inst - calculatedInterest)
      setPrincipalPaidInput(String(principalPart.toFixed(2)))
    }
  }

  if (!isOpen || !debt) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const totalAmount = Number.parseFloat(amountInput.replace(',', '.'))
    if (Number.isNaN(totalAmount) || totalAmount <= 0) {
      toast.error('Valor inválido', 'Informe um valor de pagamento maior que zero.')
      return
    }

    let principalPaid = Number.parseFloat(principalPaidInput.replace(',', '.')) || 0
    if (paymentType === 'renewal') {
      principalPaid = 0
    } else if (paymentType === 'full_payoff') {
      principalPaid = debt.currentBalance
    }

    const interestPaid = Math.max(0, totalAmount - principalPaid)

    if (paymentType === 'renewal' && !newDueDate) {
      toast.error(
        'Nova data obrigatória',
        'Informe a nova data de vencimento da dívida após renovação.',
      )
      return
    }

    try {
      setIsSubmitting(true)
      await onRecordPayment({
        debtId: debt.id,
        paymentDate,
        amount: totalAmount,
        type: paymentType,
        interestPaid,
        principalPaid,
        newDueDate: paymentType !== 'full_payoff' ? newDueDate : undefined,
        notes: notes.trim() || undefined,
        registerAsExpense,
      })

      soundFX.playSuccess()

      if (paymentType === 'full_payoff') {
        toast.success(
          'Dívida Quitada com Sucesso! 🎉',
          `Parabéns! Você liquidou o compromisso com ${debt.lenderName}.`,
        )
      } else if (paymentType === 'renewal') {
        toast.success(
          'Dívida Renovada / Rolada! 🔄',
          `Juros pagos e novo vencimento agendado para ${newDueDate.split('-').reverse().join('/')}.`,
        )
      } else {
        toast.success(
          'Pagamento Registrado!',
          `O saldo da dívida foi abatido em ${formatValue(principalPaid)}.`,
        )
      }

      onClose()
    } catch {
      toast.error('Erro ao pagar', 'Não foi possível registrar o pagamento da dívida.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-white/10 glass-card p-6 shadow-2xl relative"
        style={{
          boxShadow: `0 20px 50px -10px ${currentTheme.primaryColor}25`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-emerald-400" />
              Dar Baixa / Renovar Dívida
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Credor: <span className="text-white font-medium">{debt.lenderName}</span> • Saldo
              Devedor:{' '}
              <span className="text-amber-400 font-bold font-mono">
                {formatValue(debt.currentBalance)}
              </span>
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

        {/* Seleção do Tipo de Baixa */}
        <div className="mt-4 space-y-3">
          <span className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Escolha como deseja pagar:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectPaymentType('renewal')}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                paymentType === 'renewal'
                  ? 'border-emerald-500/60 bg-emerald-500/15 shadow-lg shadow-emerald-950/30'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Rolar / Renovar
                </span>
                {paymentType === 'renewal' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                Paga apenas os juros do mês e estende o prazo sem abater o principal.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPaymentType('amortization')}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                paymentType === 'amortization'
                  ? 'border-cyan-500/60 bg-cyan-500/15 shadow-lg shadow-cyan-950/30'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  Amortizar
                </span>
                {paymentType === 'amortization' && (
                  <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                Paga os juros + abate uma parte do principal, diminuindo o saldo devedor.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPaymentType('full_payoff')}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                paymentType === 'full_payoff'
                  ? 'border-emerald-500/80 bg-emerald-500/20 shadow-lg shadow-emerald-950/40'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Quitar Totalmente
                </span>
                {paymentType === 'full_payoff' && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                Liquida o saldo integral e encerra definitivamente a dívida.
              </p>
            </button>

            {debt.totalInstallments && debt.totalInstallments > 1 && (
              <button
                type="button"
                onClick={() => handleSelectPaymentType('installment')}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                  paymentType === 'installment'
                    ? 'border-amber-500/60 bg-amber-500/15 shadow-lg shadow-amber-950/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Pagar Parcela
                  </span>
                  {paymentType === 'installment' && (
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-tight">
                  Baixa da parcela ({debt.paidInstallments + 1} de {debt.totalInstallments}).
                </p>
              </button>
            )}
          </div>
        </div>

        {/* Informações de Juros Calculados */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 mt-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-zinc-400 block uppercase tracking-wider font-semibold">
              Juros do Período ({debt.interestType === 'fixed' ? 'Fixo' : `${debt.interestRate}%`})
            </span>
            <span className="text-sm font-bold text-amber-400 font-mono">
              {formatValue(calculatedInterest)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-zinc-400 block uppercase tracking-wider font-semibold">
              Saldo Restante da Dívida
            </span>
            <span className="text-sm font-bold text-white font-mono">
              {formatValue(debt.currentBalance)}
            </span>
          </div>
        </div>

        {/* Formulário de Execução */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="amountInput"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Valor Total Pago (R$) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="amountInput"
                  type="text"
                  required
                  placeholder="0,00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {paymentType === 'amortization' && (
              <div>
                <label
                  htmlFor="principalPaidInput"
                  className="block text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-1.5"
                >
                  Quanto Abate do Principal (R$) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-cyan-400 absolute left-3 top-3.5" />
                  <input
                    id="principalPaidInput"
                    type="text"
                    required
                    placeholder="0,00"
                    value={principalPaidInput}
                    onChange={(e) => setPrincipalPaidInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-200 font-mono text-base font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="paymentDate"
                className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
              >
                Data do Pagamento *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-3.5" />
                <input
                  id="paymentDate"
                  type="date"
                  required
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Se não for quitação total, define nova data de vencimento */}
          {paymentType !== 'full_payoff' && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
              <label
                htmlFor="newDueDate"
                className="block text-xs font-bold text-amber-300 uppercase tracking-wider"
              >
                Novo Vencimento da Dívida (Prorrogação) *
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-amber-400 absolute left-3 top-3.5" />
                <input
                  id="newDueDate"
                  type="date"
                  required
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-black/40 border border-amber-500/40 text-amber-200 font-semibold text-sm focus:outline-none focus:border-amber-400"
                />
              </div>
              <p className="text-[11px] text-amber-300/80">
                Ao confirmar, o agiota terá a cobrança renovada para esta nova data.
              </p>
            </div>
          )}

          {/* Opção para lançar como despesa no fluxo de caixa */}
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white block">
                Lançar Despesa no Extrato do myFinance
              </span>
              <span className="text-[11px] text-zinc-400 block">
                Cria automaticamente uma despesa na categoria &quot;Dívidas & Juros&quot;.
              </span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={registerAsExpense}
                onChange={(e) => setRegisterAsExpense(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500" />
            </label>
          </div>

          {/* Anotação opcional */}
          <div>
            <label
              htmlFor="notes"
              className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5"
            >
              Comprovante / Observação
            </label>
            <input
              id="notes"
              type="text"
              placeholder="Ex: Pago por PIX via conta Nubank"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500"
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-black shadow-lg cursor-pointer transition-all hover:scale-105 disabled:opacity-50"
              style={{
                backgroundColor: currentTheme.primaryColor,
                boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
              }}
            >
              {isSubmitting ? 'Processando...' : 'Confirmar Pagamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
