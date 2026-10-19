import {
  Bot,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  QrCode,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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

export interface WhatsAppIntegrationTabProps {
  userId?: string | null
  onAddTransaction?: (dto: CreateTransactionDTO) => Promise<boolean>
}

export function WhatsAppIntegrationTab({ userId, onAddTransaction }: WhatsAppIntegrationTabProps) {
  const toast = useToast()
  const [integration, setIntegration] = useState<WhatsAppIntegration | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activationCode, setActivationCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Estados do Simulador de IA
  const [simMessage, setSimMessage] = useState('')
  const [simLoading, setSimLoading] = useState(false)
  const [simMessages, setSimMessages] = useState<
    Array<{
      sender: 'user' | 'agent'
      text: string
      time: string
      actionData?: unknown
    }>
  >([
    {
      sender: 'agent',
      text: 'Olá! Sou o agente do myFinance. Você pode simular mensagens aqui ou conectar seu WhatsApp real abaixo! Tente digitar: *"Gastei 35 reais na farmácia"* 💊',
      time: 'Agora',
    },
  ])

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

  const handleSendSimMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = simMessage.trim()
    if (!text || simLoading) return

    soundFX.playClick()
    setSimMessage('')
    const time = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

    setSimMessages((prev) => [...prev, { sender: 'user', text, time }])
    setSimLoading(true)

    try {
      const res = await processFinanceAgentMessage({ message: text })

      setSimMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: res.replyText,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          actionData: res.proposedTransaction,
        },
      ])

      // Se houver transação proposta e o usuário desejar registrar
      if (res.proposedTransaction && onAddTransaction) {
        await onAddTransaction(res.proposedTransaction)
        toast.success(
          'Lançamento Realizado!',
          `Transação de R$ ${res.proposedTransaction.amount} salva no myFinance.`,
        )
      }
    } catch {
      setSimMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Ops, tive uma dificuldade para processar essa mensagem. Poderia tentar de novo?',
          time,
        },
      ])
    } finally {
      setSimLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. SEÇÃO DE VINCULAÇÃO REAL DO WHATSAPP */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/4 border border-white/10 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>WhatsApp Inteligente (IA)</span>
                {integration?.isActive ? (
                  <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    CONECTADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-3xs font-bold bg-zinc-700/50 text-zinc-400 border border-white/10">
                    NÃO CONECTADO
                  </span>
                )}
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Lance despesas e consulte saldo enviando áudios ou textos no WhatsApp.
              </p>
            </div>
          </div>

          {integration?.isActive ? (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-semibold hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Desconectar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGenerateCode}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <QrCode className="w-3.5 h-3.5" />
              )}
              <span>{activationCode ? 'Gerar Novo Código' : 'Conectar meu WhatsApp'}</span>
            </button>
          )}
        </div>

        {/* Exibição do Código de Ativação Seguro */}
        {activationCode && !integration?.isActive && (
          <div className="p-3.5 rounded-xl bg-black/40 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs text-zinc-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Seu Código de Ativação Temporário (Válido por 15 min):
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black tracking-widest text-emerald-300 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  {activationCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors cursor-pointer"
                  title="Copiar comando de ativação"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-2xs text-zinc-400 leading-relaxed">
              👉 Envie a mensagem{' '}
              <strong className="text-white font-mono">ATIVAR {activationCode}</strong> para o
              WhatsApp oficial do myFinance para vincular com segurança.
            </p>
          </div>
        )}
      </div>

      {/* 2. SIMULADOR DO AGENTE DE IA AO VIVO (PLAYGROUND) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white/4 border border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Simulador do Agente de IA (Playground)
            </h4>
          </div>
          <span className="text-3xs text-cyan-300 font-mono bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            Gemini 2.0 Flash
          </span>
        </div>

        {/* Caixa de Mensagens do Chat */}
        <div className="h-52 overflow-y-auto space-y-2.5 p-3 rounded-xl bg-black/40 border border-white/5 custom-scrollbar text-xs">
          {simMessages.map((msg) => (
            <div
              key={`${msg.sender}-${msg.time}-${msg.text.slice(0, 10)}`}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] p-2.5 rounded-2xl ${
                  msg.sender === 'user'
                    ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-100 rounded-tr-xs'
                    : 'bg-white/10 border border-white/10 text-zinc-200 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
              </div>
              <span className="text-3xs text-zinc-400 mt-0.5 px-1">{msg.time}</span>
            </div>
          ))}

          {simLoading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs pl-1">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              <span>O Agente está pensando...</span>
            </div>
          )}
        </div>

        {/* Formulário de Envio do Simulador */}
        <form onSubmit={handleSendSimMessage} className="flex gap-2">
          <input
            type="text"
            value={simMessage}
            onChange={(e) => setSimMessage(e.target.value)}
            placeholder="Ex: Gastei 45 no almoço, ou quanto tenho de saldo?"
            className="flex-1 bg-black/40 border border-white/10 focus:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-400 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!simMessage.trim() || simLoading}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Testar</span>
          </button>
        </form>

        {/* Sugestões Rápidas de Teste */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-3xs text-zinc-400 font-semibold uppercase">Sugestões:</span>
          {[
            'Gastei 55 reais no mercado',
            'Recebi 1.200 de um freela',
            'Paguei 30 de farmácia',
            'Qual meu saldo?',
          ].map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                setSimMessage(prompt)
              }}
              className="text-3xs px-2 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 cursor-pointer transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
