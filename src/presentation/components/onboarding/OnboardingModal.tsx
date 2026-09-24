import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Coins,
  Rocket,
  Sparkles,
  Target,
  Wallet,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'

export interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
  onInjectDemoData: () => Promise<void>
  onCompleteZeroSetup: (initialBalance: number, budgetAmount: number) => Promise<void>
  userName?: string
}

export function OnboardingModal({
  isOpen,
  onClose,
  onInjectDemoData,
  onCompleteZeroSetup,
  userName,
}: OnboardingModalProps) {
  const { currentTheme } = useTheme()
  const { currentCurrency } = useCurrency()

  const [step, setStep] = useState<'choose' | 'zero-setup'>('choose')
  const [initialBalance, setInitialBalance] = useState('')
  const [budgetAmount, setBudgetAmount] = useState('3000')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStep('choose')
      setInitialBalance('')
      setBudgetAmount('3000')
      setIsLoading(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isLoading, onClose])

  if (!isOpen) return null

  const handleChooseDemo = async () => {
    soundFX.playClick()
    setIsLoading(true)
    try {
      await onInjectDemoData()
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartZeroSetup = () => {
    soundFX.playClick()
    setStep('zero-setup')
  }

  const handleFinishZeroSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    soundFX.playClick()
    setIsLoading(true)
    try {
      const parsedBalance = Number.parseFloat(initialBalance.replace(',', '.')) || 0
      const parsedBudget = Number.parseFloat(budgetAmount.replace(',', '.')) || 3000
      await onCompleteZeroSetup(parsedBalance, parsedBudget)
      onClose()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        aria-hidden="true"
        onClick={() => !isLoading && onClose()}
      />

      {/* Conteúdo Principal */}
      <div className="glass-card max-w-xl w-full p-6 sm:p-8 rounded-3xl space-y-6 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10">
        {/* Cabeçalho */}
        <div className="flex items-start justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-3 rounded-2xl border flex items-center justify-center shrink-0 shadow-md"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2
                id="onboarding-modal-title"
                className="text-lg sm:text-xl font-bold text-white tracking-tight"
              >
                {userName ? `Bem-vindo, ${userName}!` : 'Bem-vindo ao myFinance!'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                {step === 'choose'
                  ? 'Como você deseja iniciar seu planejamento financeiro?'
                  : 'Configuração rápida do seu saldo e planejamento'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            aria-label="Fechar início rápido"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Passo 1: Escolha Inicial */}
        {step === 'choose' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Opção A: Começar do Zero */}
              <button
                type="button"
                onClick={handleStartZeroSetup}
                className="p-5 rounded-2xl text-left border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25 transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  <div
                    className="w-10 h-10 rounded-xl border flex items-center justify-center mb-3 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: `${currentTheme.primaryColor}25`,
                      borderColor: `${currentTheme.primaryColor}40`,
                      color: currentTheme.primaryColor,
                    }}
                  >
                    <Rocket className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Começar do Zero</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Configure seu saldo atual e meta de gastos em 2 passos rápidos para usar com
                    seus dados reais.
                  </p>
                </div>

                <div
                  className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1 text-xs font-semibold"
                  style={{ color: currentTheme.primaryColor }}
                >
                  <span>Configurar do zero</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              {/* Opção B: Explorar com Dados de Exemplo */}
              <button
                type="button"
                onClick={handleChooseDemo}
                disabled={isLoading}
                className="p-5 rounded-2xl text-left border bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/25 transition-all cursor-pointer relative group flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/35 flex items-center justify-center mb-3 text-amber-400 transition-transform group-hover:scale-105">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">Dados de Exemplo</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Carregue um modelo com receitas, despesas e gráficos preenchidos para conhecer o
                    app na prática.
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-1 text-xs font-semibold text-amber-400">
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      Carregando dados...
                    </span>
                  ) : (
                    <>
                      <span>Explorar demonstração</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </div>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Pular introdução e abrir painel vazio
              </button>
            </div>
          </div>
        )}

        {/* Passo 2: Configuração Rápida do Zero */}
        {step === 'zero-setup' && (
          <form onSubmit={handleFinishZeroSetup} className="space-y-4">
            <div className="space-y-3">
              {/* Campo Saldo Inicial */}
              <div>
                <label
                  htmlFor="onboarding-balance"
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1.5"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quanto você tem disponível hoje? ({currentCurrency.symbol})</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    {currentCurrency.symbol}
                  </span>
                  <input
                    id="onboarding-balance"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 2500,00 (ou deixe 0)"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full glass-input rounded-xl pl-11 pr-3.5 py-2.5 text-sm placeholder:text-zinc-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Se informado, este valor será lançado como seu saldo inicial deste mês.
                </span>
              </div>

              {/* Campo Meta Mensal */}
              <div>
                <label
                  htmlFor="onboarding-budget"
                  className="flex items-center gap-1.5 text-xs font-medium text-zinc-300 mb-1.5"
                >
                  <Target className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Qual o seu teto máximo de gastos para este mês?</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    {currentCurrency.symbol}
                  </span>
                  <input
                    id="onboarding-budget"
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="3000,00"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    className="w-full glass-input rounded-xl pl-11 pr-3.5 py-2.5 text-sm placeholder:text-zinc-500"
                  />
                </div>
                <span className="text-[10px] text-zinc-500 block mt-1">
                  Você poderá ajustar esse valor a qualquer momento no painel de Planejamento.
                </span>
              </div>
            </div>

            {/* Ações */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep('choose')}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shadow-md disabled:opacity-50"
                style={{
                  backgroundColor: currentTheme.primaryColor,
                  color: '#090a0f',
                }}
              >
                {isLoading ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Acessar Dashboard</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
