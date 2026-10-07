import type { ParsedStatementItem, StatementParseResult } from '../models/statement'
import type { Transaction } from '../models/transaction'
import { predictCategoryFromDescription } from './categoryPredictor'

/**
 * Remove acentuações e caracteres residuais para comparação flexível.
 */
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Converte data de formato OFX (ex: 20261001... ou 20261001120000[-3:BRT]) para YYYY-MM-DD.
 */
export const parseOfxDate = (rawDate: string): string => {
  const clean = rawDate.replace(/\D/g, '')
  if (clean.length >= 8) {
    const year = clean.substring(0, 4)
    const month = clean.substring(4, 6)
    const day = clean.substring(6, 8)
    return `${year}-${month}-${day}`
  }
  return ''
}

/**
 * Converte data de formatos comuns em CSV (DD/MM/YYYY, YYYY-MM-DD, etc.) para YYYY-MM-DD.
 */
export const parseCsvDate = (rawDate: string): string => {
  const trimmed = rawDate.trim()
  // Formato DD/MM/YYYY ou D/M/YYYY
  const brMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (brMatch) {
    const day = String(brMatch[1]).padStart(2, '0')
    const month = String(brMatch[2]).padStart(2, '0')
    const year = brMatch[3]
    return `${year}-${month}-${day}`
  }

  // Formato YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (isoMatch) {
    const year = isoMatch[1]
    const month = String(isoMatch[2]).padStart(2, '0')
    const day = String(isoMatch[3]).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return ''
}

/**
 * Faz parse de valores monetários tanto no padrão brasileiro (1.234,56 ou -45,90) quanto internacional (1234.56).
 */
export const parseAmountValue = (rawValue: string): number => {
  if (!rawValue) return 0
  let clean = rawValue.replace(/[R$\s]/g, '').trim()

  // Se tiver vírgula e ponto (ex: 1.234,56 ou 1,234.56)
  if (clean.includes(',') && clean.includes('.')) {
    const lastComma = clean.lastIndexOf(',')
    const lastDot = clean.lastIndexOf('.')
    if (lastComma > lastDot) {
      // Padrão brasileiro: 1.250,50 -> 1250.50
      clean = clean.replace(/\./g, '').replace(',', '.')
    } else {
      // Padrão americano: 1,250.50 -> 1250.50
      clean = clean.replace(/,/g, '')
    }
  } else if (clean.includes(',')) {
    // Apenas vírgula (ex: 1250,50 ou -45,90)
    clean = clean.replace(',', '.')
  }

  const num = Number.parseFloat(clean)
  return Number.isNaN(num) ? 0 : num
}

/**
 * Extrai transações financeiras de arquivos OFX (Open Financial Exchange).
 * Suporta formatos SGML e XML dos principais bancos do Brasil (Nubank, Itaú, Inter, etc.).
 */
