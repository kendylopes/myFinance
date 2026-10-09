import {
  Award,
  CheckCircle2,
  DollarSign,
  Layers,
  Percent,
  Sliders,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import type { Debt } from '../../../domain/models/debt'
import { comparePayoffStrategies } from '../../../domain/services/debtPayoffSimulator'

interface DebtSimulatorProps {
  debts: Debt[]
  isPrivacyMode: boolean
}

export function DebtSimulator({ debts, isPrivacyMode }: DebtSimulatorProps) {
  const { formatValue } = useCurrency()

  const activeDebts = useMemo(
    () => debts.filter((d) => d.status !== 'paid' && d.currentBalance > 0),
    [debts],
  )

  // Saldo total devedor
  const totalBalance = useMemo(
    () => activeDebts.reduce((acc, d) => acc + d.currentBalance, 0),
    [activeDebts],
  )

  // Sugestão de aporte padrão: ~10% do saldo total ou no mínimo R$ 300
  const defaultExtra = useMemo(() => {
    if (totalBalance === 0) return 500
    const suggested = Math.round(totalBalance * 0.1)
    return Math.max(200, Math.min(suggested, 2000))
  }, [totalBalance])

  const [monthlyExtra, setMonthlyExtra] = useState<number>(defaultExtra)
  const [selectedStrategy, setSelectedStrategy] = useState<'avalanche' | 'snowball'>('avalanche')

  // Executa a simulação comparativa
  const simulation = useMemo(() => {
    return comparePayoffStrategies(activeDebts, monthlyExtra)
  }, [activeDebts, monthlyExtra])

  const mask = (val: string) => (isPrivacyMode ? '••••••' : val)

  if (activeDebts.length === 0) {
    return (
      <div className="glass-card p-8 sm:p-12 rounded-3xl border border-white/10 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center">
          <Award className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">Parabéns! Nenhuma dívida ativa no momento</h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto">
          Você não possui contratos pendentes para simular. Quando cadastrar novos empréstimos, o
          simulador projetará as melhores estratégias de quitação aqui.
        </p>
      </div>
    )
  }

  const currentResult =
    selectedStrategy === 'avalanche' ? simulation.avalanche : simulation.snowball

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header do Simulador & Input de Aporte Extra */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sliders className="w-4 h-4" />
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Simulador Inteligente de Amortização
              </h3>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Descubra quanto você economiza e em quantos meses zera seus compromissos
            </p>
          </div>

          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-2 rounded-2xl">
            <span className="text-xs text-zinc-400 font-medium">Saldo a Liquidar:</span>
            <span className="text-sm font-bold font-mono text-white">
              {mask(formatValue(totalBalance))}
            </span>
          </div>
        </div>

        {/* Controle do Aporte Mensal Extra */}
        <div className="pt-2 border-t border-white/5 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label
              htmlFor="extra-budget-input"
              className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5"
            >
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Aporte Mensal Extra para Amortização:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                id="extra-budget-input"
                type="number"
                min={50}
                max={50000}
                step={50}
                value={monthlyExtra}
                onChange={(e) => setMonthlyExtra(Math.max(0, Number(e.target.value)))}
                className="w-32 bg-zinc-800 border border-white/15 rounded-xl px-3 py-1.5 text-right font-mono font-bold text-emerald-400 text-sm focus:outline-none focus:border-emerald-500"
              />
              <span className="text-xs text-zinc-400">/mês</span>
            </div>
          </div>

          {/* Slider de toque confortável */}
          <input
            type="range"
            min={100}
            max={Math.max(3000, totalBalance * 0.5)}
            step={50}
            value={monthlyExtra}
            onChange={(e) => setMonthlyExtra(Number(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          {/* Atalhos Rápidos de Aporte Extra */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] uppercase font-semibold text-zinc-500 mr-1">Atalhos:</span>
            {[100, 250, 500, 1000].map((amount) => (
              <button
                key={amount}
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setMonthlyExtra((prev) => prev + amount)
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              >
                +R$ {amount}
              </button>
            ))}
            {monthlyExtra !== defaultExtra && (
              <button
                type="button"
                onClick={() => {
                  soundFX.playClick()
                  setMonthlyExtra(defaultExtra)
                }}
                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors cursor-pointer ml-auto"
              >
                Sugerido (R$ {defaultExtra})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Comparativo das Duas Estratégias (Cards Interativos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card Método Avalanche */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            setSelectedStrategy('avalanche')
          }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedStrategy === 'avalanche'
              ? 'bg-linear-to-b from-emerald-500/15 to-transparent border-emerald-500/40 ring-1 ring-emerald-500/30 shadow-xl'
              : 'bg-white/3 border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Zap className="w-3 h-3" />
              Mais Econômico
            </span>
            {selectedStrategy === 'avalanche' && (
              <span className="p-1 rounded-full bg-emerald-500 text-zinc-950">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-white mt-3">Método Avalanche</h4>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
            Prioriza as dívidas com maiores taxas de juros para estancar o vazamento financeiro.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block font-semibold">
                Prazo Estimado
              </span>
              <span className="text-lg font-black font-mono text-white">
                {simulation.avalanche.isFeasible
                  ? `${simulation.avalanche.totalMonths} meses`
                  : '+30 anos'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block font-semibold">
                Total de Juros
              </span>
              <span className="text-lg font-black font-mono text-emerald-400">
                {mask(formatValue(simulation.avalanche.totalInterestPaid))}
              </span>
            </div>
          </div>
        </button>

        {/* Card Método Bola de Neve */}
        <button
          type="button"
          onClick={() => {
            soundFX.playClick()
            setSelectedStrategy('snowball')
          }}
          className={`p-5 rounded-3xl border text-left transition-all cursor-pointer relative overflow-hidden ${
            selectedStrategy === 'snowball'
              ? 'bg-linear-to-b from-cyan-500/15 to-transparent border-cyan-500/40 ring-1 ring-cyan-500/30 shadow-xl'
              : 'bg-white/3 border-white/10 hover:border-white/20 opacity-80 hover:opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              <Sparkles className="w-3 h-3" />
              Mais Motivacional
            </span>
            {selectedStrategy === 'snowball' && (
              <span className="p-1 rounded-full bg-cyan-500 text-zinc-950">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-white mt-3">Método Bola de Neve</h4>
          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">
            Prioriza quitar os menores saldos primeiro, gerando vitórias rápidas e reduzindo
            credores.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block font-semibold">
                Prazo Estimado
              </span>
              <span className="text-lg font-black font-mono text-white">
                {simulation.snowball.isFeasible
                  ? `${simulation.snowball.totalMonths} meses`
                  : '+30 anos'}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-zinc-500 block font-semibold">
                Total de Juros
              </span>
              <span className="text-lg font-black font-mono text-cyan-400">
                {mask(formatValue(simulation.snowball.totalInterestPaid))}
              </span>
            </div>
          </div>
        </button>
      </div>

      {/* 3. Destaque de Economia */}
      {simulation.interestSavings > 0 && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-emerald-300">
              Economia de {mask(formatValue(simulation.interestSavings))} em juros:
            </span>{' '}
            <span className="text-zinc-300">
              Ao adotar o Método Avalanche e atacar as maiores taxas primeiro, você evita
              desperdiçar dinheiro com juros compostos de agiotas ou cheque especial.
            </span>
          </div>
        </div>
      )}

      {/* 4. Ordem Recomendada de Quitação Passo a Passo */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Ordem de Ataque Recomendada ({currentResult.name})</span>
            </h4>
            <p className="text-xs text-zinc-400 mt-0.5">
              Concentre seu aporte extra no Contrato #1. Mantenha os outros rolando até quitação do
              primeiro.
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-300 hidden sm:inline-block">
            {currentResult.payoffOrder.length} credores na fila
          </span>
        </div>

        <div className="space-y-2.5">
          {currentResult.payoffOrder.map((step, index) => {
            const isPriorityOne = index === 0

            return (
              <div
                key={step.debtId}
                className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  isPriorityOne
                    ? 'bg-emerald-500/10 border-emerald-500/30 ring-1 ring-emerald-500/20'
                    : 'bg-white/3 border-white/8'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isPriorityOne
                        ? 'bg-emerald-500 text-zinc-950 font-black'
                        : 'bg-white/10 text-zinc-400'
                    }`}
                  >
                    #{index + 1}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">
                        {isPrivacyMode ? 'Credor Confidencial' : step.lenderName}
                      </span>
                      {isPriorityOne && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Alvo Atual
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
                      <span className="flex items-center gap-1 font-mono">
                        <Percent className="w-3 h-3 text-amber-400" />
                        {step.interestRate}% a.m.
                      </span>
                      <span>•</span>
                      <span>
                        Saldo:{' '}
                        <strong className="text-white font-mono">
                          {mask(formatValue(step.currentBalance))}
                        </strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <span className="text-xs text-zinc-400 sm:hidden">Previsão de Quitação:</span>
                  <div className="text-right">
                    <span className="text-xs sm:text-sm font-bold font-mono text-emerald-400 block">
                      ~ Mês {step.estimatedMonthsToPayoff}
                    </span>
                    <span className="text-[10px] text-zinc-500 hidden sm:block">
                      Quitação estimada
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
