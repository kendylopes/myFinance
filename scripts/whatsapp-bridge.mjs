import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

// Carrega variáveis do arquivo .env
function loadEnv() {
  try {
    const envPath = path.resolve('.env')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const [key, ...rest] = trimmed.split('=')
        const val = rest.join('=').trim()
        if (key && !process.env[key]) {
          process.env[key] = val.replace(/^["']|["']$/g, '')
        }
      }
    }
  } catch (e) {
    console.warn('[Env] Não foi possível ler .env:', e.message)
  }
}
loadEnv()

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://ehdlpxpciarxnfgymbtx.supabase.co'
const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoZGxweHBjaWFyeG5mZ3ltYnR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODA0NjcsImV4cCI6MjEwNTY1NjQ2N30.Ev_hMWGIj4dPpiacu60cGOvMMfED9uQRCvdEDW3YkzU'

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || 'http://localhost:8080'
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'myfinance_secret_key_123456'
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || ''
const PORT = 3001
const BOT_TRIGGER_NAME = (process.env.WHATSAPP_BOT_TRIGGER || 'myfi').trim().toLowerCase()
const REQUIRE_TRIGGER = process.env.WHATSAPP_REQUIRE_TRIGGER !== 'false'

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
      console.log(`[WhatsApp Enviado para ${cleanNumber}]: ${text.slice(0, 50).replace(/\n/g, ' ')}...`)
    }
  } catch (err) {
    console.error('[WhatsApp Send Exception]:', err.message)
  }
}

// Baixa o base64 do áudio recebido via Evolution API
async function downloadAudioBase64(msgData) {
  try {
    console.log('[Audio] Baixando base64 do áudio na Evolution API...')
    const endpoint = `${EVOLUTION_API_URL}/chat/getBase64FromMediaMessage/myfinance`

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        message: msgData,
        convertToMp4: false,
      }),
    })

    if (!res.ok) {
      console.error('[Audio Download Error]:', await res.text())
      return null
    }

    const data = await res.json()
    return data?.base64 || null
  } catch (err) {
    console.error('[Audio Download Exception]:', err.message)
    return null
  }
}

