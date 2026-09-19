import { formatBRL } from '../../core/formatters/currency'
import { formatDate } from '../../core/formatters/date'
import type { FinanceSummary, Transaction } from '../models/transaction'

/**
 * Escapa strings para formato CSV caso contenham delimitadores ou aspas.
 */
const escapeCsvField = (field: string | number): string => {
  const str = String(field ?? '')
  if (str.includes(';') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * Gera conteúdo CSV em formato UTF-8 compatível com Excel e Google Sheets.
 * Utiliza ponto-e-vírgula (;) como delimitador e vírgula como separador decimal.
 */
export const generateCsvContent = (transactions: Transaction[]): string => {
  const BOM = '\uFEFF'
  const header = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor (R$)'].join(';')

  const rows = transactions.map((t) => {
    const formattedDate = formatDate(t.date)
    const title = escapeCsvField(t.title)
    const category = escapeCsvField(t.category || 'Geral')
    const type = t.type === 'income' ? 'Receita' : 'Despesa'
    // Formata o número com 2 casas decimais e vírgula como separador decimal
    const amountStr = t.amount.toFixed(2).replace('.', ',')

    return [formattedDate, title, category, type, amountStr].join(';')
  })

  return BOM + [header, ...rows].join('\r\n')
}

/**
 * Gera documento HTML formatado especificamente para impressão ou download em PDF via navegador.
 */
export const generatePrintableHtml = (
  transactions: Transaction[],
  summary: FinanceSummary,
  periodLabel: string,
): string => {
  const issueDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const rowsHtml =
    transactions.length === 0
      ? `<tr><td colspan="5" style="text-align: center; padding: 24px; color: #64748b;">Nenhuma movimentação registrada no período.</td></tr>`
      : transactions
          .map(
            (t, index) => `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #334155;">${formatDate(t.date)}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 500; color: #0f172a;">${t.title}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; color: #475569;">${t.category || 'Geral'}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; ${
            t.type === 'income'
              ? 'background-color: #dcfce7; color: #166534;'
              : 'background-color: #ffe4e6; color: #9f1239;'
          }">
            ${t.type === 'income' ? 'Receita' : 'Despesa'}
          </span>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; text-align: right; color: ${
          t.type === 'income' ? '#15803d' : '#be123c'
        };">
          ${t.type === 'income' ? '+' : '-'} ${formatBRL(t.amount)}
        </td>
      </tr>
    `,
          )
          .join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Extrato Financeiro - myFinance</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      margin: 0;
      padding: 20px;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand { font-size: 24px; font-weight: 800; color: #0f172a; }
    .brand span { color: #10b981; }
    .meta { text-align: right; font-size: 12px; color: #64748b; }
    .cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 28px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
    }
    .card-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 4px; }
    .card-value { font-size: 18px; font-weight: 700; }
    .income { color: #15803d; }
    .expense { color: #be123c; }
    .balance { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th {
      background: #0f172a;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      text-align: left;
      padding: 10px 12px;
    }
    th:last-child { text-align: right; }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
      font-size: 11px;
      color: #94a3b8;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">my<span>Finance</span></div>
      <div style="font-size: 13px; color: #475569; margin-top: 4px;">Relatório de Extrato Financeiro</div>
    </div>
    <div class="meta">
      <div><strong>Período:</strong> ${periodLabel}</div>
      <div><strong>Emissão:</strong> ${issueDate}</div>
    </div>
  </div>

  <div class="cards">
    <div class="card">
      <div class="card-label">Total de Entradas</div>
      <div class="card-value income">${formatBRL(summary.totalIncome)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total de Saídas</div>
      <div class="card-value expense">${formatBRL(summary.totalExpense)}</div>
    </div>
    <div class="card">
      <div class="card-label">Saldo do Período</div>
      <div class="card-value balance">${formatBRL(summary.balance)}</div>
    </div>
  </div>

  <h3 style="font-size: 15px; margin-bottom: 8px; color: #1e293b;">Movimentações do Período (${transactions.length})</h3>
  <table>
    <thead>
      <tr>
        <th style="border-top-left-radius: 6px;">Data</th>
        <th>Descrição</th>
        <th>Categoria</th>
        <th>Tipo</th>
        <th style="border-top-right-radius: 6px;">Valor</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="footer">
    Documento gerado automaticamente pelo myFinance • Gestão Financeira Pessoal Inteligente
  </div>
</body>
</html>`
}
