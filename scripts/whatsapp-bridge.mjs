import http from 'node:http'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ehdlpxpciarxnfgymbtx.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZGxweHBjaWFyeG5mZ3ltYnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODA0NjcsImV4cCI6MjEwNTY1NjQ2N30.Ev_hMWGIj4dPpiacu60cGOvMMfED9uQRCvdEDW3YkzU'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'myfinance_secret_key_123456'
const PORT = 3001

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Função para enviar mensagem de volta ao WhatsApp via Evolution API
async function sendWhatsAppMessage(remoteJid, text) {
  try {
    const cleanNumber = remoteJid.replace('@s.whatsapp.net', '')
    const endpoint = `${EVOLUTION_API_URL}/message/sendText/myfinance`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: cleanNumber,
        text,
        delay: 500,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[WhatsApp Send Error ${res.status}]:`, errBody)
    } else {
      console.log(`[WhatsApp Enviado para ${cleanNumber}]: ${text.slice(0, 40)}...`)
    }
  } catch (err) {
    console.error('[WhatsApp Send Exception]:', err.message)
  }
}

// Configura o webhook na Evolution API apontando para o host
async function setupWebhook() {
  try {
    console.log('[Setup] Configurando webhook na Evolution API...')
    const webhookUrl = 'http://host.docker.internal:3001/webhook'

    const res = await fetch(`${EVOLUTION_API_URL}/webhook/set/myfinance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT'],
        },
      }),
    })

    const data = await res.json()
    console.log('[Setup] Webhook configurado com sucesso na Evolution API:', data?.webhook?.url || 'OK')
  } catch (err) {
    console.error('[Setup] Falha ao configurar webhook na Evolution API:', err.message)
  }
}