// Transcreve e processa o áudio usando o Gemini 2.5 Flash
async function transcribeAudioWithGemini(base64Audio, apiKey) {
  try {
    console.log('[Gemini] Transcrevendo áudio com Gemini 2.5 Flash...')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'audio/ogg',
                  data: base64Audio,
                },
              },
              {
                text: 'Transcreva exatamente o que foi dito neste áudio em português do Brasil. Retorne apenas e estritamente o texto falado, sem comentários adicionais.',
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[Gemini API Error]:', errText)
      return null
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return text ? text.trim() : null
  } catch (err) {
    console.error('[Gemini API Exception]:', err.message)
    return null
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
          base64: true,
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

// Extrator inteligente de lançamentos financeiros
function parseFinancialMessage(text) {
  const clean = text.trim()

  // 1. Padrões de valor (ex: 45, 45.50, 45,50, 1.200, 1.200,50, 1200)
  const valMatch = clean.match(
    /(?:r\$\s*|reais\s*|valor\s*(?:de\s*)?)?(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)(?:\s*(?:reais|pila|conto))?/i,
  )
  if (!valMatch) return null

  const rawVal = valMatch[1]
  let amount = 0
  if (/^\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?$/.test(rawVal)) {
    amount = Number.parseFloat(rawVal.replace(/\./g, '').replace(',', '.'))
  } else if (rawVal.includes(',')) {
    amount = Number.parseFloat(rawVal.replace(/\./g, '').replace(',', '.'))
  } else {
    amount = Number.parseFloat(rawVal)
  }
  if (Number.isNaN(amount) || amount <= 0) return null

  // 2. Tipo (Receita vs Despesa)
  const isIncome = /(ganhei|recebi|salario|salário|pix de|vendi|lucro|rendimento|freela)/i.test(clean)
  const type = isIncome ? 'income' : 'expense'

  // 3. Categoria inteligente
  let category = isIncome ? 'Trabalho' : 'Alimentação'
  if (/mercado|supermercado|almoço|almoco|jantar|lanche|padaria|pizza|comida|ifood|restaurante|ovo|ovos/i.test(clean)) {
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

  // 4. Descrição (remove termos operacionais para deixar nome limpo)
  let title = clean
    .replace(/(?:gastei|paguei|comprei|recebi|ganhei|pix de|com|no|na|de|reais|r\$)\s*/gi, ' ')
    .replace(/\b\d+(?:[.,]\d{1,2})?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!title || title.length < 2) {
    title = category
  } else {
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

// Extrator inteligente de comandos de Cobranças & Empréstimos
function parseDebtAction(text) {
  const clean = text.trim()

  // 1. Consulta: "Quem me deve?" / "Cobranças" / "Quem tá devendo?"
  if (
    /^(quem\s+(?:me\s+deve|t[aá]\s+me\s+devendo|est[aá]\s+me\s+devendo)|cobran[cç]as?|meus\s+empr[eé]stimos|lista\s+de\s+cobran[cç]as?)$/i.test(
      clean,
    ) ||
    /quem\s+(?:me\s+deve|t[aá]\s+me\s+devendo)/i.test(clean)
  ) {
    return { action: 'query_receivables' }
  }

  // 2. Consulta: "Minhas dívidas" / "Quanto eu devo?" / "Quem eu devo?"
  if (
    /^(minhas\s+d[ií]vidas|quanto\s+(?:eu\s+)?devo|quem\s+eu\s+devo|minhas\s+contas\s+a\s+pagar)$/i.test(
      clean,
    ) ||
    /(?:minhas\s+d[ií]vidas|quanto\s+eu\s+devo)/i.test(clean)
  ) {
    return { action: 'query_payables' }
  }

  // 3. Pagamento / Baixa:
  // "Carlos me pagou 50", "Recebi 50 do Carlos", "Paguei 100 pro Zé"
  // 3.1. Recebimento de cobrança (ex: "Carlos me pagou 50" ou "Recebi 50 do Carlos")
  const paidMatch1 = clean.match(
    /^(.+?)\s+(?:me\s+)?pagou\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
  )
  if (paidMatch1) {
    let name = paidMatch1[1].trim()
    name = name.replace(/\bme\b$/i, '').trim()
    const rawVal = paidMatch1[2]
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'pay_debt', name, amount, type: 'receivable' }
    }
  }

  const paidMatch2 = clean.match(
    /^(?:recebi|recebimento\s+de)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*reais)?\s+(?:do|da|de)\s+([a-záàâãéèêíïóôõöúçñ\w]+(?:\s+[a-záàâãéèêíïóôõöúçñ\w]+)?)/i,
  )
  if (paidMatch2) {
    const rawVal = paidMatch2[1]
    const name = paidMatch2[2].trim()
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'pay_debt', name, amount, type: 'receivable' }
    }
  }

  // 3.2. Pagamento de dívida própria (ex: "Paguei 100 pro Zé" ou "Quitei 200 do Zé")
  const paidMatch3 = clean.match(
    /^(?:paguei|quitei|amortizei)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*reais)?\s+(?:pro|pra|para o|para a|para|ao|a|do|da)\s+([a-záàâãéèêíïóôõöúçñ\w]+(?:\s+[a-záàâãéèêíïóôõöúçñ\w]+)?)/i,
  )
  if (paidMatch3) {
    const rawVal = paidMatch3[1]
    const name = paidMatch3[2].trim()
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'pay_debt', name, amount, type: 'payable' }
    }
  }

  // 4. Criação de Empréstimo Concedido (A Receber / Cobrança):
  // "emprestei 50 pro Carlos", "emprestei 100 reais para Mariana", "cobrar 80 do João"
  const lendMatch1 = clean.match(
    /^(?:emprestei|dei\s+emprestado|fiz\s+um\s+empr[eé]stimo\s+de|cobrar|criei\s+cobran[cç]a\s+de)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*reais)?\s+(?:pro|pra|para o|para a|para|ao|a|do|da)\s+([a-záàâãéèêíïóôõöúçñ\w]+(?:\s+[a-záàâãéèêíïóôõöúçñ\w]+)?)/i,
  )
  if (lendMatch1) {
    const rawVal = lendMatch1[1]
    const name = lendMatch1[2].trim()
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'create_debt', name, amount, type: 'receivable' }
    }
  }

  // Inverso: "emprestei pro Carlos 50" ou "cobrar do Carlos 50"
  const lendMatch2 = clean.match(
    /^(?:emprestei|cobrar)\s+(?:pro|pra|para o|para a|para|ao|a|do|da)\s+([a-záàâãéèêíïóôõöúçñ\w]+(?:\s+[a-záàâãéèêíïóôõöúçñ\w]+)?)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)/i,
  )
  if (lendMatch2) {
    const name = lendMatch2[1].trim()
    const rawVal = lendMatch2[2]
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'create_debt', name, amount, type: 'receivable' }
    }
  }

  // 5. Criação de Dívida Pessoal (A Pagar):
  // "peguei emprestado 500 do Zé", "peguei 300 com o Zé", "estou devendo 150 pro Marcelo"
  const borrowMatch = clean.match(
    /^(?:peguei\s+emprestado|peguei|tomei\s+emprestado|estou\s+devendo|devo)\s+(?:r\$\s*)?(\d+(?:[.,]\d{1,2})?)(?:\s*reais)?\s+(?:do|da|de|com o|com a|com|pro|pra|para o|para a|para|ao|a)\s+([a-záàâãéèêíïóôõöúçñ\w]+(?:\s+[a-záàâãéèêíïóôõöúçñ\w]+)?)/i,
  )
  if (borrowMatch) {
    const rawVal = borrowMatch[1]
    const name = borrowMatch[2].trim()
    const amount = Number.parseFloat(rawVal.replace(',', '.'))
    if (!Number.isNaN(amount) && amount > 0) {
      return { action: 'create_debt', name, amount, type: 'payable' }
    }
  }

  return null
}

