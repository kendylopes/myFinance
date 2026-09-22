import { Cloud, Database, LogOut, User, Volume2, VolumeX, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { AuthUser } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'

interface HeaderProps {
  transactionCount: number
  dataSource?: 'supabase' | 'localStorage'
  user?: AuthUser | null
  onOpenAuth?: () => void
  onLogout?: () => void
}

export const Header = ({
  transactionCount,
  dataSource = 'localStorage',
  user = null,
  onOpenAuth,
  onLogout,
}: HeaderProps) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundFX.isEnabled())

  const handleToggleSound = () => {
    const newState = soundFX.toggle()
    setSoundEnabled(newState)
  }

  // Primeira letra para o avatar
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || 'U'

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/8 pb-6 gap-4">
      {/* Logotipo e Descrição */}
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

      {/* Controles do Cabeçalho: Status, Auth, Som e Contador */}
      <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
        {/* Indicador de Nuvem / Local */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md transition-all ${
            dataSource === 'supabase' && user
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              : 'bg-white/5 border-white/10 text-zinc-400'
          }`}
          title={
            dataSource === 'supabase' && user
              ? `Conectado à nuvem como ${user.email}`
              : 'Modo Local (LocalStorage). Faça login para sincronizar com a nuvem.'
          }
        >
          {dataSource === 'supabase' && user ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400 animate-pulse" aria-hidden="true" />
              <span className="hidden xs:inline">Nuvem Ativa</span>
            </>
          ) : (
            <>
              <Database className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              <span className="hidden xs:inline">Modo Local</span>
            </>
          )}
        </div>

        {/* Perfil do Usuário ou Botão de Login / Cadastro */}
        {user ? (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-2xl glass-pill border border-emerald-500/20">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold text-xs flex items-center justify-center">
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-medium text-white block leading-tight truncate max-w-[120px]">
                {user.name || user.email}
              </span>
              <span className="text-[10px] text-zinc-400 block leading-tight">Autenticado</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Encerrar sessão"
              aria-label="Sair da conta"
              className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-white/5"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenAuth}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-md transition-all duration-200 cursor-pointer shadow-sm shadow-emerald-500/10 hover:shadow-emerald-500/20"
          >
            <User className="w-3.5 h-3.5" />
            <span>Entrar / Cadastrar</span>
          </button>
        )}

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

        {/* Contador de Registros */}
        <div className="hidden sm:block">
          <div className="px-3.5 py-1.5 rounded-2xl glass-pill">
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block leading-tight">
              Registros
            </span>
            <span className="text-xs font-semibold text-white">{transactionCount}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
