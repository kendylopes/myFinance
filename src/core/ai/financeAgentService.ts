import { DEFAULT_CATEGORIES } from '../../domain/models/categories'
import type { Transaction } from '../../domain/models/transaction'

export type AgentActionType =
  | 'create_transaction'
  | 'query_summary'
  | 'list_transactions'
  | 'clarification'

export interface AgentProposedTransaction {
  type: 'income' | 'expense'
  amount: number
  title: string
  category: string
  date: string
  status: 'paid' | 'pending'
}

export interface AgentResponse {
  action: AgentActionType
  replyText: string
  proposedTransaction?: AgentProposedTransaction
  rawToolCall?: {
    name: string
    args: Record<string, unknown>
  }
}

export interface ProcessMessageParams {
  message: string
  availableCategories?: string[]
  currentDate?: string
  apiKey?: string
  existingTransactions?: Transaction[]
}

const SYSTEM_INSTRUCTION = `Você é o myFinance Bot, um assistente financeiro pessoal de elite, rápido, amigável e focado em manter o controle financeiro do usuário em dia.
Seu objetivo principal é entender as mensagens do usuário (texto ou transcrição de áudios informais de WhatsApp) e executar uma das ações financeiras:
1. create_transaction: Para registrar entradas e saídas.
2. query_summary: Para consultas de saldo, quanto gastou ou quanto ganhou.
3. list_transactions: Para listar ou conferir compras recentes.

Regras fundamentais:
- Categorize sempre de acordo com a lista de categorias válidas fornecidas. Se houver dúvida, escolha a mais próxima (ex: "almoço", "hambúrguer", "mercado" -> Alimentação; "uber", "gasolina", "metrô" -> Transporte).
- Datas relativas como "ontem", "hoje", "anteontem" devem ser calculadas com base na data de referência informada.
- Se a mensagem for "paguei", "comprei", "gastei", o status é 'paid'. Se disser "vou pagar", "boleto vence dia X", o status é 'pending'.
- Se o usuário não disser um valor ou for uma saudação como "olá" ou "bom dia", responda com cordialidade e pergunte se quer registrar alguma despesa ou consultar o saldo.`

/**
 * Ferramentas (Tools) disponíveis para a API do Gemini
 */
const AGENT_TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'create_transaction',
        description:
          'Registra uma nova entrada (income) ou saída (expense) financeira no myFinance.',
        parameters: {
          type: 'OBJECT',
          properties: {
            type: {
              type: 'STRING',
              enum: ['income', 'expense'],
              description: 'Tipo da transação: income (receita) ou expense (despesa).',
            },
            amount: {
              type: 'NUMBER',
              description: 'Valor numérico positivo em reais (ex: 45.50).',
            },
            title: {
              type: 'STRING',
              description: 'Descrição ou nome curto do lançamento (ex: Almoço, Gasolina, Salário).',
            },
            category: {
              type: 'STRING',
              description: 'Nome da categoria correspondente no myFinance.',
            },
            date: {
              type: 'STRING',
              description: 'Data no formato YYYY-MM-DD.',
            },
            status: {
              type: 'STRING',
              enum: ['paid', 'pending'],
              description:
                'Status do pagamento: paid (pago/recebido) ou pending (a pagar/a receber).',
            },
          },
          required: ['type', 'amount', 'title', 'category', 'date'],
        },
      },
      {
        name: 'query_summary',
        description: 'Consulta o saldo atual, receitas, despesas e taxa de economia do período.',
        parameters: {
          type: 'OBJECT',
          properties: {
            period: {
              type: 'STRING',
              enum: ['current_month', 'today', 'all'],
              description: 'Período desejado da consulta financeira.',
            },
          },
        },
      },
    ],
  },
]

/**
 * Parser heurístico local resiliente em português (funciona offline ou quando sem API Key do Gemini)
 */