// Cria o servidor HTTP do Webhook
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    return res.end(
      JSON.stringify({
        status: 'healthy',
        service: 'myfinance-whatsapp-bridge',
        hasGeminiKey: Boolean(GEMINI_API_KEY),
      }),
    )
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

        if (event !== 'messages.upsert') return

        const msgData = payload.data
        if (!msgData) return

        const fromMe = msgData.key?.fromMe
        const remoteJid = msgData.key?.remoteJid || ''

        // 1. Ignora grupos e mensagens enviadas pelo próprio bot
        if (fromMe || remoteJid.includes('@g.us')) return

        const cleanSender = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '')
        if (!cleanSender) return

        // 1.1. Ignora mensagens atrasadas acumuladas em buffer da Evolution API (> 3 minutos)
        const nowSec = Math.floor(Date.now() / 1000)
        const msgSec = Number(msgData.messageTimestamp || nowSec)
        if (nowSec - msgSec > 180) {
          console.log(
            `[Buffer Antigo Descartado]: Mensagem de ${cleanSender} com atraso de ${nowSec - msgSec}s ignorada para evitar respostas duplicadas.`,
          )
          return
        }

        // 2. Extrai texto ou detecta áudio
        const isAudio =
          msgData.messageType === 'audioMessage' ||
          Boolean(msgData.message?.audioMessage)

        let messageText =
          msgData.message?.conversation ||
          msgData.message?.extendedTextMessage?.text ||
          ''

        // 3. Checa se o usuário enviou comando de ativação por texto: ATIVAR 123456 (ou typo ATUVAR)
        if (!isAudio && messageText.trim()) {
          const trimmed = messageText.trim()
          const activationMatch = trimmed.match(/^AT[I|U]VAR\s+(\d{6})/i)

          if (activationMatch) {
            const code = activationMatch[1]

            // Checa primeiro se este número já está ativado no myFinance
            const { data: alreadyActive } = await supabase.rpc('get_whatsapp_user', {
              p_phone: cleanSender,
            })

            if (alreadyActive?.found) {
              await sendWhatsAppMessage(
                cleanSender,
                `✅ *Seu WhatsApp já está conectado e pronto!*\n\nNão é necessário ativar novamente. Basta me enviar mensagens começando com *Myfi*!\n\n*Exemplos:*\n• *"Myfi gastei 40 com verduras"*\n• *"Myfi comprei 55 de gasolina"*\n• *"Myfi qual meu saldo?"*`,
              )
              return
            }

            console.log(`[Ativação] Tentando ativar número ${cleanSender} com código: ${code}`)

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
              `🎉 *WhatsApp Conectado com Sucesso!*\n\nOlá! Sua conta do *myFinance* foi vinculada a este número com sucesso.\n\n⚠️ *Importante — Como falar comigo:*\nPara que eu registre seus gastos sem responder conversas normais, sempre me chame pelo meu apelido no início:\n\n👉 *Myfi [sua mensagem]*\n\n*Exemplos para testar agora:*\n• *"Myfi gastei 45 no almoço"*\n• *"Myfi comprei 55 de gasolina"*\n• *"Myfi qual meu saldo deste mês?"*\n\nPode mandar textos ou áudios começando com *Myfi* a qualquer momento! 🚀`,
            )
            return
          }
        }

        // 4. Verifica se o remetente já é um usuário ativado no myFinance
        const { data: userResult } = await supabase.rpc('get_whatsapp_user', {
          p_phone: cleanSender,
        })

        // SILÊNCIO TOTAL para contatos desconhecidos (não perturba amigos, família ou trabalho)
        if (!userResult?.found) {
          console.log(`[Silencioso] Mensagem de número não vinculado ${cleanSender} ignorada.`)
          return
        }

        const userId = userResult.user_id

        // 5. PROCESSAMENTO DE ÁUDIO
        let audioTranscribedNotice = ''
        if (isAudio) {
          console.log(`[Audio Recebido de ${cleanSender}]: Processando áudio...`)

          if (!GEMINI_API_KEY) {
            console.warn('[Audio Alerta]: GEMINI_API_KEY ausente para transcrever áudio.')
            await sendWhatsAppMessage(
              cleanSender,
              `🎙️ *Áudio Recebido!*\n\nPara que o myFinance possa ouvir e transcrever seus áudios com inteligência artificial, adicione sua chave *GEMINI_API_KEY* no arquivo *.env*.\n\n👉 A chave é gratuita no Google AI Studio: https://aistudio.google.com/apikey\n\n_Enquanto isso, você pode me enviar mensagens por texto normalmente que já estão funcionando 100%!_ 📱`,
            )
            return
          }

          const base64Audio = await downloadAudioBase64(msgData)
          if (!base64Audio) {
            await sendWhatsAppMessage(
              cleanSender,
              '⚠️ Não consegui baixar o áudio enviado. Por favor, tente enviar novamente.',
            )
            return
          }

          const transcribed = await transcribeAudioWithGemini(base64Audio, GEMINI_API_KEY)
          if (!transcribed) {
            await sendWhatsAppMessage(
              cleanSender,
              '⚠️ Não consegui transcrever o áudio com clareza. Tente falar um pouco mais perto do microfone ou enviar por texto.',
            )
            return
          }

          messageText = transcribed
          audioTranscribedNotice = `🎙️ *Áudio Ouvido:* _"${transcribed}"_\n\n`
          console.log(`[Audio Transcrito]: "${transcribed}"`)
        }

        const trimmed = messageText.trim()
        if (!trimmed) return

        let textToProcess = trimmed

        // 5.1. Verificação do apelido / wake word (ex: "myfi", "Myfi", "Myfy", "Myfu", "@myfi")
        if (REQUIRE_TRIGGER) {
          const triggerVariants =
            BOT_TRIGGER_NAME === 'myfi' ? '(?:myfi|myfy|myfu)' : BOT_TRIGGER_NAME
          const triggerRegex = new RegExp(`^(?:@?${triggerVariants})(?:[,:;!?-]|\\s|$)\\s*`, 'i')
          const hasTrigger = triggerRegex.test(trimmed)

          if (!hasTrigger) {
            console.log(
              `[WhatsApp Silenciado - sem chamada ao "${BOT_TRIGGER_NAME}"]: "${trimmed}"`,
            )
            return
          }

          // Remove o apelido da mensagem para processar a ação real
          textToProcess = trimmed.replace(triggerRegex, '').trim()

          // Se a pessoa só mandou "Myfi" ou "Myfi?"
          if (!textToProcess) {
            await sendWhatsAppMessage(
              cleanSender,
              `👋 *Olá! Sou o Myfi, seu assistente do myFinance.*\n\nComo posso te ajudar agora?\n• *"Myfi gastei 30 com gasolina"*\n• *"Myfi recebi 1500 de salário"*\n• *"Myfi qual meu saldo?"*`,
            )
            return
          }
        }

        console.log(`[Mensagem Processada de ${cleanSender}]: "${textToProcess}"`)

        // 6. Consulta de Saldo / Resumo Financeiro
        if (/saldo|quanto tenho|extrato|resumo|gastei quanto|quanto gastei/i.test(textToProcess)) {
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
            `${audioTranscribedNotice}📊 *Resumo Financeiro do Mês (${currentYM})*\n\n` +
              `🟢 *Receitas:* ${formatBRL(income)}\n` +
              `🔴 *Despesas:* ${formatBRL(expense)}\n` +
              `━━━━━━━━━━━━━━━━\n` +
              `💵 *Saldo:* ${formatBRL(balance)}\n\n` +
              `_Dados sincronizados em tempo real com o seu myFinance._ 📱`,
          )
          return
        }

        // 6.1. Cobranças & Empréstimos (Criar, Consultar e Dar Baixa)
        const debtAction = parseDebtAction(textToProcess)

        if (debtAction) {
          const formatBRL = (val) =>
            val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

          // A) CONSULTA DE QUEM ME DEVE (Cobranças a receber)
          if (debtAction.action === 'query_receivables') {
            const { data: summary, error: dErr } = await supabase.rpc('get_whatsapp_debts_summary', {
              p_user_id: userId,
              p_type: 'receivable',
            })

            if (dErr) {
              console.error('[Erro get_whatsapp_debts_summary]:', dErr)
              await sendWhatsAppMessage(
                cleanSender,
                '⚠️ Não foi possível consultar suas cobranças no momento.',
              )
              return
            }

            const receivables = summary?.receivables || []
            const total = Number(summary?.total_receivable || 0)

            if (receivables.length === 0) {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}🎉 *Nenhuma cobrança pendente!*\n\nVocê não tem valores a receber de terceiros cadastrados no momento.\n\n_Para cadastrar um empréstimo concedido, mande:_\n👉 *"Myfi emprestei 50 pro Carlos"*`,
              )
              return
            }

            let msg = `${audioTranscribedNotice}📋 *Cobranças Pendentes*\n`
            msg += `💰 *Total a Receber:* ${formatBRL(total)}\n`
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`

            receivables.forEach((rec, idx) => {
              const dueFormatted = rec.due_date ? rec.due_date.split('-').reverse().join('/') : 'A combinar'
              const isOverdue =
                rec.due_date &&
                new Date(rec.due_date) < new Date(new Date().toISOString().split('T')[0])
              const alert = isOverdue ? ' ⚠️ *(Vencido)*' : ''
              msg += `${idx + 1}. *${rec.name}*: ${formatBRL(Number(rec.balance))}\n`
              msg += `   📅 Vencimento: ${dueFormatted}${alert}\n\n`
            })

            msg += `💡 *Para registrar recebimento, mande:*\n👉 *"Myfi [Nome] me pagou [Valor]"*`

            await sendWhatsAppMessage(cleanSender, msg)
            return
          }

          // B) CONSULTA DE MINHAS DÍVIDAS (A pagar)
          if (debtAction.action === 'query_payables') {
            const { data: summary, error: dErr } = await supabase.rpc('get_whatsapp_debts_summary', {
              p_user_id: userId,
              p_type: 'payable',
            })

            if (dErr) {
              console.error('[Erro get_whatsapp_debts_summary]:', dErr)
              await sendWhatsAppMessage(
                cleanSender,
                '⚠️ Não foi possível consultar suas dívidas no momento.',
              )
              return
            }

            const payables = summary?.payables || []
            const total = Number(summary?.total_payable || 0)

            if (payables.length === 0) {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}🎉 *Parabéns! Nenhuma dívida ativa!*\n\nVocê não possui compromissos a pagar pendentes no myFinance. 🚀`,
              )
              return
            }

            let msg = `${audioTranscribedNotice}📑 *Minhas Dívidas a Pagar*\n`
            msg += `💸 *Total a Pagar:* ${formatBRL(total)}\n`
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`

            payables.forEach((p, idx) => {
              const dueFormatted = p.due_date ? p.due_date.split('-').reverse().join('/') : 'A combinar'
              const isOverdue =
                p.due_date &&
                new Date(p.due_date) < new Date(new Date().toISOString().split('T')[0])
              const alert = isOverdue ? ' ⚠️ *(Atrasada)*' : ''
              msg += `${idx + 1}. *${p.name}*: ${formatBRL(Number(p.balance))}\n`
              msg += `   📅 Vencimento: ${dueFormatted}${alert}\n\n`
            })

            msg += `💡 *Para registrar pagamento, mande:*\n👉 *"Myfi paguei [Valor] pro [Nome]"*`

            await sendWhatsAppMessage(cleanSender, msg)
            return
          }

          // C) BAIXA / RECEBIMENTO / PAGAMENTO DE EMPRÉSTIMO
          if (debtAction.action === 'pay_debt') {
            const { data: payRes, error: payErr } = await supabase.rpc('pay_whatsapp_debt_by_name', {
              p_user_id: userId,
              p_name: debtAction.name,
              p_amount: debtAction.amount,
            })

            if (payErr || !payRes?.success) {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}⚠️ *Não encontrei nenhum contrato ativo para "${debtAction.name}".*\n\nVerifique se o nome está correto ou pergunte *"Myfi quem me deve?"* para ver a lista de cobranças em aberto.`,
              )
              return
            }

            const isRec = payRes.type === 'receivable'
            const isPaidOff = payRes.status === 'paid'
            const amountFormatted = formatBRL(debtAction.amount)
            const newBalFormatted = formatBRL(Number(payRes.new_balance || 0))

            if (isPaidOff) {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}🎉 *Empréstimo Quitado com Sucesso!*\n\n` +
                  `👤 *Pessoa:* ${payRes.lender_name}\n` +
                  `💰 *Valor Liquidado:* ${amountFormatted}\n` +
                  `🏁 *Saldo Restante:* R$ 0,00 (Totalmente Quitado)\n\n` +
                  (isRec
                    ? `_Uma receita de ${amountFormatted} foi creditada no seu extrato!_ 💵`
                    : `_Seu compromisso foi marcado como quitado no myFinance!_ 🚀`),
              )
            } else {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}✅ *Pagamento Parcial Registrado!*\n\n` +
                  `👤 *Pessoa:* ${payRes.lender_name}\n` +
                  `💰 *Valor Pago:* ${amountFormatted}\n` +
                  `📉 *Novo Saldo:* ${newBalFormatted} restantes\n\n` +
                  `_Lançamento atualizado no painel de Cobranças & Dívidas!_ 📱`,
              )
            }
            return
          }

          // D) CRIAR COBRANÇA OU DÍVIDA
          if (debtAction.action === 'create_debt') {
            const { data: createdDebt, error: cErr } = await supabase.rpc('record_whatsapp_debt', {
              p_user_id: userId,
              p_lender_name: debtAction.name,
              p_amount: debtAction.amount,
              p_type: debtAction.type,
            })

            if (cErr || !createdDebt?.success) {
              console.error('[Erro record_whatsapp_debt]:', cErr)
              await sendWhatsAppMessage(
                cleanSender,
                '⚠️ Não foi possível registrar este empréstimo no banco de dados. Tente novamente.',
              )
              return
            }

            const isRec = debtAction.type === 'receivable'
            const formatted = formatBRL(debtAction.amount)

            if (isRec) {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}🤝 *Cobrança Registrada com Sucesso!*\n\n` +
                  `👤 *Quem deve:* ${debtAction.name}\n` +
                  `💰 *Valor:* ${formatted}\n` +
                  `📅 *Prazo Inicial:* 30 dias\n` +
                  `🏷️ *Status:* A Receber (Empréstimo Concedido)\n\n` +
                  `_Uma despesa de ${formatted} foi registrada no seu extrato para manter seu saldo real em dia._\n\n` +
                  `💡 *Dica:* Quando ${debtAction.name} te pagar, mande:\n` +
                  `👉 *"Myfi ${debtAction.name} me pagou ${debtAction.amount}"*`,
              )
            } else {
              await sendWhatsAppMessage(
                cleanSender,
                `${audioTranscribedNotice}📌 *Dívida Registrada no myFinance!*\n\n` +
                  `🏦 *Credor:* ${debtAction.name}\n` +
                  `💸 *Valor:* ${formatted}\n` +
                  `📅 *Prazo:* 30 dias\n` +
                  `🏷️ *Status:* A Pagar\n\n` +
                  `_Acompanhe vencimentos e simule quitação no menu Dívidas._\n\n` +
                  `💡 *Quando você pagar, mande:*\n` +
                  `👉 *"Myfi paguei ${debtAction.amount} pro ${debtAction.name}"*`,
              )
            }
            return
          }
        }

        // 7. Extração e Registro de Transação (Receita ou Despesa)
        const parsedTx = parseFinancialMessage(textToProcess)

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
            `${audioTranscribedNotice}✅ *${icon} Registrada com Sucesso!*\n\n` +
              `📝 *Descrição:* ${parsedTx.title}\n` +
              `💰 *Valor:* ${formattedAmount}\n` +
              `🏷️ *Categoria:* ${parsedTx.category}\n` +
              `📅 *Data:* ${parsedTx.date}\n\n` +
              `_Seu saldo foi atualizado no painel myFinance!_ 🚀`,
          )
          return
        }

        // 8. Resposta quando expressamente solicitado ou saudação direta
        if (
          /^(ajuda|comandos|menu|bot|myfinance|como usar|ola|olá|oi|bom dia|boa tarde|boa noite)(?:\s|$|[!,?.])/i.test(
            textToProcess,
          )
        ) {
          await sendWhatsAppMessage(
            cleanSender,
            `🤖 *Myfi — Assistente myFinance*\n\nEstou pronto para te ajudar com o controle financeiro! 🚀\n\n` +
              `*Gastos & Receitas:*\n` +
              `• *"Myfi almoço 45 reais"*\n` +
              `• *"Myfi gasolina 120"*\n` +
              `• *"Myfi recebi 2500 salário"*\n` +
              `• *"Myfi qual meu saldo?"*\n\n` +
              `*Cobranças & Empréstimos:*\n` +
              `• *"Myfi emprestei 50 pro Carlos"*\n` +
              `• *"Myfi quem me deve?"*\n` +
              `• *"Myfi Carlos me pagou 50"*\n` +
              `• *"Myfi peguei 300 com o Zé"*`,
          )
          return
        }

        if (isAudio) {
          await sendWhatsAppMessage(
            cleanSender,
            `${audioTranscribedNotice}🤖 Não consegui identificar um valor ou comando financeiro no que você falou.\n\n*Tente falar algo como:*\n• _"Myfi gastei trinta reais na padaria"_\n• _"Myfi recebi quinhentos de um freela"_`,
          )
          return
        }

        console.log(`[Ignorado] Mensagem sem comando financeiro reconhecido: "${textToProcess}"`)
      } catch (err) {
        console.error('[Webhook Processing Error]:', err)
      }
    })
    return
  }

  res.writeHead(404)
  res.end('Not Found')
})

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, '0.0.0.0', async () => {
    console.log(`\n======================================================`)
    console.log(`🚀 [myFinance WhatsApp Bridge] Rodando na porta ${PORT}`)
    console.log(`🌐 Endpoint do Webhook: http://0.0.0.0:${PORT}/webhook`)
    console.log(`🤖 IA Gemini: ${GEMINI_API_KEY ? 'Ativa ✅' : 'Chave Pendente no .env ⚠️'}`)
    console.log(
      `🔔 Apelido de Ativação: ${
        REQUIRE_TRIGGER ? `Ativo ✅ ("${BOT_TRIGGER_NAME}")` : 'Desativado (responde a tudo)'
      }`,
    )
    console.log(`======================================================\n`)

    await setupWebhook()
  })
}

export { parseDebtAction, parseFinancialMessage }
