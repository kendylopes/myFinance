import { Check, Sparkles, X } from 'lucide-react'
import { useEffect } from 'react'
import { soundFX } from '../../../core/sound/soundEffects'
import { type ThemeId, useTheme } from '../../../core/theme/themeContext'

interface ThemeSelectorModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ThemeSelectorModal({ isOpen, onClose }: ThemeSelectorModalProps) {
  const { currentTheme, setTheme, availableThemes } = useTheme()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleSelectTheme = (id: ThemeId) => {
    soundFX.playClick()
    setTheme(id)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md animate-fade-in"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Conteúdo do Modal */}
      <div className="glass-card max-w-xl w-full p-6 sm:p-7 rounded-3xl space-y-6 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              <Sparkles className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="theme-modal-title" className="text-lg font-bold text-white tracking-tight">
                Temas de Desenvolvedor
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Escolha a paleta de cores inspirada nas IDEs mais utilizadas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de temas"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Lista de Temas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {availableThemes.map((theme) => {
            const isSelected = currentTheme.id === theme.id

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => handleSelectTheme(theme.id)}
                className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                  isSelected
                    ? 'ring-2 shadow-lg'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                }`}
                style={{
                  backgroundColor: isSelected ? `${theme.primaryColor}18` : undefined,
                  borderColor: isSelected ? theme.primaryColor : undefined,
                  boxShadow: isSelected ? `0 10px 30px -5px ${theme.primaryColor}30` : undefined,
                }}
              >
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{theme.name}</span>
                      {isSelected && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
                          style={{
                            backgroundColor: theme.primaryColor,
                            color: '#090a0f',
                          }}
                        >
                          <Check className="w-3 h-3 stroke-3" />
                          Ativo
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-0.5">
                      {theme.tag}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-zinc-300 line-clamp-2 mb-3 leading-relaxed">
                  {theme.description}
                </p>

                {/* Swatches de Cores */}
                <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                  {theme.previewColors.map((color) => (
                    <span
                      key={color}
                      className="w-5 h-5 rounded-full border border-black/40 shadow-xs"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <span
                    className="ml-auto text-[11px] font-semibold"
                    style={{ color: theme.primaryColor }}
                  >
                    Visualizar →
                  </span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer do Modal */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
          <span>O tema é salvo automaticamente nas suas preferências locais.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  )
}