// Extrator simples de lançamentos financeiros
function parseFinancialMessage(text) {
  const clean = text.trim()

  // 1. Padrões de valor (ex: 45, 45.50, 45,50, 1.200, 1200)
  const valMatch = clean.match(/(?:r\$|reais)?\s*(\d+(?:[.,]\d{1,2})?)/i)
  if (!valMatch) return null

  const rawVal = valMatch[1].replace(',', '.')
  const amount = Number.parseFloat(rawVal)
  if (Number.isNaN(amount) || amount <= 0) return null

  // 2. Tipo (Receita vs Despesa)
  const isIncome = /(ganhei|recebi|salario|salário|pix de|vendi|lucro|rendimento|freela)/i.test(clean)
  const type = isIncome ? 'income' : 'expense'

  // 3. Categoria inteligente
  let category = isIncome ? 'Trabalho' : 'Alimentação'
  if (/mercado|supermercado|almoço|almoco|jantar|lanche|padaria|pizza|comida|ifood|restaurante/i.test(clean)) {
    category = 'Alimentação'
  } else if (/gasolina|uber|posto|combustivel|combustível|passagem|onibus|ônibus|metro|metrô|estacionamento/i.test(clean)) {
    category = 'Transporte'
  } else if (/aluguel|condominio|condomínio|luz|energia|agua|água|internet|celular|iptu|moradia/i.test(clean)) {
    category = 'Moradia'
  } else if (/farmacia|farmácia|remedio|remédio|medico|médico|consulta|dentista|hospital/i.test(clean)) {
    category = 'Saúde'
  } else if (/cinema|filme|festa|bar|cerveja|jogo|passeio|viagem/i.test(clean)) {
    category = 'Lazer'
  } else if (/curso|livro|faculdade|escola|mensalidade/i.test(clean)) {
    category = 'Educação'
  } else if (/roupa|tenis|tênis|shopping|comprei|compra/i.test(clean)) {
    category = 'Compras'
  }

  // 4. Descrição (remove o valor para extrair o título)
  let title = clean
    .replace(/(?:gastei|paguei|comprei|recebi|ganhei|pix de|com|no|na|de)\s*/gi, '')
    .replace(/(?:r\$|reais)?\s*\d+(?:[.,]\d{1,2})?/gi, '')
    .trim()

  if (!title || title.length < 2) {
    title = category
  } else {
    // Primeira letra maiúscula
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  const today = new Date().toISOString().split('T')[0]

  return {
    type,
    amount,
    title,
    category,
    date: today,
  }
}

// Cria o servidor HTTP
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(JSON.stringify({ status: 'healthy', service: 'myfinance-whatsapp-bridge' }))
  }

  if (req.method === 'POST' && req.url === '/webhook') {
    let body = ''
    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ received: true }))

      try {
        const payload = JSON.parse(body)
        const event = payload.event
        console.log(`[Webhook Evento Recebido]: ${event}`)

        if (event !== 'messages.upsert') return

        const msgData = payload.data
        if (!msgData) return

        const fromMe = msgData.key?.fromMe
        const remoteJid = msgData.key?.remoteJid || ''

        // Ignora grupos e mensagens enviadas pelo próprio bot
        if (fromMe || remoteJid.includes('@g.us')) return

        const cleanSender = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
        const messageText =
          msgData.message?.conversation ||
          msgData.message?.extendedTextMessage?.text ||
          ''

        if (!cleanSender || !messageText.trim()) return

        const trimmed = messageText.trim()
        console.log(`[Mensagem de ${cleanSender}]: "${trimmed}"`)

        // 1. Checa se é mensagem de ativação: ATIVAR 123456
        const activationMatch = trimmed.match(/^ATIVAR\s+(\d{6})/i)
        if (activationMatch) {
          const code = activationMatch[1]
          console.log(`[Ativação] Tentando ativar com código: ${code}`)

          const { data: actResult, error: actError } = await supabase.rpc(
            'activate_whatsapp_number',
            {
              p_code: code,
              p_phone: cleanSender,
            },
          )

          if (actError || !actResult?.success) {
            console.warn('[Ativação Falhou]:', actError?.message || actResult?.error)
            await sendWhatsAppMessage(
              cleanSender,
              '❌ *Código Inválido ou Expirado!*\n\nPor favor, gere um novo código de 6 dígitos no myFinance no menu *WhatsApp* e envie aqui:\n\n👉 *ATIVAR [SEU_CODIGO]*',
            )
            return
          }

          console.log(`[Ativação Concluída] Usuário ${actResult.user_id} ativado!`)
          await sendWhatsAppMessage(
            cleanSender,
            `🎉 *WhatsApp Conectado com Sucesso!*\n\nOlá! Sua conta do *myFinance* foi vinculada a este número com sucesso.\n\nA partir de agora você pode gerenciar suas finanças diretamente por aqui!\n\n*Experimente enviar:*\n• *"Gastei 45 no almoço"*\n• *"Recebi 1.200 de um freela"*\n• *"Qual meu saldo deste mês?"*\n\nPode mandar texto ou áudios a qualquer momento! 🚀`,
          )
          return
        }

        // 2. Verifica se o número já está vinculado a um usuário do myFinance
        const { data: userResult } = await supabase.rpc('get_whatsapp_user', {
          p_phone: cleanSender,
        })

        if (!userResult?.found) {
          console.log(`[Desconhecido] Número ${cleanSender} não vinculado.`)
          await sendWhatsAppMessage(
            cleanSender,
            `👋 *Olá! Sou o assistente do myFinance.*\n\nPara vincular seu WhatsApp à sua conta:\n1. Acesse o myFinance no seu computador ou celular\n2. Clique em *WhatsApp* no menu lateral\n3. Clique em *Gerar Código*\n4. Envie aqui a mensagem:\n\n👉 *ATIVAR [SEU_CODIGO]*`,
          )
          return
        }

        const userId = userResult.user_id

        // 3. Consulta de Saldo / Resumo
        if (/saldo|quanto tenho|extrato|resumo|gastei quanto|quanto gastei/i.test(trimmed)) {
          const currentYM = new Date().toISOString().slice(0, 7)
          const { data: summary } = await supabase.rpc('get_whatsapp_summary', {
            p_user_id: userId,
            p_month: currentYM,
          })

          const income = Number(summary?.income || 0)
          const expense = Number(summary?.expense || 0)
          const balance = Number(summary?.balance || 0)

          const formatBRL = (val) =>
            val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          await sendWhatsAppMessage(
            cleanSender,
            `📊 *Resumo Financeiro do Mês (${currentYM})*\n\n` +
              `🟢 *Receitas:* ${formatBRL(income)}\n` +
              `🔴 *Despesas:* ${formatBRL(expense)}\n` +
              `━━━━━━━━━━━━━━━━\n` +
              `💵 *Saldo:* ${formatBRL(balance)}\n\n` +
              `_Dados sincronizados em tempo real com o seu myFinance._ 📱`,
          )
          return
        }

        // 4. Extração e Registro de Transação
        const parsedTx = parseFinancialMessage(trimmed)

        if (parsedTx) {
          const { data: created, error: txError } = await supabase.rpc(
            'record_whatsapp_transaction',
            {
              p_user_id: userId,
              p_title: parsedTx.title,
              p_amount: parsedTx.amount,
              p_type: parsedTx.type,
              p_category: parsedTx.category,
              p_date: parsedTx.date,
              p_status: 'paid',
            },
          )

          if (txError || !created?.success) {
            console.error('[Erro ao gravar transação]:', txError)
            await sendWhatsAppMessage(
              cleanSender,
              '⚠️ Não foi possível salvar o lançamento no banco de dados. Tente novamente em instantes.',
            )
            return
          }

          const icon = parsedTx.type === 'income' ? '🟢 Receita' : '🔴 Despesa'
          const formattedAmount = parsedTx.amount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })

          await sendWhatsAppMessage(
            cleanSender,
            `✅ *${icon} Registrada com Sucesso!*\n\n` +
              `📝 *Descrição:* ${parsedTx.title}\n` +
              `💰 *Valor:* ${formattedAmount}\n` +
              `🏷️ *Categoria:* ${parsedTx.category}\n` +
              `📅 *Data:* ${parsedTx.date}\n\n` +
              `_Seu saldo foi atualizado no painel myFinance!_ 🚀`,
          )
          return
        }

        // 5. Resposta para mensagens gerais
        await sendWhatsAppMessage(
          cleanSender,
          `🤖 *myFinance Inteligente*\n\nNão consegui identificar um valor ou comando na sua mensagem.\n\n*Exemplos do que você pode me mandar:*\n• *"Almoço 45 reais"*\n• *"Gasolina 150"*\n• *"Recebi 2500 salário"*\n• *"Qual meu saldo?"*`,
        )
      } catch (err) {
        console.error('[Webhook Processing Error]:', err)
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`\n======================================================`)
  console.log(`🚀 [myFinance WhatsApp Bridge] Rodando na porta ${PORT}`)
  console.log(`🌐 Endpoint do Webhook: http://0.0.0.0:${PORT}/webhook`)
  console.log(`======================================================\n`)

  await setupWebhook()
})
