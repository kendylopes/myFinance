import { Cloud, LogOut, Menu, Palette, Volume2, VolumeX, Wallet } from 'lucide-react'
import { useState } from 'react'
import type { AuthUser } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useTheme } from '../../../core/theme/themeContext'

interface HeaderProps {
  transactionCount: number
  dataSource?: 'supabase'
  user?: AuthUser | null
  onLogout?: () => void
  onOpenMobileMenu?: () => void
  onOpenThemeModal?: () => void
}

export const Header = ({
  transactionCount,
  user = null,
  onLogout,
  onOpenMobileMenu,
  onOpenThemeModal,
}: HeaderProps) => {
  const [soundEnabled, setSoundEnabled] = useState(() => soundFX.isEnabled())
  const { currentTheme } = useTheme()

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
      {/* Logotipo, Botão Mobile e Descrição */}
      <div className="flex items-center gap-3.5">
        {onOpenMobileMenu && (
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Abrir menu lateral"
            className="lg:hidden p-2 text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl cursor-pointer transition-colors"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
        )}

        <div
          className="p-2.5 rounded-2xl backdrop-blur-md shadow-lg border"
          style={{
            backgroundColor: `${currentTheme.primaryColor}15`,
            borderColor: `${currentTheme.primaryColor}35`,
            color: currentTheme.primaryColor,
          }}
        >
          <Wallet className="w-7 h-7 sm:w-8 sm:h-8" aria-hidden="true" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
              my<span style={{ color: currentTheme.primaryColor }}>Finance</span>
            </h1>
            <span
              className="px-2 py-0.5 text-[10px] font-bold rounded-full tracking-wide uppercase border"
              style={{
                backgroundColor: `${currentTheme.primaryColor}18`,
                borderColor: `${currentTheme.primaryColor}35`,
                color: currentTheme.primaryColor,
              }}
            >
              DEV CLOUD
            </span>
          </div>
          <p className="text-xs text-zinc-400">Controle financeiro pessoal de alta precisão</p>
        </div>
      </div>

      {/* Controles do Cabeçalho: Temas, Nuvem, Perfil do Usuário, Som e Contador */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
        {/* Botão de Temas Dev */}
        {onOpenThemeModal && (
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              onOpenThemeModal()
            }}
            title={`Tema atual: ${currentTheme.name} (Clique para alterar)`}
            aria-label="Alterar tema de desenvolvedor"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition-all cursor-pointer hover:scale-105 active:scale-95 group"
            style={{
              backgroundColor: `${currentTheme.primaryColor}15`,
              borderColor: `${currentTheme.primaryColor}40`,
              color: currentTheme.primaryColor,
            }}
          >
            <Palette className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden xs:inline">{currentTheme.name}</span>
            <span
              className="w-2 h-2 rounded-full shadow-xs"
              style={{ backgroundColor: currentTheme.primaryColor }}
            />
          </button>
        )}

        {/* Indicador de Conexão em Nuvem */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium backdrop-blur-md bg-white/5 border-white/10 text-zinc-300"
          title={
            user ? `Sincronizado na nuvem como ${user.email}` : 'Conectado ao Supabase PostgreSQL'
          }
        >
          <Cloud
            className="w-3.5 h-3.5 animate-pulse"
            style={{ color: currentTheme.primaryColor }}
            aria-hidden="true"
          />
          <span className="hidden sm:inline">Nuvem Ativa</span>
        </div>

        {/* Perfil do Usuário Logado */}
        {user && (
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-2xl glass-pill border border-white/10">
            <div
              className="w-7 h-7 rounded-xl font-bold text-xs flex items-center justify-center border"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              {userInitial}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-medium text-white block leading-tight truncate max-w-30">
                {user.name || user.email}
              </span>
              <span className="text-[10px] text-zinc-400 block leading-tight">Autenticado</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                title="Encerrar sessão"
                aria-label="Sair da conta"
                className="p-1.5 text-zinc-400 hover:text-rose-400 transition-colors cursor-pointer rounded-lg hover:bg-white/5"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
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
            soundEnabled ? 'text-white border-white/20' : 'text-zinc-500 hover:text-zinc-300'
          }`}
          style={{
            borderColor: soundEnabled ? `${currentTheme.primaryColor}50` : undefined,
            color: soundEnabled ? currentTheme.primaryColor : undefined,
          }}
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
