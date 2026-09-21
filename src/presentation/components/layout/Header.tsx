import { Volume2, VolumeX, Wallet } from 'lucide-react'
import { useState } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'

interface HeaderProps {
  transactionCount: number
}

export const Header = ({ transactionCount }: HeaderProps) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundFX.isEnabled())

  const handleToggleSound = () => {
    const newState = soundFX.toggle()
    setSoundEnabled(newState)
  }

  return (
    <header className="flex items-center justify-between border-b border-white/8 pb-6">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl backdrop-blur-md shadow-lg shadow-emerald-500/5">
          <Wallet className="w-8 h-8 text-emerald-400" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              myFinance
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded-full tracking-wide">
              PRO
            </span>
          </div>
          <p className="text-xs text-zinc-400">Controle financeiro pessoal de alta precisão</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Botão de Micro-feedback Háptico/Sonoro */}
        <button
          type="button"
          onClick={handleToggleSound}
          title={
            soundEnabled ? 'Silenciar efeitos sonoros táteis' : 'Ativar efeitos sonoros táteis'
          }
          aria-label={soundEnabled ? 'Desativar áudio tátil' : 'Ativar áudio tátil'}
          className={`p-2.5 rounded-2xl glass-pill transition-all duration-200 cursor-pointer ${
            soundEnabled
              ? 'text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4" aria-hidden="true" />
          ) : (
            <VolumeX className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        <div className="text-right hidden sm:block">
          <div className="px-4 py-2 rounded-2xl glass-pill">
            <span className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider block">
              Total de Registros
            </span>
            <span className="text-sm font-semibold text-white">
              {transactionCount} {transactionCount === 1 ? 'movimentação' : 'movimentações'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