export const parseOfxContent = (rawContent: string): ParsedStatementItem[] => {
  const items: ParsedStatementItem[] = []

  // Divide o arquivo pelas tags de início de transação <STMTTRN>
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi
  let match: RegExpExecArray | null = trnRegex.exec(rawContent)

  let idCounter = 1

  while (match !== null) {
    const block = match[1]

    // Extrai campos usando regex tolerante a tags abertas ou fechadas
    const typeMatch = block.match(/<TRNTYPE>([^<\r\n]+)/i)
    const dateMatch = block.match(/<DTPOSTED>([^<\r\n]+)/i)
    const amtMatch = block.match(/<TRNAMT>([^<\r\n]+)/i)
    const memoMatch = block.match(/<MEMO>([^<\r\n]+)/i)
    const nameMatch = block.match(/<NAME>([^<\r\n]+)/i)

    const rawDate = dateMatch ? dateMatch[1].trim() : ''
    const rawAmt = amtMatch ? amtMatch[1].trim() : ''
    const rawTitle = memoMatch
      ? memoMatch[1].trim()
      : nameMatch
        ? nameMatch[1].trim()
        : 'Transação Bancária'
    const trnType = typeMatch ? typeMatch[1].trim().toUpperCase() : ''

    const parsedDate = parseOfxDate(rawDate)
    const parsedAmount = parseAmountValue(rawAmt)

    if (parsedDate && parsedAmount !== 0) {
      // No OFX: valor negativo = saída/despesa, valor positivo = entrada/receita
      const isExpense =
        parsedAmount < 0 ||
        trnType === 'DEBIT' ||
        trnType === 'PAYMENT' ||
        trnType === 'POS' ||
        trnType === 'FEE'
      const positiveAmount = Math.abs(parsedAmount)
      const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim()

      const prediction = predictCategoryFromDescription(cleanTitle)

      items.push({
        id: `ofx-${Date.now()}-${idCounter++}`,
        date: parsedDate,
        title: cleanTitle,
        amount: Math.round(positiveAmount * 100) / 100,
        type: isExpense ? 'expense' : 'income',
        category: prediction?.category || 'Outros',
        status: 'paid',
        selected: true,
      })
    }

    match = trnRegex.exec(rawContent)
  }

  return items
}

/**
 * Detecta o delimitador do CSV (; , ou \t).
 */
const detectCsvDelimiter = (firstLines: string[]): string => {
  const line = firstLines[0] || ''
  const semicolons = (line.match(/;/g) || []).length
  const commas = (line.match(/,/g) || []).length
  const tabs = (line.match(/\t/g) || []).length

  if (semicolons >= commas && semicolons >= tabs) return ';'
  if (commas >= tabs) return ','
  return '\t'
}

/**
 * Faz parse de arquivos CSV bancários.
 */
