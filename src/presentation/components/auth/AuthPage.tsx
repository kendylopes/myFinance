import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
  UserCheck,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react'
import { type FormEvent, useState } from 'react'
import type { AuthResult } from '../../../core/auth/authService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'

interface AuthPageProps {
  onLogin: (email: string, pass: string) => Promise<AuthResult>
  onRegister: (email: string, pass: string, name?: string) => Promise<AuthResult>
}

type AuthMode = 'login' | 'register'

export const AuthPage = ({ onLogin, onRegister }: AuthPageProps) => {
  const toast = useToast()
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

  const handleDismissError = () => {
    soundFX.playClick()
    setErrorMessage(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessMessage(null)

    const cleanEmail = email.trim()
    if (!cleanEmail?.includes('@')) {
      soundFX.playError()
      setErrorMessage('Por favor, informe um endereço de e-mail válido.')
      return
    }

    if (password.length < 6) {
      soundFX.playError()
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.')
      return
    }

    if (mode === 'register' && password !== confirmPassword) {
      soundFX.playError()
      setErrorMessage('As senhas digitadas não coincidem.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'login') {
        const result = await onLogin(cleanEmail, password)
        if (result.success) {
          toast.dismissAll()
          soundFX.playSuccess()
          toast.success('Bem-vindo de volta!', 'Login realizado com sucesso.')
        } else {
          soundFX.playError()
          const err =
            result.error || 'E-mail ou senha incorretos. Verifique seus dados e tente novamente.'
          setErrorMessage(err)
        }
      } else {
        const result = await onRegister(cleanEmail, password, name)
        if (result.success) {
          toast.dismissAll()
          soundFX.playSuccess()
          toast.success('Conta criada!', 'Bem-vindo ao myFinance!')
          if (result.requiresEmailConfirmation) {
            setSuccessMessage(result.message || 'Conta criada! Verifique seu e-mail para ativar.')
          }
        } else {
          soundFX.playError()
          const err = result.error || 'Erro ao realizar cadastro.'
          setErrorMessage(err)
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
            <div className="flex items-center justify-center">
              <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
                myFinance
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Gestão financeira de alta precisão sincronizada 100% na nuvem
            </p>
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
          {errorMessage &&
            (() => {
              const isShortPassword = errorMessage.includes('mínimo 6 caracteres')
              const isInvalidEmail = errorMessage.includes('e-mail válido')
              const isMismatch = errorMessage.includes('não coincidem')
              const isUserAlreadyRegistered = errorMessage.toLowerCase().includes('já existe')
              const isExplicitUserNotFound =
                errorMessage.toLowerCase().includes('não está cadastrado') ||
                errorMessage.toLowerCase().includes('não localizada') ||
                errorMessage.toLowerCase().includes('não encontrado')

              // Determinar o título, ícone e cores contextuais sem redundância
              let title = 'Credenciais Incorretas'
              let cleanMessage =
                'O e-mail ou a senha digitados não conferem. Confira sua digitação e tente novamente.'
              let icon = <Lock className="w-4 h-4 text-rose-400" />
              let badgeBg = 'bg-rose-500/10 border-rose-500/25 text-rose-400'
              let borderColor = 'border-rose-500/30'

              if (isShortPassword) {
                title = 'Senha muito curta'
                cleanMessage = 'A senha precisa ter no mínimo 6 dígitos para continuar.'
                icon = <Lock className="w-4 h-4 text-amber-400" />
                badgeBg = 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                borderColor = 'border-amber-500/30'
              } else if (isInvalidEmail) {
                title = 'E-mail inválido'
                cleanMessage =
                  'Informe um endereço de e-mail no formato correto (ex: nome@exemplo.com).'
                icon = <Mail className="w-4 h-4 text-amber-400" />
                badgeBg = 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                borderColor = 'border-amber-500/30'
              } else if (isMismatch) {
                title = 'Senhas diferentes'
                cleanMessage = 'A confirmação deve ser idêntica à senha digitada.'
                icon = <Lock className="w-4 h-4 text-rose-400" />
                badgeBg = 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                borderColor = 'border-rose-500/30'
              } else if (isExplicitUserNotFound) {
                title = 'Conta não localizada'
                cleanMessage =
                  'Nenhuma conta foi encontrada com este e-mail. Crie seu acesso abaixo.'
                icon = <UserPlus className="w-4 h-4 text-emerald-400" />
                badgeBg = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                borderColor = 'border-emerald-500/30'
              } else if (isUserAlreadyRegistered) {
                title = 'E-mail já cadastrado'
                cleanMessage = 'Já existe uma conta com este e-mail. Acesse o login para entrar.'
                icon = <UserCheck className="w-4 h-4 text-emerald-400" />
                badgeBg = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
                borderColor = 'border-emerald-500/30'
              } else if (mode === 'register') {
                title = 'Falha no cadastro'
                cleanMessage = errorMessage
                icon = <AlertCircle className="w-4 h-4 text-amber-400" />
                badgeBg = 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                borderColor = 'border-amber-500/30'
              }

              return (
                <div
                  role="alert"
                  className={`mb-5 overflow-hidden rounded-2xl border ${borderColor} bg-linear-to-b from-zinc-900/95 to-zinc-950/95 p-4 backdrop-blur-md shadow-2xl shadow-black/70 animate-scale-in`}
                >
                  {/* Topo do Card: Ícone + Título + Botão Fechar/Sair */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl border ${badgeBg} shrink-0 mt-0.5 shadow-xs`}>
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-xs font-semibold text-zinc-100">{title}</h4>
                        <div className="flex items-center gap-1.5">
                          {isExplicitUserNotFound && (
                            <span className="text-[10px] font-medium text-emerald-400/90 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Novo por aqui?
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={handleDismissError}
                            className="p-1 text-zinc-400 hover:text-zinc-100 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                            aria-label="Fechar aviso"
                            title="Fechar aviso"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-[11.5px] text-zinc-300 leading-relaxed">{cleanMessage}</p>
                    </div>
                  </div>

                  {/* Barra de ação inferior do card */}
                  <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
                    {isExplicitUserNotFound ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDismissError}
                          className="py-1.5 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          Sair
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTabSwitch('register')}
                          className="py-2 px-3.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Criar conta com este e-mail</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : isUserAlreadyRegistered ? (
                      <>
                        <button
                          type="button"
                          onClick={handleDismissError}
                          className="py-1.5 px-3 text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        >
                          Sair
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTabSwitch('login')}
                          className="py-1.5 px-3.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 flex items-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Acessar minha conta</span>
                        </button>
                      </>
                    ) : mode === 'login' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleTabSwitch('register')}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer transition-colors"
                        >
                          Criar nova conta
                        </button>
                        <button
                          type="button"
                          onClick={handleDismissError}
                          className="py-1.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Sair do aviso
                        </button>
                      </>
                    ) : (
                      <div className="w-full flex justify-end">
                        <button
                          type="button"
                          onClick={handleDismissError}
                          className="py-1.5 px-3.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          Sair do aviso
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()}

          {successMessage && (
            <div
              role="status"
              className="mb-4 p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/30 text-emerald-200 text-xs flex items-start gap-2.5 animate-scale-in"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Formulário (desabilitado enquanto o aviso de erro estiver aberto) */}
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 transition-all duration-200 ${
              errorMessage
                ? 'opacity-35 pointer-events-none select-none filter blur-[0.4px]'
                : 'opacity-100'
            }`}
            aria-disabled={!!errorMessage}
          >
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
                    disabled={!!errorMessage || isSubmitting}
                    placeholder="Ex: Kennedy Lopes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!!errorMessage || isSubmitting}
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                  disabled={!!errorMessage || isSubmitting}
                  placeholder="Mínimo de 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  disabled={!!errorMessage || isSubmitting}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 cursor-pointer disabled:pointer-events-none"
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
                    disabled={!!errorMessage || isSubmitting}
                    placeholder="Repita sua senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!!errorMessage || isSubmitting}
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
