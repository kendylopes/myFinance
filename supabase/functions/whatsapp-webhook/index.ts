// ==============================================================================
// 🤖 myFinance — Webhook do Agente de IA para WhatsApp
// Supabase Edge Function (Deno / TypeScript)
// ==============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.48.0'

interface WebhookPayload {
  // Padrão Evolution API
  event?: string
  data?: {
    key?: {
      remoteJid?: string
      fromMe?: boolean
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text?: string
      }
      audioMessage?: {
        url?: string
        base64?: string
        mimetype?: string
      }
    }
    messageType?: string
  }
  // Padrão Meta Cloud API Oficial
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string
          type?: string
          text?: { body?: string }
          audio?: { id?: string }
        }>
      }
    }>
  }>
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') || ''
const EVOLUTION_API_URL = Deno.env.get('EVOLUTION_API_URL') || ''
const EVOLUTION_API_KEY = Deno.env.get('EVOLUTION_API_KEY') || ''

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

/**
 * Envia mensagem de resposta via WhatsApp (Evolution API)
 */
async function sendWhatsAppMessage(remoteJid: string, text: string) {
  if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY) {
    console.log(`[WhatsApp Mock Send] Para: ${remoteJid} | Mensagem:\n${text}`)
    return
  }

  try {
    const cleanNumber = remoteJid.replace('@s.whatsapp.net', '')
    const endpoint = `${EVOLUTION_API_URL.replace(/\/$/, '')}/message/sendText/myfinance`

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text,
        delay: 1200,
      }),
    })
  } catch (err) {
    console.error('[WhatsApp Send Error]:', err)
  }
}

/**
 * Processa a mensagem do usuário via Gemini com Function Calling
 */
async function processWithGemini(userText: string, today: string) {
  const prompt = `Data de hoje: ${today}.
Categorias válidas do myFinance: [Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Compras, Contas Fixas, Trabalho, Investimentos, Outros].
Mensagem do usuário: "${userText}"`

  const systemInstruction = `Você é o myFinance Bot no WhatsApp. Você registra gastos, ganhos e consulta saldos.
Sempre que o usuário mencionar uma despesa ou receita, chame a ferramenta 'create_transaction'.
Se o usuário perguntar o saldo, chame 'query_summary'.
Se for apenas saudação, responda com cordialidade e emojis.`

  const tools = [
    {
      functionDeclarations: [
        {
          name: 'create_transaction',
          description: 'Cria uma nova movimentação financeira no myFinance.',
          parameters: {
            type: 'OBJECT',
            properties: {
              type: { type: 'STRING', enum: ['income', 'expense'] },
              amount: { type: 'NUMBER', description: 'Valor positivo em reais' },
              title: { type: 'STRING', description: 'Título/Nome da despesa ou receita' },
              category: { type: 'STRING', description: 'Categoria compatível' },
              date: { type: 'STRING', description: 'Data no formato YYYY-MM-DD' },
              status: { type: 'STRING', enum: ['paid', 'pending'] },
            },
            required: ['type', 'amount', 'title', 'category', 'date'],
          },
        },
        {
          name: 'query_summary',
          description: 'Consulta saldo atual e totais de receitas e despesas.',
          parameters: {
            type: 'OBJECT',
            properties: {
              period: { type: 'STRING', enum: ['current_month'] },
            },
          },
        },
      ],
    },
  ]

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        tools,
        generationConfig: { temperature: 0.1 },
      }),
    },
  )

  return await response.json()
}

