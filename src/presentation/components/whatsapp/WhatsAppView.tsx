import {
  Bot,
  Check,
  Copy,
  ExternalLink,
  HelpCircle,
  Loader2,
  MessageSquare,
  Mic,
  QrCode,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { processFinanceAgentMessage } from '../../../core/ai/financeAgentService'
import {
  disconnectWhatsApp,
  generateActivationCode,
  getWhatsAppIntegration,
  type WhatsAppIntegration,
} from '../../../core/integrations/whatsappIntegrationService'
import { soundFX } from '../../../core/sound/soundEffects'
import { useToast } from '../../../core/toast/toastContext'
import type { CreateTransactionDTO } from '../../../domain/models/transaction'

export interface WhatsAppViewProps {
  userId?: string | null
  onAddTransaction?: (dto: CreateTransactionDTO) => Promise<boolean>
}

export function WhatsAppView({ userId, onAddTransaction }: WhatsAppViewProps) {
  const toast = useToast()
  const [activeTab, setActiveTab] = useState<'playground' | 'connection' | 'guide'>('playground')
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activationCode, setActivationCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)

  // Estados do Simulador de IA (Playground)
  const [simMessage, setSimMessage] = useState('')
  const [simLoading, setSimLoading] = useState(false)
  const [simMessages, setSimMessages] = useState<
    Array<{
      id: string
      sender: 'user' | 'agent'
      text: string
      time: string
      actionData?: unknown
    }>
  >([
    {
      id: 'welcome-agent',
      sender: 'agent',
      text: 'Olá! Sou o agente inteligente do myFinance. Você pode conversar comigo aqui ou conectar seu WhatsApp para registrar lançamentos por áudio e texto no seu dia a dia! 🚀\n\nTente enviar: *"Gastei 45 no almoço"* ou *"Recebi 1.200 de um freela"*',
      time: 'Agora',
    },
  ])

  const fetchEvolutionQrCode = useCallback(async () => {
    setLoadingQr(true)
    try {
      const res = await fetch('http://localhost:8080/instance/connect/myfinance', {
        headers: {
          apikey: 'myfinance_secret_key_123456',
        },
      })
      if (!res.ok) throw new Error('Falha ao conectar')
      const data = await res.json()
      if (data?.base64) {
        setQrCodeBase64(data.base64)
      }
    } catch {
      // Ignora falha silenciosamente caso o container esteja indisponível
    } finally {
      setLoadingQr(false)
    }
  }, [])

  useEffect(() => {
    fetchEvolutionQrCode()
  }, [fetchEvolutionQrCode])

  useEffect(() => {
    if (!userId) return

    setIsLoading(true)
    getWhatsAppIntegration(userId)
      .then((data) => {
        setIntegration(data)
        if (data?.activationCode) {
          setActivationCode(data.activationCode)
        }
      })
      .finally(() => setIsLoading(false))
  }, [userId])

  const handleGenerateCode = async () => {
    if (!userId) {
      toast.warning('Atenção', 'Faça login com sua conta para vincular seu WhatsApp.')
      return
    }

    soundFX.playClick()
    setIsLoading(true)
    try {
      const code = await generateActivationCode(userId)
      setActivationCode(code)
      setActiveTab('connection')
      fetchEvolutionQrCode()
      toast.success('Código Gerado!', `Envie "ATIVAR ${code}" no WhatsApp oficial do myFinance.`)
    } catch {
      toast.error('Erro', 'Não foi possível gerar o código. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyCode = () => {
    if (!activationCode) return
    soundFX.playClick()
    navigator.clipboard.writeText(`ATIVAR ${activationCode}`)
    setCopied(true)
    toast.info('Copiado', 'Comando de ativação copiado para a área de transferência!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDisconnect = async () => {
    if (!userId) return
    soundFX.playClick()
    setIsLoading(true)
    const success = await disconnectWhatsApp(userId)
    if (success) {
      setIntegration(null)
      setActivationCode(null)
      toast.info('Desconectado', 'Seu WhatsApp foi desvinculado com sucesso.')
    }
    setIsLoading(false)
  }

  const handleSendSimMessage = async (customText?: string) => {
    const text = (customText || simMessage).trim()
    if (!text || simLoading) return

    soundFX.playClick()
    if (!customText) setSimMessage('')
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    const userMsgId = `user-${Date.now()}`
    setSimMessages((prev) => [...prev, { id: userMsgId, sender: 'user', text, time }])
    setSimLoading(true)

    try {
      const res = await processFinanceAgentMessage({ message: text })

      const agentMsgId = `agent-${Date.now()}`
      setSimMessages((prev) => [
        ...prev,
        {
          id: agentMsgId,
          sender: 'agent',
          text: res.replyText,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actionData: res.proposedTransaction,
        },
      ])

      // Se houver transação proposta, persiste no extrato
      if (res.proposedTransaction && onAddTransaction) {
        await onAddTransaction(res.proposedTransaction)
        toast.success(
          'Lançamento Realizado!',
          `Transação de R$ ${res.proposedTransaction.amount} salva no myFinance.`,
        )
      }
    } catch {
      const errorMsgId = `error-${Date.now()}`
      setSimMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'agent',
          text: 'Ops, tive uma dificuldade para processar essa mensagem. Poderia tentar de novo?',
          time,
        },
      ])
    } finally {
      setSimLoading(false)
    }
  }

  const examplePrompts = [
    'Gastei 55 reais no mercado',
    'Recebi 1.200 de um freela',
    'Paguei 30 de farmácia',
    'Qual meu saldo atual?',
  ]

  return (
    <div className="space-y-6 animate-fade-in" id="section-whatsapp">
      {/* 1. CARDS ANALÍTICOS DE KPI PADRONIZADOS (4 CARDS) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Status do WhatsApp */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Status do WhatsApp
            </span>
            <div
              className={`p-1.5 sm:p-2 rounded-xl ${
                integration?.isActive
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                integration?.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
              }`}
            />
            <span className="text-base sm:text-xl font-black text-white tracking-tight">
              {integration?.isActive ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
          <p className="text-2xs sm:text-[11px] text-zinc-400 truncate">
            {integration?.phoneNumber ? `+${integration.phoneNumber}` : 'Aguardando pareamento'}
          </p>
        </div>

        {/* Card 2: Motor de Inteligência Artificial */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Motor de IA
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-cyan-300 tracking-tight">
            Gemini 2.0 Flash
          </div>
          <p className="text-2xs sm:text-[11px] text-zinc-400 truncate">
            Function Calling em tempo real
          </p>
        </div>

        {/* Card 3: Formatos de Entrada */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Formatos de Entrada
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-violet-500/10 text-violet-400">
              <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-white tracking-tight">
            Áudio & Texto
          </div>
          <p className="text-2xs sm:text-[11px] text-zinc-400 truncate">
            Mensagens de voz naturais ou texto
          </p>
        </div>

        {/* Card 4: Segurança & RLS */}
        <div className="glass-card p-4 sm:p-5 rounded-3xl border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider truncate">
              Segurança
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div className="text-base sm:text-xl font-black text-emerald-400 tracking-tight">
            100% Isolado
          </div>
          <p className="text-2xs sm:text-[11px] text-zinc-400 truncate">Row Level Security ativo</p>
        </div>
      </div>

      {/* 2. SELETOR DE ABAS & TOOLBAR DE AÇÕES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Abas Segmentadas Canônicas do myFinance */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/4 border border-white/10 w-fit shadow-inner">
          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('playground')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'playground'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>Simulador de IA</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('connection')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'connection'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Conexão & QR Code</span>
            {activationCode && !integration?.isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              soundFX.playClick()
              setActiveTab('guide')
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Como Usar</span>
          </button>
        </div>

        {/* Botões de Ação na Toolbar */}
        <div className="flex items-center gap-2">
          {integration?.isActive ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <QrCode className="w-3.5 h-3.5" />
              )}
              <span>{activationCode ? 'Novo Código' : 'Conectar WhatsApp'}</span>
            </button>
          )}

          <a
            href="http://localhost:8080/manager"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-xs font-semibold transition-colors"
            title="Abrir painel visual da Evolution API"
          >
            <span>Painel Evolution</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 3. CONTEÚDO DA ABA SELECIONADA */}

      {/* ABA 1: SIMULADOR DE IA (PLAYGROUND) */}
      {activeTab === 'playground' && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                Simulador do Agente de IA
              </h2>
            </div>
            <span className="text-3xs text-cyan-300 font-mono bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
              Teste em Tempo Real
            </span>
          </div>

          {/* Histórico do Chat */}
          <div className="space-y-3 min-h-64 max-h-96 overflow-y-auto p-4 rounded-2xl bg-black/40 border border-white/5 custom-scrollbar">
            {simMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/10'
                      : 'bg-white/8 text-zinc-200 border border-white/10 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className="text-3xs opacity-60 mt-1.5 block text-right font-mono">
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {simLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>O Agente está pensando...</span>
              </div>
            )}
          </div>

          {/* Formulário de Envio */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendSimMessage()
            }}
            className="space-y-3"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder="Ex: Gastei 45 no almoço, ou quanto tenho de saldo?"
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400 transition-colors"
              />
              <button
                type="submit"
                disabled={simLoading || !simMessage.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-3xs text-zinc-500 uppercase font-bold tracking-wider">
                Sugestões Rápidas:
              </span>
              {examplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handleSendSimMessage(prompt)}
                  className="text-3xs px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* ABA 2: CONEXÃO & QR CODE */}
      {activeTab === 'connection' && (
        <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Painel de Conexão do WhatsApp
              </h2>
            </div>
            {integration?.isActive && (
              <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Ativo e Vinculado
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: QR Code do Aparelho */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/8 flex flex-col items-center text-center justify-center space-y-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-emerald-400">
                  1. Parear Aparelho (Evolution API)
                </span>
                <button
                  type="button"
                  onClick={fetchEvolutionQrCode}
                  disabled={loadingQr}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Atualizar QR Code"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingQr ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {qrCodeBase64 ? (
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-white/20">
                  <img
                    src={qrCodeBase64}
                    alt="QR Code WhatsApp"
                    className="w-44 h-44 rounded-xl object-contain"
                  />
                </div>
              ) : (
                <div className="w-44 h-44 rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center p-3 text-zinc-500">
                  <QrCode className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-3xs">QR Code pronto no gerenciador</span>
                </div>
              )}

              <p className="text-2xs text-zinc-400 max-w-xs leading-relaxed">
                Abra o WhatsApp no celular &gt; <strong>Aparelhos Conectados</strong> &gt;{' '}
                <strong>Conectar um aparelho</strong> e aponte a câmera.
              </p>
            </div>

            {/* Bloco 2: Código de Ativação do Usuário */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/8 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-cyan-400 block mb-2">
                  2. Vincular sua Conta
                </span>
                <p className="text-2xs text-zinc-300 leading-relaxed">
                  Para o robô associar as mensagens ao seu extrato, envie o comando com seu código
                  temporário de 6 dígitos:
                </p>

                {activationCode ? (
                  <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-3xs text-emerald-400 uppercase font-bold tracking-wider block">
                        Comando para Enviar
                      </span>
                      <span className="font-mono text-lg font-black text-white tracking-widest">
                        ATIVAR {activationCode}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition-colors cursor-pointer"
                      title="Copiar comando"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="mt-3 p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-2xs text-zinc-400 mb-2.5">Nenhum código ativo no momento.</p>
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      disabled={isLoading}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Gerar Código de 6 Dígitos
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-2xs text-zinc-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O código expira em 15 minutos e garante que apenas seu número autenticado tenha
                  acesso aos seus dados financeiros.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: COMO USAR & GUIA DE COMANDOS */}
      {activeTab === 'guide' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400">
              <Mic className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Por Áudio</h3>
            </div>
            <p className="text-2xs text-zinc-400 leading-relaxed">
              Grave um áudio no WhatsApp dizendo o que gastou ou recebeu, exatamente como fala no
              dia a dia:
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
              "Almocei no restaurante da esquina e paguei 42 reais no débito"
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400">
              <Send className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                Texto Rápido
              </h3>
            </div>
            <p className="text-2xs text-zinc-400 leading-relaxed">
              Mensagens diretas e sem burocracia, a IA entende contexto, categorias e valores:
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
              "Recebi 1.500 de freela de design hoje"
            </div>
          </div>

          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400">
              <HelpCircle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Consultas</h3>
            </div>
            <p className="text-2xs text-zinc-400 leading-relaxed">
              Pergunte pelo seu saldo e totais acumulados no período selecionado:
            </p>
            <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
              "Qual meu saldo e quanto gastei este mês?"
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