export const parseCsvContent = (rawContent: string): ParsedStatementItem[] => {
  const cleanContent = rawContent.replace(/^\uFEFF/, '').trim()
  const lines = cleanContent.split(/\r?\n/).filter((l) => l.trim().length > 0)
  if (lines.length < 2) return []

  const delimiter = detectCsvDelimiter(lines.slice(0, 3))
  const headerTokens = lines[0].split(delimiter).map((h) => normalizeText(h))

  // Mapeia índices das colunas
  let dateIndex = -1
  let titleIndex = -1
  let amountIndex = -1
  let typeIndex = -1

  for (let i = 0; i < headerTokens.length; i++) {
    const col = headerTokens[i]
    if (dateIndex === -1 && (col.includes('data') || col.includes('date'))) {
      dateIndex = i
    } else if (
      titleIndex === -1 &&
      (col.includes('descricao') ||
        col.includes('titulo') ||
        col.includes('historico') ||
        col.includes('memo') ||
        col.includes('estabelecimento') ||
        col.includes('lancamento'))
    ) {
      titleIndex = i
    } else if (
      amountIndex === -1 &&
      (col.includes('valor') || col.includes('amount') || col.includes('quantia'))
    ) {
      amountIndex = i
    } else if (typeIndex === -1 && (col.includes('tipo') || col.includes('type'))) {
      typeIndex = i
    }
  }

  // Fallback caso não encontre pelo cabeçalho
  if (dateIndex === -1) dateIndex = 0
  if (titleIndex === -1) titleIndex = 1
  if (amountIndex === -1) amountIndex = headerTokens.length > 2 ? 2 : 1

  const items: ParsedStatementItem[] = []
  let idCounter = 1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const cols = line.split(delimiter).map((c) => c.replace(/^["']|["']$/g, '').trim())

    if (cols.length <= Math.max(dateIndex, amountIndex)) continue

    const rawDate = cols[dateIndex] || ''
    const rawTitle = cols[titleIndex] || 'Lançamento'
    const rawAmount = cols[amountIndex] || ''
    const rawType = typeIndex !== -1 ? cols[typeIndex] : ''

    const parsedDate = parseCsvDate(rawDate)
    const numAmount = parseAmountValue(rawAmount)

    if (parsedDate && numAmount !== 0) {
      let isExpense = numAmount < 0
      if (rawType) {
        const normType = normalizeText(rawType)
        if (
          normType.includes('deb') ||
          normType.includes('saida') ||
          normType.includes('despesa')
        ) {
          isExpense = true
        } else if (
          normType.includes('cred') ||
          normType.includes('entrada') ||
          normType.includes('receita')
        ) {
          isExpense = false
        }
      }

      const cleanTitle = rawTitle.replace(/\s+/g, ' ').trim()
      const prediction = predictCategoryFromDescription(cleanTitle)

      items.push({
        id: `csv-${Date.now()}-${idCounter++}`,
        date: parsedDate,
        title: cleanTitle,
        amount: Math.round(Math.abs(numAmount) * 100) / 100,
        type: isExpense ? 'expense' : 'income',
        category: prediction?.category || 'Outros',
        status: 'paid',
        selected: true,
      })
    }
  }

  return items
}

/**
 * Compara as transações extraídas do extrato com as já cadastradas no sistema.
 * Se encontrar uma transação com a mesma data e valor equivalente (e título similar), marca como duplicata e desmarca.
 */
export const detectDuplicates = (
  items: ParsedStatementItem[],
  existingTransactions: Transaction[] = [],
): ParsedStatementItem[] => {
  if (existingTransactions.length === 0) return items

  return items.map((item) => {
    let matchedTransaction: Transaction | undefined

    for (const existing of existingTransactions) {
      const sameDate = existing.date === item.date
      const sameType = existing.type === item.type
      const sameAmount = Math.abs(existing.amount - item.amount) < 0.01

      if (!sameType || !sameAmount) continue

      // Verifica similaridade no título
      const normExisting = normalizeText(existing.title)
      const normItem = normalizeText(item.title)
      const titleMatches =
        normExisting === normItem ||
        normExisting.includes(normItem) ||
        normItem.includes(normExisting)

      // Se for na mesma data com valor idêntico
      if (sameDate && (titleMatches || !normItem || !normExisting)) {
        matchedTransaction = existing
        break
      }

      // Se a data for dentro de +- 1 dia útil e o título bater exatamente
      if (titleMatches && normItem.length > 3) {
        const diffMs = Math.abs(new Date(existing.date).getTime() - new Date(item.date).getTime())
        const diffDays = diffMs / (1000 * 60 * 60 * 24)
        if (diffDays <= 2) {
          matchedTransaction = existing
          break
        }
      }
    }

    if (matchedTransaction) {
      return {
        ...item,
        isDuplicate: true,
        duplicateReason: `Transação idêntica já cadastrada: "${matchedTransaction.title}" em ${matchedTransaction.date}`,
        matchedExistingTitle: matchedTransaction.title,
        matchedExistingDate: matchedTransaction.date,
        matchedExistingAmount: matchedTransaction.amount,
        selected: false, // Desmarcado por segurança
      }
    }

    return item
  })
}

/**
 * Função principal que recebe o conteúdo do arquivo e orquestra o parsing e detecção de duplicatas.
 */
export const parseStatementFile = (
  content: string,
  filename: string,
  existingTransactions: Transaction[] = [],
): StatementParseResult => {
  const isOfx =
    filename.toLowerCase().endsWith('.ofx') ||
    content.includes('<OFX>') ||
    content.includes('<STMTTRN>')

  let items: ParsedStatementItem[] = []

  if (isOfx) {
    items = parseOfxContent(content)
  } else {
    items = parseCsvContent(content)
  }

  const itemsWithDuplicates = detectDuplicates(items, existingTransactions)

  return {
    filename,
    fileType: isOfx ? 'ofx' : 'csv',
    totalItems: itemsWithDuplicates.length,
    items: itemsWithDuplicates,
  }
}
