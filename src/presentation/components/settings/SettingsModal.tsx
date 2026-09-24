import { Check, Coins, Moon, Palette, Settings, Sparkles, Sun, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { type CurrencyCode, useCurrency } from '../../../core/currency/currencyContext'
import { soundFX } from '../../../core/sound/soundEffects'
import { type ThemeId, useTheme } from '../../../core/theme/themeContext'

export interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: 'general' | 'themes'
}

export function SettingsModal({ isOpen, onClose, initialTab = 'general' }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'themes'>(initialTab)

  const { currentTheme, setTheme, availableThemes, isDarkMode, setThemeMode } = useTheme()

  const { currentCurrency, setCurrency, availableCurrencies, formatValue } = useCurrency()

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab)
    }
  }, [isOpen, initialTab])

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

  const handleSelectCurrency = (code: CurrencyCode) => {
    soundFX.playClick()
    setCurrency(code)
  }

  const handleSelectTheme = (id: ThemeId) => {
    soundFX.playClick()
    setTheme(id)
  }

  const handleToggleThemeMode = (mode: 'dark' | 'light') => {
    soundFX.playClick()
    setThemeMode(mode)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Conteúdo Principal do Modal */}
      <div className="glass-card max-w-2xl w-full p-5 sm:p-7 rounded-3xl space-y-6 border border-white/15 shadow-[0_25px_70px_rgba(0,0,0,0.9)] relative z-10 max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${currentTheme.primaryColor}20`,
                borderColor: `${currentTheme.primaryColor}40`,
                color: currentTheme.primaryColor,
              }}
            >
              <Settings className="w-5 h-5 animate-spin-slow" aria-hidden="true" />
            </div>
            <div>
              <h2 id="settings-modal-title" className="text-lg font-bold text-white tracking-tight">
                Configurações do Sistema
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Personalize a moeda local, temas e preferências visuais
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de configurações"
            className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Seletor de Abas */}
        <div className="flex items-center gap-2 p-1 bg-white/5 rounded-2xl border border-white/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('general')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'general'
                ? 'bg-white/15 text-white shadow-sm border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Geral & Moeda</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('themes')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-white/15 text-white shadow-sm border border-white/10'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5 border border-transparent'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Temas Dev ({availableThemes.length})</span>
          </button>
        </div>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-6">
          {activeTab === 'general' ? (
            <>
              {/* Seção 1: Aparência (Tema Dark vs Tema Branco Normal) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-amber-400" />
                    <h3 className="text-sm font-bold text-white">Aparência do Aplicativo</h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Modo Atual:{' '}
                    <strong className="text-white">
                      {isDarkMode ? 'Tema Dark' : 'Tema Branco Normal'}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Opção Tema Dark */}
                  <button
                    type="button"
                    onClick={() => handleToggleThemeMode('dark')}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                      isDarkMode
                        ? 'ring-2 shadow-lg border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: isDarkMode ? `${currentTheme.primaryColor}15` : undefined,
                      borderColor: isDarkMode ? currentTheme.primaryColor : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/15 flex items-center justify-center text-zinc-200">
                          <Moon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white block">Tema Dark</span>
                          <span className="text-[10px] text-zinc-400">Modo escuro noturno</span>
                        </div>
                      </div>
                      {isDarkMode && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1"
                          style={{
                            backgroundColor: currentTheme.primaryColor,
                            color: '#090a0f',
                          }}
                        >
                          <Check className="w-3 h-3 stroke-3" />
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Interface escura com alto contraste, efeitos translúcidos e descanso para os
                      olhos.
                    </p>
                  </button>

                  {/* Opção Tema Branco Normal */}
                  <button
                    type="button"
                    onClick={() => handleToggleThemeMode('light')}
                    className={`p-4 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                      !isDarkMode
                        ? 'ring-2 shadow-lg border-white/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                    style={{
                      backgroundColor: !isDarkMode ? '#05966915' : undefined,
                      borderColor: !isDarkMode ? '#059669' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-white border border-zinc-300 flex items-center justify-center text-amber-500 shadow-sm">
                          <Sun className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-bold text-sm text-white block">
                            Tema Branco Normal
                          </span>
                          <span className="text-[10px] text-zinc-400">Modo claro clean</span>
                        </div>
                      </div>
                      {!isDarkMode && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1 bg-emerald-600 text-white">
                          <Check className="w-3 h-3 stroke-3" />
                          Ativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Fundo claro suave, cartões brancos com sombras limpas e máxima nitidez à luz
                      do dia.
                    </p>
                  </button>
                </div>
              </div>

              {/* Seção 2: Escolha da Moeda Local */}
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-white">Escolha da Moeda Local</h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Moeda ativa:{' '}
                    <strong className="text-white">
                      {currentCurrency.code} ({currentCurrency.symbol})
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {availableCurrencies.map((curr) => {
                    const isSelected = currentCurrency.code === curr.code
                    const sampleFormatted = formatValue(1250.5)

                    return (
                      <button
                        key={curr.code}
                        type="button"
                        onClick={() => handleSelectCurrency(curr.code)}
                        className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'ring-2 shadow-md'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                        }`}
                        style={{
                          backgroundColor: isSelected
                            ? `${currentTheme.primaryColor}18`
                            : undefined,
                          borderColor: isSelected ? currentTheme.primaryColor : undefined,
                        }}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xl" role="img" aria-label={curr.name}>
                              {curr.flag}
                            </span>
                            <div>
                              <span className="font-bold text-sm text-white block leading-tight">
                                {curr.code}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-medium block truncate max-w-28">
                                {curr.name}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5"
                              style={{
                                backgroundColor: currentTheme.primaryColor,
                                color: '#090a0f',
                              }}
                            >
                              <Check className="w-2.5 h-2.5 stroke-3" />
                              Ativa
                            </span>
                          )}
                        </div>

                        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                          <span className="text-zinc-400 text-[11px]">Símbolo: {curr.symbol}</span>
                          <span
                            className="font-mono font-bold text-xs"
                            style={{ color: currentTheme.primaryColor }}
                          >
                            {isSelected ? sampleFormatted : `${curr.symbol} 1.250,50`}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Aba: Temas de Desenvolvedor */
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Temas de Desenvolvedor</h3>
                  <p className="text-xs text-zinc-400">
                    Paletas inspiradas nas principais ferramentas e IDEs do mercado
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        boxShadow: isSelected
                          ? `0 10px 30px -5px ${theme.primaryColor}30`
                          : undefined,
                      }}
                    >
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
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400 shrink-0">
          <span>Suas preferências são salvas automaticamente neste navegador.</span>
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