Deno.serve(async (req) => {
  // Resposta para validação de Webhook GET (Meta Cloud API Webhook Verification)
  if (req.method === 'GET') {
    const url = new URL(req.url)
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')

    if (mode === 'subscribe' && token === 'myfinance_secret_token') {
      return new Response(challenge, { status: 200 })
    }
    return new Response('myFinance Webhook ativo!', { status: 200 })
  }

  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  try {
    const payload: WebhookPayload = await req.json()

    // 1. Extração do Remetente e Mensagem (Suporte a Evolution API e Meta API)
    let sender = ''
    let messageText = ''
    let fromMe = false

    if (payload.data?.key?.remoteJid) {
      sender = payload.data.key.remoteJid.replace('@s.whatsapp.net', '')
      fromMe = payload.data.key.fromMe || false
      messageText =
        payload.data.message?.conversation ||
        payload.data.message?.extendedTextMessage?.text ||
        ''
    } else if (payload.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const metaMsg = payload.entry[0].changes[0].value.messages[0]
      sender = metaMsg.from || ''
      messageText = metaMsg.text?.body || ''
    }

    // Ignora mensagens enviadas pelo próprio bot ou vazias
    if (!sender || !messageText.trim() || fromMe) {
      return new Response(JSON.stringify({ status: 'ignored' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const cleanSender = sender.replace(/\D/g, '')
    const trimmedMessage = messageText.trim()
    const today = new Date().toISOString().split('T')[0]

    // 2. Busca de Vinculação do Usuário no Supabase
    const { data: integration } = await supabase
      .from('user_whatsapp_integrations')
      .select('*')
      .eq('phone_number', cleanSender)
      .eq('is_active', true)
      .maybeSingle()

    // CASO 1: Usuário ainda NÃO está ativado
    if (!integration) {
      const activationMatch = trimmedMessage.match(/^ATIVAR\s+(\d{6})/i)

      if (activationMatch) {
        const code = activationMatch[1]

        // Procura código válido
        const { data: pendingIntegration } = await supabase
          .from('user_whatsapp_integrations')
          .select('*')
          .eq('activation_code', code)
          .gte('activation_code_expires_at', new Date().toISOString())
          .maybeSingle()

        if (pendingIntegration) {
          // Ativa o número para este usuário
          await supabase
            .from('user_whatsapp_integrations')
            .update({
              phone_number: cleanSender,
              activation_code: null,
              activation_code_expires_at: null,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', pendingIntegration.id)

          await sendWhatsAppMessage(
            cleanSender,
            `🎉 *WhatsApp Conectado com Sucesso!*\n\nOlá! A partir de agora você pode gerenciar suas finanças direto por aqui.\n\n*Exemplos do que você pode me enviar:*\n• *"Gastei 45 no almoço"*\n• *"Recebi 1.200 de um freela"*\n• *"Qual meu saldo deste mês?"*\n\nPode mandar áudios ou textos a qualquer momento! 🚀`,
          )

          return new Response(JSON.stringify({ status: 'activated' }))
        }

        await sendWhatsAppMessage(
          cleanSender,
          '❌ *Código Inválido ou Expirado!*\n\nPor favor, acerte o código ou gere um novo código de 6 dígitos no myFinance em *Configurações > WhatsApp (IA)*.',
        )
        return new Response(JSON.stringify({ status: 'invalid_code' }))
      }

      // Número não registrado que não enviou código de ativação é ignorado para preservar a privacidade
      return new Response(JSON.stringify({ status: 'ignored_unregistered' }))
    }

    // CASO 2: Usuário ATIVADO -> Processamento Inteligente com Gemini
    const userId = integration.user_id

    if (!GEMINI_API_KEY) {
      await sendWhatsAppMessage(
        cleanSender,
        '⚠️ O myFinance está em modo de configuração da IA. Contate o administrador para configurar a GEMINI_API_KEY.',
      )
      return new Response(JSON.stringify({ status: 'gemini_not_configured' }))
    }

    const geminiRes = await processWithGemini(trimmedMessage, today)
    const parts = geminiRes.candidates?.[0]?.content?.parts || []

    let executedTool = false

    for (const part of parts) {
      if (part.functionCall) {
        executedTool = true
        const { name, args } = part.functionCall

        // AÇÃO 1: CRIAR TRANSAÇÃO NO BANCO DO CLIENTE
        if (name === 'create_transaction') {
          const type = (args.type as 'income' | 'expense') || 'expense'
          const amount = Number(args.amount) || 0
          const title = String(args.title || 'Lançamento')
          const category = String(args.category || 'Outros')
          const date = String(args.date || today)
          const status = (args.status as 'paid' | 'pending') || 'paid'

          // Insere com o user_id seguro do cliente autenticado
          const { error: insertError } = await supabase.from('transactions').insert({
            user_id: userId,
            title,
            amount,
            type,
            category,
            date,
            status,
          })

          if (insertError) {
            console.error('[Insert Error]:', insertError)
            await sendWhatsAppMessage(
              cleanSender,
              '❌ Ops, tive um problema ao salvar no banco de dados. Tente novamente em instantes.',
            )
            break
          }

          // Consulta saldo atualizado do mês
          const currentYearMonth = today.slice(0, 7) // 'YYYY-MM'
          const { data: monthTx } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .gte('date', `${currentYearMonth}-01`)
            .lte('date', `${currentYearMonth}-31`)

          let totalIncome = 0
          let totalExpense = 0
          for (const tx of monthTx || []) {
            if (tx.type === 'income') totalIncome += Number(tx.amount)
            else totalExpense += Number(tx.amount)
          }
          const balance = totalIncome - totalExpense

          const formattedAmount = amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })
          const formattedBalance = balance.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })

          const icon = type === 'income' ? '🟢 *Entrada*' : '🔴 *Saída*'

          await sendWhatsAppMessage(
            cleanSender,
            `✅ *Lançamento Registrado com Sucesso!*\n\n${icon}: ${formattedAmount}\n📝 *Descrição:* ${title}\n🏷️ *Categoria:* ${category}\n📅 *Data:* ${date.split('-').reverse().join('/')}\n\n💰 *Saldo do Mês:* ${formattedBalance}`,
          )
          break
        }

        // AÇÃO 2: CONSULTAR SALDO E RESUMO
        if (name === 'query_summary') {
          const currentYearMonth = today.slice(0, 7)
          const { data: monthTx } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', userId)
            .gte('date', `${currentYearMonth}-01`)
            .lte('date', `${currentYearMonth}-31`)

          let totalIncome = 0
          let totalExpense = 0
          for (const tx of monthTx || []) {
            if (tx.type === 'income') totalIncome += Number(tx.amount)
            else totalExpense += Number(tx.amount)
          }
          const balance = totalIncome - totalExpense

          const formattedIncome = totalIncome.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const formattedExpense = totalExpense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
          const formattedBalance = balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          await sendWhatsAppMessage(
            cleanSender,
            `📊 *Resumo Financeiro do Mês (${currentYearMonth.split('-').reverse().join('/')})*\n\n🟢 *Entradas:* ${formattedIncome}\n🔴 *Saídas:* ${formattedExpense}\n────────────────\n💰 *Saldo Atual:* ${formattedBalance}`,
          )
          break
        }
      }
    }

    // Se o Gemini não chamou uma ferramenta, envia a resposta textual direta
    if (!executedTool) {
      const textResponse = parts.find((p: { text?: string }) => p.text)?.text || 'Entendido!'
      await sendWhatsAppMessage(cleanSender, textResponse)
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[Webhook Fatal Error]:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
