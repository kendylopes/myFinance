import { CheckCircle2, Eye, EyeOff, Lock, Mail, Sparkles, User, X } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import type { AuthResult } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (email: string, pass: string) => Promise<AuthResult>
  onRegister: (email: string, pass: string, name?: string) => Promise<AuthResult>
}

type AuthMode = 'login' | 'register'

export const AuthModal = ({ isOpen, onClose, onLogin, onRegister }: AuthModalProps) => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Reset de campos ao alternar modo ou abrir
  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null)
      setSuccessMessage(null)
    }
  }, [isOpen])

  // Fechar com tecla ESC
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

  const handleTabSwitch = (newMode: AuthMode) => {
    soundFX.playClick()
    setMode(newMode)
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim()
    if (!cleanEmail?.includes('@')) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.')
      return
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await onLogin(cleanEmail, password)
        if (result.success) {
          soundFX.playSuccess()
          onClose()
        } else {
          setErrorMessage(result.error || 'Erro ao realizar login.')
        }
      } else {
        const result = await onRegister(cleanEmail, password, name)
        if (result.success) {
          soundFX.playSuccess()
          if (result.requiresEmailConfirmation) {
            setSuccessMessage(
              result.message || 'Conta criada! Verifique seu e-mail para confirmar.',
            )
          } else {
            onClose()
          }
        } else {
          setErrorMessage(result.error || 'Erro ao realizar cadastro.')
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {/* Backdrop click to close */}
      <button
        type="button"
        className="fixed inset-0 w-full h-full cursor-default bg-transparent border-none"
        aria-label="Fechar janela modal"
        onClick={onClose}
      />

      {/* Card Container com Spotlight e Glassmorphism */}
      <div className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 glass-card border border-white/10 shadow-2xl shadow-black/80 z-10 overflow-hidden">
        {/* Glow Superior */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Botão de Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all cursor-pointer"
          aria-label="Fechar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho do Modal */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 id="auth-modal-title" className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Acessar myFinance' : 'Criar Conta na Nuvem'}
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login'
              ? 'Entre com suas credenciais para sincronizar suas finanças'
              : 'Cadastre-se para ter seu extrato seguro e sincronizado no Supabase'}
          </p>
        </div>

        {/* Tabs de Seleção de Modo */}
        <div className="flex p-1 bg-black/40 rounded-2xl border border-white/5 mb-6">
          <button
            type="button"
            onClick={() => handleTabSwitch('login')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('register')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        {/* Alertas de Erro ou Sucesso */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5 animate-scale-in"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-scale-in"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label htmlFor="auth-name" className="block text-xs font-medium text-zinc-300 mb-1.5">
                Nome Completo (ou apelido)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Ex: Kennedy Lopes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-medium text-zinc-300 mb-1.5">
              E-mail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                placeholder="seu.email@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-medium text-zinc-300 mb-1.5"
            >
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="Mínimo de 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label
                htmlFor="auth-confirm-password"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="auth-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Repita sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full relative overflow-hidden py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-2xl shadow-lg shadow-emerald-500/25 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {/* Shimmer sweep effect */}
            <span
              className="absolute inset-0 w-1/2 h-full bg-linear-to-r from-transparent via-white/30 to-transparent -skew-x-12 animate-shimmer-sweep pointer-events-none"
              aria-hidden="true"
            />
            {isSubmitting ? (
              <span className="inline-block w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              'Entrar no myFinance'
            ) : (
              'Criar Minha Conta'
            )}
          </button>
        </form>

        <div className="mt-5 text-center">
          <p className="text-[11px] text-zinc-500">
            {mode === 'login' ? (
              <>
                Ainda não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('register')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
                >
                  Cadastre-se gratuitamente
                </button>
              </>
            ) : (
              <>
                Já possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => handleTabSwitch('login')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
                >
                  Faça login aqui
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