function localRuleBasedParser(
  message: string,
  currentDate: string,
  categories: string[],
): AgentResponse {
  const normalized = message.toLowerCase().trim()

  // 1. Detecção de saudações
  if (
    /^(oi|olá|ola|bom dia|boa tarde|boa noite|opa|e ai|e aí)\b/i.test(normalized) &&
    normalized.length < 20
  ) {
    return {
      action: 'clarification',
      replyText:
        '👋 Olá! Sou o assistente do myFinance. Como posso te ajudar hoje? Você pode me dizer algo como: *"Gastei 45 no almoço"* ou *"Qual meu saldo?"*.',
    }
  }

  // 2. Detecção de consulta de saldo
  if (/saldo|quanto (tenho|sobrou|gastei)|resumo|como est(a|á) meu m(e|ê)s/i.test(normalized)) {
    return {
      action: 'query_summary',
      replyText: '📊 Consultando seu resumo financeiro atual...',
      rawToolCall: { name: 'query_summary', args: { period: 'current_month' } },
    }
  }

  // 3. Extração de valor em reais (ex: R$ 45,90 ou 45.90 ou 45 reais ou 45)
  const amountMatch = normalized.match(
    /(?:r\$\s*|reais\s*|valor\s*(?:de\s*)?)?(\d+(?:[.,]\d{1,2})?)(?:\s*(?:reais|pila|conto))?/i,
  )
  let amount = 0
  if (amountMatch) {
    const rawVal = amountMatch[1].replace(',', '.')
    amount = Number.parseFloat(rawVal)
  }

  if (!amount || Number.isNaN(amount) || amount <= 0) {
    return {
      action: 'clarification',
      replyText:
        'Entendi que você quer registrar uma movimentação, mas não consegui identificar o valor. Poderia me dizer quanto foi? Exemplo: *"Gastei 35 na padaria"* 🥖',
    }
  }

  // 4. Detecção de tipo (Receita vs Despesa)
  const isIncome = /recebi|ganhei|sal(a|á)rio|dep(o|ó)sito|pix de|entrada|rendimento|freela/i.test(
    normalized,
  )
  const type: 'income' | 'expense' = isIncome ? 'income' : 'expense'

  // 5. Detecção de categoria
  let category = isIncome ? 'Trabalho' : 'Outros'
  const foundCat = categories.find((c) => normalized.includes(c.toLowerCase()))
  if (foundCat) {
    category = foundCat
  } else if (
    /almoço|jantar|lanche|padaria|mercado|açaí|pizza|restaurante|ifood|burger/i.test(normalized)
  ) {
    category = 'Alimentação'
  } else if (/uber|gasolina|combust(i|í)vel|metr(o|ô)|ônibus|estacionamento/i.test(normalized)) {
    category = 'Transporte'
  } else if (/farm(a|á)cia|rem(e|é)dio|m(e|é)dico|dentista|hospital/i.test(normalized)) {
    category = 'Saúde'
  } else if (/aluguel|condom(i|í)nio|luz|água|internet|iptu/i.test(normalized)) {
    category = 'Moradia'
  } else if (/cinema|festa|bar|cerveja|jogo|show|viagem/i.test(normalized)) {
    category = 'Lazer'
  }

  // 6. Título amigável
  let title = message
    .replace(/(?:r\$\s*|\d+(?:[.,]\d{1,2})?|\s*(?:reais|pila|conto))/gi, '')
    .replace(/\b(gastei|paguei|comprei|recebi|ganhei|no|na|de|com|ontem|hoje)\b/gi, '')
    .trim()

  if (!title || title.length < 2) {
    title = category
  } else {
    title = title.charAt(0).toUpperCase() + title.slice(1)
  }

  const status: 'paid' | 'pending' = /vou pagar|vence|amanhã|agendado|pendente/i.test(normalized)
    ? 'pending'
    : 'paid'

  return {
    action: 'create_transaction',
    replyText: `✅ **Lançamento Pronto:**\n• **${type === 'income' ? 'Receita' : 'Despesa'}:** R$ ${amount.toFixed(2).replace('.', ',')}\n• **Descrição:** ${title}\n• **Categoria:** ${category}\n• **Status:** ${status === 'paid' ? 'Pago' : 'Pendente'}`,
    proposedTransaction: {
      type,
      amount,
      title,
      category,
      date: currentDate,
      status,
    },
    rawToolCall: {
      name: 'create_transaction',
      args: { type, amount, title, category, date: currentDate, status },
    },
  }
}

