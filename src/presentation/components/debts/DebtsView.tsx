import {
  AlertCircle,
  Eye,
  EyeOff,
  HandCoins,
  History,
  Info,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Sliders,
  Wallet,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'
import type { CreateDebtDTO, Debt, RecordDebtPaymentDTO } from '../../../domain/models/debt'
import type { CreateTransactionDTO } from '../../../domain/models/transaction'
import { useDebts } from '../../hooks/useDebts'
import { DebtCard } from './DebtCard'
import { DebtHistoryModal } from './DebtHistoryModal'
import { DebtModal } from './DebtModal'
import { DebtPaymentModal } from './DebtPaymentModal'
import { DebtSimulator } from './DebtSimulator'

interface DebtsViewProps {
  onAddTransaction?: (tx: CreateTransactionDTO) => Promise<unknown>
}

export function DebtsView({ onAddTransaction }: DebtsViewProps) {
  const { currentTheme } = useTheme()
  const { formatValue } = useCurrency()

  const {
    debts,
    payments,
    activeDebts,
    paidDebts,
    overdueDebts,
    totalDebtBalance,
    totalInterestPaid,
    totalAmountPaid,
    isLoading,
    isPrivacyMode,
    togglePrivacyMode,
    addDebt,
    updateDebt,
    deleteDebt,
    payDebt,
  } = useDebts({ onAddTransaction })

  const [activeTab, setActiveTab] = useState<'contracts' | 'simulator'>('contracts')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'urgent' | 'paid'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Modais
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false)
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null)

  const [paymentDebt, setPaymentDebt] = useState<Debt | null>(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const [historyDebt, setHistoryDebt] = useState<Debt | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)

  // Dívidas filtradas
  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      // Filtro de status
      if (filterStatus === 'active' && d.status === 'paid') return false
      if (filterStatus === 'paid' && d.status !== 'paid') return false
      if (filterStatus === 'urgent') {
        const isUrgent = d.status === 'overdue' || d.status === 'active'
        if (d.status === 'paid') return false
        if (!isUrgent) return false
      }

      // Filtro de busca
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchName = d.lenderName.toLowerCase().includes(q)
        const matchDesc = d.description?.toLowerCase().includes(q) || false
        if (!matchName && !matchDesc) return false
      }

      return true
    })
  }, [debts, filterStatus, searchQuery])

  const mask = (val: string) => (isPrivacyMode ? '••••••' : val)

  const handleOpenNew = () => {
    soundFX.playClick()
    setEditingDebt(null)
    setIsDebtModalOpen(true)
  }

  const handleOpenEdit = (debt: Debt) => {
    soundFX.playClick()
    setEditingDebt(debt)
    setIsDebtModalOpen(true)
  }

  const handleOpenPayment = (debt: Debt) => {
    soundFX.playClick()
    setPaymentDebt(debt)
    setIsPaymentModalOpen(true)
  }

  const handleOpenHistory = (debt: Debt) => {
    soundFX.playClick()
    setHistoryDebt(debt)
    setIsHistoryModalOpen(true)
  }

  const handleSaveDebt = async (dto: CreateDebtDTO) => {
    if (editingDebt) {
      await updateDebt(editingDebt.id, dto)
    } else {
      await addDebt(dto)
    }
  }

  const handleRecordPayment = async (dto: RecordDebtPaymentDTO) => {
    await payDebt(dto)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header de Ações da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2.5 rounded-2xl border flex items-center justify-center shrink-0 shadow-lg"
            style={{
              backgroundColor: `${currentTheme.primaryColor}15`,
              borderColor: `${currentTheme.primaryColor}30`,
              color: currentTheme.primaryColor,
            }}
          >
            <HandCoins className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Dívidas & Empréstimos
            </h2>
            <p className="text-xs text-zinc-400">
              {activeDebts.length} dívida(s) ativa(s) sob acompanhamento
            </p>
          </div>
        </div>

        {/* Botões do Topo: Modo Discreto e Novo Empréstimo */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              togglePrivacyMode()
            }}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
              isPrivacyMode
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10'
            }`}
            title={
              isPrivacyMode ? 'Desativar modo discreto' : 'Ativar modo discreto (ocultar valores)'
            }
          >
            {isPrivacyMode ? (
              <EyeOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span>{isPrivacyMode ? 'Modo Discreto Ativo' : 'Modo Discreto'}</span>
          </button>

          <button
            type="button"
            onClick={handleOpenNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-black shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
            style={{
              backgroundColor: currentTheme.primaryColor,
              boxShadow: `0 4px 15px ${currentTheme.primaryColor}40`,
            }}
          >
            <Plus className="w-4 h-4" />
            <span>Nova Dívida</span>
          </button>
        </div>
      </div>

      {/* 2. Navegação por Abas (Contratos vs Simulador) */}
      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/10 w-fit shadow-inner">
        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            setActiveTab('contracts')
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'contracts'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <HandCoins className="w-4 h-4" />
          <span>Minhas Dívidas ({debts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            setActiveTab('simulator')
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Simulador de Quitação</span>
        </button>
      </div>

      {activeTab === 'simulator' ? (
        /* Aba 2: Simulador Interativo de Quitação */
        <DebtSimulator debts={debts} isPrivacyMode={isPrivacyMode} />
      ) : (
        /* Aba 1: Painel de Contratos e Gestão */
        <>
          {/* Banner de Alerta Se Houver Dívidas Atrasadas */}
          {overdueDebts.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-between gap-3 shadow-lg shadow-rose-950/30 text-rose-200">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300 animate-pulse">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-rose-100">
                    Atenção: Você possui {overdueDebts.length} dívida(s) em atraso!
                  </h4>
                  <p className="text-xs text-rose-300/80">
                    Dívidas com juros altos ou de mora crescem rápido. Priorize a rolagem ou
                    quitação.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFilterStatus('urgent')}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold cursor-pointer transition-colors shrink-0"
              >
                Ver Atrasadas
              </button>
            </div>
          )}

          {/* Cards com Resumo Analítico Superior */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Card 1: Saldo Devedor Total */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                  Total em Dívidas
                </span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
                {mask(formatValue(totalDebtBalance))}
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                {activeDebts.length} compromisso(s) em aberto
              </p>
            </div>

            {/* Card 2: Total Pago Só em Juros */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-amber-500/20 bg-amber-950/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-amber-400 truncate">
                  Só em Juros Pagos
                </span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-400">
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-amber-300 font-mono tracking-tight">
                {mask(formatValue(totalInterestPaid))}
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Custo total de rolagens</p>
            </div>

            {/* Card 3: Total Geral Pago */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
                  Volume Total Pago
                </span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-white font-mono tracking-tight">
                {mask(formatValue(totalAmountPaid))}
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">
                {payments.length} pagamento(s)
              </p>
            </div>

            {/* Card 4: Dívidas Liquidadas */}
            <div className="glass-card p-4 sm:p-5 rounded-3xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-emerald-400 truncate">
                  Dívidas Quitadas
                </span>
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
              </div>
              <div className="text-lg sm:text-2xl font-black text-emerald-300 font-mono tracking-tight">
                {paidDebts.length}
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Compromissos quitados</p>
            </div>
          </div>

          {/* Barra de Filtros e Busca de Contratos */}
          <div className="glass-card p-2.5 sm:p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-2.5 shadow-sm">
            {/* Abas de Filtro em Trilho Fluido */}
            <div className="flex items-center p-1 rounded-xl bg-white/3 border border-white/8 shadow-inner overflow-x-auto custom-scrollbar gap-1">
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterStatus('all')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === 'all'
                    ? 'bg-white/15 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Todas ({debts.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterStatus('active')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-xs'
                    : 'text-zinc-400 hover:text-emerald-400 hover:bg-white/5'
                }`}
              >
                Ativas ({activeDebts.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterStatus('urgent')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === 'urgent'
                    ? 'bg-rose-500/25 text-rose-300 border border-rose-500/40 shadow-xs'
                    : 'text-zinc-400 hover:text-rose-400 hover:bg-white/5'
                }`}
              >
                Atrasadas ({overdueDebts.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setFilterStatus('paid')
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  filterStatus === 'paid'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-xs'
                    : 'text-zinc-400 hover:text-cyan-400 hover:bg-white/5'
                }`}
              >
                Quitadas ({paidDebts.length})
              </button>
            </div>

            {/* Input de Busca com Botão Limpar */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-emerald-400/80 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por credor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-9 pl-9 pr-8 rounded-xl bg-white/4 border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/60 focus:bg-white/6 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Limpar busca"
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Grid de Cards de Dívidas */}
          {isLoading ? (
            <div className="text-center py-16 text-zinc-400 space-y-2">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Carregando seus compromissos...</p>
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-3">
              <div
                className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border"
                style={{
                  backgroundColor: `${currentTheme.primaryColor}15`,
                  borderColor: `${currentTheme.primaryColor}30`,
                  color: currentTheme.primaryColor,
                }}
              >
                <HandCoins className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Nenhuma dívida encontrada</h3>
              <p className="text-xs text-zinc-400 max-w-md mx-auto">
                {searchQuery.trim() || filterStatus !== 'all'
                  ? 'Nenhum resultado corresponde aos filtros aplicados.'
                  : 'Cadastre dívidas ou empréstimos pessoais para acompanhar vencimentos, renovações e abatimentos.'}
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleOpenNew}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-black cursor-pointer shadow-lg hover:scale-105 transition-all"
                  style={{
                    backgroundColor: currentTheme.primaryColor,
                  }}
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Primeira Dívida</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {filteredDebts.map((debt) => (
                <DebtCard
                  key={debt.id}
                  debt={debt}
                  payments={payments}
                  isPrivacyMode={isPrivacyMode}
                  onOpenPaymentModal={handleOpenPayment}
                  onOpenHistoryModal={handleOpenHistory}
                  onEdit={handleOpenEdit}
                  onDelete={deleteDebt}
                />
              ))}
            </div>
          )}

          {/* Dica Estratégica na Base */}
          <div className="p-4 rounded-2xl bg-white/3 border border-white/8 flex items-start gap-3 text-xs text-zinc-400">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p>
              <strong className="text-zinc-200">Estratégia de Quitação:</strong> Sempre que você{' '}
              <strong className="text-emerald-400">&quot;Rola a dívida&quot;</strong>, paga apenas
              os juros do mês e o capital inicial continua idêntico. Sempre que possível, utilize a
              opção <strong className="text-cyan-400">&quot;Amortizar&quot;</strong> para reduzir o
              saldo do principal e diminuir o custo do próximo mês.
            </p>
          </div>
        </>
      )}

      {/* Modais */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        onSave={handleSaveDebt}
        initialData={editingDebt}
      />

      <DebtPaymentModal
        isOpen={isPaymentModalOpen}
        debt={paymentDebt}
        onClose={() => setIsPaymentModalOpen(false)}
        onRecordPayment={handleRecordPayment}
      />

      <DebtHistoryModal
        isOpen={isHistoryModalOpen}
        debt={historyDebt}
        payments={payments}
        onClose={() => setIsHistoryModalOpen(false)}
      />
    </div>
  )
}
