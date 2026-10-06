import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit2,
  History,
  MoreVertical,
  Percent,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { getLocalDateString } from '../../../core/formatters/date'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Debt, DebtPayment } from '../../../domain/models/debt'

interface DebtCardProps {
  debt: Debt
  payments: DebtPayment[]
  isPrivacyMode: boolean
  onOpenPaymentModal: (debt: Debt) => void
  onOpenHistoryModal: (debt: Debt) => void
  onEdit: (debt: Debt) => void
  onDelete: (debtId: string) => void
}

export function DebtCard({
  debt,
  payments,
  isPrivacyMode,
  onOpenPaymentModal,
  onOpenHistoryModal,
  onEdit,
  onDelete,
}: DebtCardProps) {
  const { formatValue } = useCurrency()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const today = getLocalDateString()

  // Calcula dias para o vencimento
  const todayDate = new Date(`${today}T00:00:00`)
  const dueDateObj = new Date(`${debt.dueDate}T00:00:00`)
  const diffTime = dueDateObj.getTime() - todayDate.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  // Juros calculados do período atual
  const interestAmount =
    debt.interestType === 'fixed'
      ? debt.fixedInterestAmount || 0
      : (debt.currentBalance * (debt.interestRate || 0)) / 100

  // Total de juros já pagos especificamente nesta dívida
  const debtPayments = payments.filter((p) => p.debtId === debt.id)
  const totalInterestPaid = debtPayments.reduce((acc, p) => acc + (p.interestPaid || 0), 0)

  // Percentual amortizado / quitado do principal
  const paidPercent =
    debt.originalAmount > 0
      ? Math.min(
          100,
          Math.max(0, ((debt.originalAmount - debt.currentBalance) / debt.originalAmount) * 100),
        )
      : 0

  // Configuração visual de status
  const isPaid = debt.status === 'paid' || debt.currentBalance <= 0
  const isOverdue = !isPaid && diffDays < 0
  const isDueToday = !isPaid && diffDays === 0
  const isDueSoon = !isPaid && diffDays > 0 && diffDays <= 5

  let statusBadge = {
    label: 'Em dia',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    icon: CheckCircle2,
  }

  if (isPaid) {
    statusBadge = {
      label: 'Quitado',
      color: 'bg-zinc-800 text-zinc-400 border-zinc-700',
      icon: CheckCircle2,
    }
  } else if (isOverdue) {
    statusBadge = {
      label: `Atrasada (${Math.abs(diffDays)}d)`,
      color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
      icon: AlertCircle,
    }
  } else if (isDueToday) {
    statusBadge = {
      label: 'Vence Hoje!',
      color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold animate-pulse',
      icon: Clock,
    }
  } else if (isDueSoon) {
    statusBadge = {
      label: `Vence em ${diffDays}d`,
      color: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      icon: Clock,
    }
  }

  const StatusIcon = statusBadge.icon

  const mask = (val: string) => (isPrivacyMode ? '••••••' : val)

  return (
    <div
      className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between ${
        isOverdue
          ? 'border-rose-500/40 bg-rose-950/20 shadow-lg shadow-rose-950/30'
          : isDueToday
            ? 'border-amber-500/40 bg-amber-950/20 shadow-lg shadow-amber-950/30'
            : isPaid
              ? 'border-white/5 opacity-75'
              : 'border-white/10 hover:border-white/20'
      }`}
    >
      <div>
        {/* Top Header do Card: Nome do Credor, Status Badge e Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">
                {isPrivacyMode ? 'Credor Confidencial' : debt.lenderName}
              </h3>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusBadge.color}`}
              >
                <StatusIcon className="w-3 h-3" />
                {statusBadge.label}
              </span>
            </div>

            {debt.description && (
              <p className="text-xs text-zinc-400 mt-0.5 truncate">
                {isPrivacyMode ? '••••••••••' : debt.description}
              </p>
            )}
          </div>

          {/* Menu de Ações Secundárias */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              aria-label="Opções da dívida"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Fechar opções"
                  className="fixed inset-0 z-30 cursor-default bg-transparent border-0"
                  onClick={() => setIsMenuOpen(false)}
                />
                <div className="absolute right-0 top-8 z-40 w-36 rounded-2xl bg-zinc-900 border border-white/15 p-1 shadow-2xl animate-fade-in text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      soundFX.playClick()
                      onEdit(debt)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      soundFX.playClick()
                      if (
                        window.confirm(`Deseja realmente excluir a dívida de ${debt.lenderName}?`)
                      ) {
                        onDelete(debt.id)
                      }
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Saldo Devedor em Destaque */}
        <div className="mt-4 p-4 rounded-2xl bg-white/2 border border-white/5 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
                Saldo Devedor
              </span>
              <span
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight block mt-0.5 ${
                  isPaid ? 'text-zinc-500 line-through' : 'text-white'
                }`}
              >
                {mask(formatValue(debt.currentBalance))}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                Valor Original
              </span>
              <span className="text-xs font-semibold text-zinc-400 font-mono">
                {mask(formatValue(debt.originalAmount))}
              </span>
            </div>
          </div>

          {/* Barra de Progresso de Amortização */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
              <span>Progresso de Quitação</span>
              <span className="font-semibold text-emerald-400">{paidPercent.toFixed(0)}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-500 transition-all duration-500"
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Informações de Juros e Vencimento */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <div className="p-3 rounded-2xl bg-white/2 border border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <Percent className="w-3.5 h-3.5 text-amber-400" />
              <span>Juros Combinados</span>
            </div>
            <div className="text-xs font-bold text-amber-300 font-mono mt-1">
              {debt.interestType === 'fixed'
                ? `${mask(formatValue(debt.fixedInterestAmount || 0))} fixo`
                : `${debt.interestRate}% ao mês`}
            </div>
            {!isPaid && (
              <div className="text-[10px] text-zinc-400 mt-0.5">
                Custo rolagem:{' '}
                <strong className="text-amber-400">{mask(formatValue(interestAmount))}</strong>
              </div>
            )}
          </div>

          <div
            className={`p-3 rounded-2xl border transition-colors ${
              isOverdue
                ? 'bg-rose-500/10 border-rose-500/30'
                : isDueToday
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/2 border border-white/5'
            }`}
          >
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
              <Calendar
                className={`w-3.5 h-3.5 ${
                  isOverdue ? 'text-rose-400' : isDueToday ? 'text-amber-400' : 'text-emerald-400'
                }`}
              />
              <span>Vencimento</span>
            </div>
            <div
              className={`text-xs font-bold font-mono mt-1 ${
                isOverdue ? 'text-rose-300' : isDueToday ? 'text-amber-300' : 'text-white'
              }`}
            >
              {debt.dueDate.split('-').reverse().join('/')}
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {isPaid
                ? 'Totalmente liquidada'
                : isOverdue
                  ? `${Math.abs(diffDays)} dias em atraso`
                  : isDueToday
                    ? 'Cobrança prevista para hoje'
                    : `Faltam ${diffDays} dias`}
            </div>
          </div>
        </div>

        {/* Alerta de Juros Acumulados Pagos nesta Dívida */}
        {totalInterestPaid > 0 && (
          <div className="mt-3 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <span className="text-amber-300 text-[11px] font-medium">
              Você já pagou em juros para este credor:
            </span>
            <span className="font-bold text-amber-300 font-mono">
              {mask(formatValue(totalInterestPaid))}
            </span>
          </div>
        )}
      </div>

      {/* Botões de Ação na Base */}
      <div className="mt-5 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
        {!isPaid ? (
          <>
            {/* Botão Rolar / Renovar (Pagar só os juros) */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onOpenPaymentModal(debt)
              }}
              className="flex-1 min-w-30 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 text-black text-xs font-bold shadow-lg shadow-emerald-950/40 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Dar Baixa / Rolar</span>
            </button>

            {/* Botão Ver Histórico */}
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onOpenHistoryModal(debt)
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 text-xs font-semibold transition-all cursor-pointer"
              title="Ver histórico de pagamentos"
            >
              <History className="w-3.5 h-3.5 text-zinc-400" />
              <span>Extrato ({debtPayments.length})</span>
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Dívida Liquidada
            </span>
            <button
              type="button"
              onClick={() => {
                soundFX.playClick()
                onOpenHistoryModal(debt)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-zinc-300 text-xs font-semibold cursor-pointer"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ver Histórico</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