/**
 * Processa a mensagem do usuário via Google Gemini 2.0 / 1.5 Flash com Function Calling
 */
export async function processFinanceAgentMessage({
  message,
  availableCategories = DEFAULT_CATEGORIES.map((c) => c.name),
  currentDate = new Date().toISOString().split('T')[0],
  apiKey = import.meta.env.VITE_GEMINI_API_KEY,
}: ProcessMessageParams): Promise<AgentResponse> {
  const trimmed = message.trim()
  if (!trimmed) {
    return {
      action: 'clarification',
      replyText: 'Envie uma mensagem descrevendo seu gasto ou receita para que eu possa registrar!',
    }
  }

  // Se não houver chave de API configurada, utiliza o parser heurístico local imediato
  if (!apiKey || apiKey === 'sua-chave-gemini' || apiKey.length < 15) {
    return localRuleBasedParser(trimmed, currentDate, availableCategories)
  }

  try {
    const promptWithContext = `Data de hoje: ${currentDate}.\nCategorias válidas disponíveis: [${availableCategories.join(', ')}].\nMensagem do usuário: "${trimmed}"`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: promptWithContext }],
            },
          ],
          tools: AGENT_TOOLS,
          generationConfig: {
            temperature: 0.1, // Temperatura baixa para máxima precisão factual
          },
        }),
      },
    )

    if (!response.ok) {
      console.warn(
        '[FinanceAgent] Falha na requisição Gemini, recorrendo ao parser local:',
        response.statusText,
      )
      return localRuleBasedParser(trimmed, currentDate, availableCategories)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    const parts = candidate?.content?.parts || []

    // 1. Verifica se o Gemini acionou uma Function Call (Tool Call)
    for (const part of parts) {
      if (part.functionCall) {
        const { name, args } = part.functionCall

        if (name === 'create_transaction') {
          const type = (args.type as 'income' | 'expense') || 'expense'
          const amount = Number(args.amount) || 0
          const title = String(args.title || 'Lançamento')
          const category = String(args.category || 'Outros')
          const date = String(args.date || currentDate)
          const status = (args.status as 'paid' | 'pending') || 'paid'

          return {
            action: 'create_transaction',
            replyText: `✅ **Lançamento Registrado:**\n• **${type === 'income' ? 'Entrada' : 'Saída'}:** R$ ${amount.toFixed(2).replace('.', ',')}\n• **Descrição:** ${title}\n• **Categoria:** ${category}\n• **Data:** ${date.split('-').reverse().join('/')}\n• **Status:** ${status === 'paid' ? 'Efetivado' : 'Pendente'}`,
            proposedTransaction: {
              type,
              amount,
              title,
              category,
              date,
              status,
            },
            rawToolCall: { name, args },
          }
        }

        if (name === 'query_summary') {
          return {
            action: 'query_summary',
            replyText: '📊 Consultando seus totais e saldo do myFinance...',
            rawToolCall: { name, args },
          }
        }
      }
    }

    // 2. Se o Gemini respondeu com texto explicativo
    const textPart = parts.find((p: { text?: string }) => p.text)?.text
    if (textPart) {
      return {
        action: 'clarification',
        replyText: textPart,
      }
    }

    return localRuleBasedParser(trimmed, currentDate, availableCategories)
  } catch (error) {
    console.error('[FinanceAgent] Erro ao comunicar com Gemini API:', error)
    return localRuleBasedParser(trimmed, currentDate, availableCategories)
  }
}
