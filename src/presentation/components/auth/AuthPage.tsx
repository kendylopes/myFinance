import {
  CheckCircle2,
  Cloud,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PieChart,
  ShieldCheck,
  User,
  Wallet,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { AuthResult } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<AuthResult>
  onRegister: (email: string, pass: string, name?: string) => Promise<AuthResult>
}

type AuthMode = 'login' | 'register'

export const AuthPage = ({ onLogin, onRegister }: AuthPageProps) => {
  const [mode, setMode] = useState<AuthMode>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
        } else {
          setErrorMessage(result.error || 'Erro ao realizar login.')
        }
      } else {
        const result = await onRegister(cleanEmail, password, name)
        if (result.success) {
          soundFX.playSuccess()
          if (result.requiresEmailConfirmation) {
            setSuccessMessage(result.message || 'Conta criada! Verifique seu e-mail para ativar.')
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
    <div className="relative min-h-screen bg-[#111215] text-zinc-100 antialiased p-4 md:p-8 selection:bg-emerald-500/30 selection:text-emerald-200 overflow-x-hidden flex items-center justify-center bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,255,255,0.03),rgba(17,18,21,0))]">
      {/* Background Ambient Glow Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-125 h-125 bg-emerald-500/10 rounded-full blur-[140px] animate-liquid-slow" />
        <div className="absolute top-1/4 -right-40 w-137.5 h-137.5 bg-zinc-400/8 rounded-full blur-[150px] animate-liquid-reverse" />
        <div className="absolute top-1/2 left-1/4 w-100 h-100 bg-emerald-500/5 rounded-full blur-[160px] animate-iridescent" />
        <div className="absolute -bottom-28 left-1/3 w-150 h-112.5 bg-zinc-500/10 rounded-full blur-[160px] animate-liquid-slow" />
      </div>

      <div className="relative z-10 w-full max-w-md my-8 space-y-6">
        {/* Brand & Apresentação */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-3xl backdrop-blur-md shadow-xl shadow-emerald-500/10">
            <Wallet className="w-10 h-10 text-emerald-400" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                myFinance
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded-full tracking-wide">
                CLOUD
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Gestão financeira de alta precisão sincronizada 100% na nuvem
            </p>
          </div>

          {/* Badges de Benefícios */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[11px] text-zinc-300">
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
              <Cloud className="w-3 h-3 text-emerald-400" />
              PostgreSQL
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Segurança RLS
            </span>
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/5">
              <PieChart className="w-3 h-3 text-emerald-400" />
              Metas & Relatórios
            </span>
          </div>
        </div>

        {/* Card Principal de Autenticação */}
        <div className="relative rounded-3xl p-6 sm:p-8 glass-card border border-white/10 shadow-2xl shadow-black/80 overflow-hidden">
          <div
            className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"
            aria-hidden="true"
          />

          {/* Abas Entrar / Criar Conta */}
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
              Acessar Conta
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
              Criar Nova Conta
            </button>
          </div>

          {/* Feedback de Erro ou Sucesso */}
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
                <label
                  htmlFor="page-auth-name"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Nome Completo (ou como prefere ser chamado)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="page-auth-name"
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
              <label
                htmlFor="page-auth-email"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="page-auth-email"
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
                htmlFor="page-auth-password"
                className="block text-xs font-medium text-zinc-300 mb-1.5"
              >
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="page-auth-password"
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
                  htmlFor="page-auth-confirm-password"
                  className="block text-xs font-medium text-zinc-300 mb-1.5"
                >
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="page-auth-confirm-password"
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

          {/* Rodapé Alternador */}
          <div className="mt-5 text-center">
            <p className="text-[11px] text-zinc-500">
              {mode === 'login' ? (
                <>
                  Novo por aqui?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('register')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Crie sua conta na nuvem
                  </button>
                </>
              ) : (
                <>
                  Já tem conta registrada?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('login')}
                    className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
                  >
                    Acesse seu extrato
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
