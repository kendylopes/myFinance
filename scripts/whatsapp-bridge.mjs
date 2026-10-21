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

// Transcreve e processa o áudio usando o Gemini 2.0 Flash
async function transcribeAudioWithGemini(base64Audio, apiKey) {
  try {
    console.log('[Gemini] Transcrevendo áudio com Gemini 2.0 Flash...')
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

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

        // 2. Extrai texto ou detecta áudio
        const isAudio =
          msgData.messageType === 'audioMessage' ||
          Boolean(msgData.message?.audioMessage)

        let messageText =
          msgData.message?.conversation ||
          msgData.message?.extendedTextMessage?.text ||
          ''

        // 3. Checa se o usuário enviou comando de ativação por texto: ATIVAR 123456
        if (!isAudio && messageText.trim()) {
          const trimmed = messageText.trim()
          const activationMatch = trimmed.match(/^ATIVAR\s+(\d{6})/i)

          if (activationMatch) {
            const code = activationMatch[1]
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
              `🎉 *WhatsApp Conectado com Sucesso!*\n\nOlá! Sua conta do *myFinance* foi vinculada a este número com sucesso.\n\nA partir de agora você pode gerenciar suas finanças diretamente por aqui!\n\n*Experimente enviar:*\n• *"Gastei 45 no almoço"*\n• *"Recebi 1.200 de um freela"*\n• *"Qual meu saldo deste mês?"*\n\nPode mandar texto ou áudios a qualquer momento! 🚀`,
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

        console.log(`[Mensagem Processada de ${cleanSender}]: "${trimmed}"`)

        // 6. Consulta de Saldo / Resumo Financeiro
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
            `${audioTranscribedNotice}📊 *Resumo Financeiro do Mês (${currentYM})*\n\n` +
              `🟢 *Receitas:* ${formatBRL(income)}\n` +
              `🔴 *Despesas:* ${formatBRL(expense)}\n` +
              `━━━━━━━━━━━━━━━━\n` +
              `💵 *Saldo:* ${formatBRL(balance)}\n\n` +
              `_Dados sincronizados em tempo real com o seu myFinance._ 📱`,
          )
          return
        }

        // 7. Extração e Registro de Transação (Receita ou Despesa)
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
        if (/^(ajuda|comandos|menu|bot|myfinance|como usar|ola|olá|oi|bom dia|boa tarde|boa noite)\b/i.test(trimmed)) {
          await sendWhatsAppMessage(
            cleanSender,
            `🤖 *myFinance Inteligente*\n\nEstou pronto para te ajudar com o controle financeiro! 🚀\n\n*Como usar:*\n• *"Almoço 45 reais"*\n• *"Gasolina 120"*\n• *"Recebi 2500 salário"*\n• *"Qual meu saldo?"*`,
          )
          return
        }

        if (isAudio) {
          await sendWhatsAppMessage(
            cleanSender,
            `${audioTranscribedNotice}🤖 Não consegui identificar um valor ou comando financeiro no que você falou.\n\n*Tente falar algo como:*\n• _"Gastei trinta reais na padaria"_\n• _"Recebi quinhentos de um freela"_`,
          )
          return
        }

        console.log(`[Ignorado] Mensagem sem comando financeiro reconhecido: "${trimmed}"`)
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
  console.log(`🤖 IA Gemini: ${GEMINI_API_KEY ? 'Ativa ✅' : 'Chave Pendente no .env ⚠️'}`)
  console.log(`======================================================\n`)

  await setupWebhook()
})
