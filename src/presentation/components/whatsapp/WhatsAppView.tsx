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
      text: 'Olá! Sou o agente do myFinance. Experimente falar comigo por aqui ou conecte seu WhatsApp real para mandar áudios no dia a dia! 🚀\n\nTente digitar: *"Gastei 45 no almoço"* ou *"Recebi 1.200 de um freela"*',
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
    <div className="space-y-6 max-w-5xl mx-auto" id="section-whatsapp">
      {/* 1. CABEÇALHO HERO COM IDENTIDADE DA IA */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/4 border border-white/10 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0 shadow-lg shadow-emerald-500/10">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  WhatsApp Inteligente (IA)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 2.0 Flash
                </span>
                {integration?.isActive ? (
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    CONECTADO
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-3xs font-bold bg-zinc-800 text-zinc-400 border border-white/10">
                    NÃO CONECTADO
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
                Lance despesas, receitas e consulte seu saldo financeiro diretamente pelo WhatsApp
                enviando <strong>mensagens de voz ou texto</strong>. Nosso agente inteligente
                categoriza e registra tudo automaticamente no seu extrato.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {integration?.isActive ? (
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Desconectar</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerateCode}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <QrCode className="w-4 h-4" />
                )}
                <span>{activationCode ? 'Gerar Novo Código' : 'Conectar meu WhatsApp'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CARD DE CONEXÃO & QR CODE (SE NÃO ESTIVER ATIVO) */}
      {!integration?.isActive && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white/4 border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Passo a Passo de Ativação
              </h2>
            </div>
            <a
              href="http://localhost:8080/manager"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 text-2xs font-semibold transition-colors"
            >
              <span>Painel Evolution</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bloco 1: QR Code do Aparelho */}
            <div className="p-4 rounded-2xl bg-black/40 border border-white/8 flex flex-col items-center text-center justify-center space-y-3">
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-emerald-400">
                  1. Conectar Aparelho do Bot
                </span>
                <button
                  type="button"
                  onClick={fetchEvolutionQrCode}
                  disabled={loadingQr}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
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
                  2. Vincular com sua Conta
                </span>
                <p className="text-2xs text-zinc-300 leading-relaxed">
                  Para o robô saber que as mensagens são suas, você precisa enviar o comando com o
                  código temporário abaixo:
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
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer"
                    >
                      Gerar Código de 6 Dígitos
                    </button>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-white/3 border border-white/8 text-2xs text-zinc-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  O código expira em 15 minutos e garante que apenas seu número tenha acesso aos
                  seus dados financeiros.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. GUIA VISUAL DE EXEMPLOS DE VOZ E TEXTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white/4 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Mic className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Por Áudio</h3>
          </div>
          <p className="text-2xs text-zinc-400 leading-relaxed">
            Grave um áudio natural no WhatsApp dizendo o que gastou ou recebeu:
          </p>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
            "Almocei no restaurante da esquina e paguei 42 reais no débito"
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/4 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Send className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Texto Rápido</h3>
          </div>
          <p className="text-2xs text-zinc-400 leading-relaxed">
            Mensagens simples e sem burocracia, a IA entende contexto e valores:
          </p>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
            "Recebi 1.500 de freela de design hoje"
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white/4 border border-white/10 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <HelpCircle className="w-4 h-4" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Consultas</h3>
          </div>
          <p className="text-2xs text-zinc-400 leading-relaxed">
            Pergunte pelo seu saldo e totais acumulados no período:
          </p>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-xs text-zinc-200 font-medium italic">
            "Qual meu saldo e quanto gastei este mês?"
          </div>
        </div>
      </div>

      {/* 4. SIMULADOR DO AGENTE DE IA (PLAYGROUND) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white/4 border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Simulador do Agente de IA (Playground)
            </h2>
          </div>
          <span className="text-3xs text-cyan-300 font-mono bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
            Teste em Tempo Real
          </span>
        </div>

        {/* Histórico do Chat */}
        <div className="space-y-3 max-h-80 overflow-y-auto p-4 rounded-2xl bg-black/40 border border-white/5 custom-scrollbar">
          {simMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] sm:max-w-md p-3 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none shadow-md shadow-emerald-600/10'
                    : 'bg-white/8 text-zinc-200 border border-white/10 rounded-bl-none shadow-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className="text-3xs opacity-60 mt-1 block text-right font-mono">
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

        {/* Input e Sugestões */}
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
    </div>
  )
}
