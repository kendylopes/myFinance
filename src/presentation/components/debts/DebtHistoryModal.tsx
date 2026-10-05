import { Calendar, CheckCircle2, Clock, DollarSign, History, RefreshCw, X } from 'lucide-react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Debt, DebtPayment } from '../../../domain/models/debt'

interface DebtHistoryModalProps {
  isOpen: boolean
  debt: Debt | null
  payments: DebtPayment[]
  onClose: () => void
}

export function DebtHistoryModal({ isOpen, debt, payments, onClose }: DebtHistoryModalProps) {
  const { formatValue } = useCurrency()

  if (!isOpen || !debt) return null

  const debtPayments = payments.filter((p) => p.debtId === debt.id)
  const totalPaid = debtPayments.reduce((acc, p) => acc + p.amount, 0)
  const totalInterest = debtPayments.reduce((acc, p) => acc + (p.interestPaid || 0), 0)
  const totalPrincipal = debtPayments.reduce((acc, p) => acc + (p.principalPaid || 0), 0)

  const paymentTypeLabels = {
    renewal: {
      label: 'Renovação / Juros',
      icon: RefreshCw,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    },
    amortization: {
      label: 'Amortização',
      icon: DollarSign,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    },
    installment: {
      label: 'Parcela',
      icon: Calendar,
      color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    },
    full_payoff: {
      label: 'Quitação Total',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    },
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl max-h-[88vh] flex flex-col rounded-3xl border border-white/10 glass-card p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              Histórico de Pagamentos
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Credor: <span className="text-white font-medium">{debt.lenderName}</span> • Pegou:{' '}
              <span className="text-zinc-200 font-mono font-semibold">
                {formatValue(debt.originalAmount)}
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
            aria-label="Fechar histórico"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumo Consolidado do que já foi pago */}
        <div className="grid grid-cols-3 gap-2 my-4">
          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
              Total Pago
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {formatValue(totalPaid)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold block">
              Só em Juros
            </span>
            <span className="text-sm font-bold text-amber-300 font-mono mt-0.5 block">
              {formatValue(totalInterest)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
            <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold block">
              Abatido da Dívida
            </span>
            <span className="text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
              {formatValue(totalPrincipal)}
            </span>
          </div>
        </div>

        {/* Lista de Registros */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {debtPayments.length === 0 ? (
            <div className="text-center py-10 text-zinc-500">
              <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhum pagamento registrado ainda para este empréstimo.</p>
            </div>
          ) : (
            debtPayments.map((p) => {
              const meta = paymentTypeLabels[p.type] || paymentTypeLabels.renewal
              const Icon = meta.icon

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${meta.color}`}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {p.paymentDate.split('-').reverse().join('/')}
                      </span>
                    </div>

                    <span className="text-sm font-bold text-white font-mono">
                      {formatValue(p.amount)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 text-xs text-zinc-400 pt-1 border-t border-white/5">
                    <div>
                      <span>Juros pagos: </span>
                      <span className="text-amber-400 font-semibold font-mono">
                        {formatValue(p.interestPaid)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span>Abateu do principal: </span>
                      <span className="text-emerald-400 font-semibold font-mono">
                        {formatValue(p.principalPaid)}
                      </span>
                    </div>
                  </div>

                  {p.newDueDate && (
                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 bg-black/20 px-2.5 py-1 rounded-lg">
                      <Calendar className="w-3 h-3 text-amber-400" />
                      <span>
                        Novo vencimento prorrogado para:{' '}
                        <strong className="text-white">
                          {p.newDueDate.split('-').reverse().join('/')}
                        </strong>
                      </span>
                    </div>
                  )}

                  {p.notes && (
                    <p className="text-[11px] text-zinc-400 italic bg-white/[0.01] p-1.5 rounded">
                      &quot;{p.notes}&quot;
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onClose()
            }}
            className="px-5 py-2 rounded-xl border border-white/10 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}
