import { describe, expect, it } from 'vitest'
import type { FinanceSummary, Transaction } from '../../domain/models/transaction'
import {
  escapeCsvField,
  escapeHtml,
  generateCsvContent,
  generatePrintableHtml,
} from '../../domain/services/exportService'

describe('exportService (Exportação CSV e HTML Imprimível com Segurança e Status)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Salário Mensal',
      amount: 4500,
      type: 'income',
      category: 'Trabalho',
      date: '2026-09-05',
      status: 'paid',
    },
    {
      id: '2',
      title: 'Mercado; Supermercado & "Padaria"',
      amount: 325.5,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-10',
      status: 'pending',
    },
    {
      id: '3',
      title: '=1+2 Formula Injection & <script>alert(1)</script>',
      amount: 100,
      type: 'expense',
      category: 'Lazer',
      date: '2026-09-15',
      status: 'paid',
    },
  ]

  const sampleSummary: FinanceSummary = {
    totalIncome: 4500,
    totalExpense: 425.5,
    balance: 4074.5,
  }

  describe('escapeHtml e escapeCsvField (Segurança)', () => {
    it('deve escapar tags HTML perigosas para prevenir XSS', () => {
      const malicious = '<script>alert("xss")</script>&"test"'
      const escaped = escapeHtml(malicious)
      expect(escaped).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;&amp;&quot;test&quot;',
      )
    })

    it('deve neutralizar fórmulas no CSV prefixando com apóstrofo', () => {
      expect(escapeCsvField('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)")
      expect(escapeCsvField('+cmd|...')).toBe("'+cmd|...")
      expect(escapeCsvField('-123')).toBe("'-123")
      expect(escapeCsvField('@cmd')).toBe("'@cmd")
    })
  })

  describe('generateCsvContent', () => {
    it('deve gerar cabeçalho CSV com separador ponto-e-vírgula, coluna Status e UTF-8 BOM', () => {
      const csv = generateCsvContent([])
      expect(csv.startsWith('\uFEFF')).toBe(true)
      expect(csv).toContain('Data;Descrição;Categoria;Tipo;Status;Valor (R$)')
    })

    it('deve formatar linhas com status de pagamento, decimais brasileiros e escape de aspas', () => {
      const csv = generateCsvContent(sampleTransactions)
      const lines = csv.split('\r\n')

      expect(lines).toHaveLength(4) // Cabeçalho + 3 linhas de dados
      // Linha 1: Salário (Recebido)
      expect(lines[1]).toContain('Trabalho;Receita;Recebido;4500,00')
      // Linha 2: Pendente
      expect(lines[2]).toContain('"Mercado; Supermercado & ""Padaria"""')
      expect(lines[2]).toContain('Alimentação;Despesa;Pendente;325,50')
      // Linha 3: Neutralização de fórmula
      expect(lines[3]).toContain("'=1+2 Formula")
    })
  })

  describe('generatePrintableHtml', () => {
    it('deve gerar documento HTML válido contendo marca, resumo, período e escapar XSS', () => {
      const html = generatePrintableHtml(sampleTransactions, sampleSummary, 'Setembro de 2026')

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('my<span>Finance</span>')
      expect(html).toContain('Setembro de 2026')
      expect(html).toContain('4.500,00')
      expect(html).toContain('Salário Mensal')
      expect(html).toContain('Recebido')
      expect(html).toContain('Pendente')
      // Verifica sanitização contra injeção de script
      expect(html).not.toContain('<script>alert(1)</script>')
      expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    })

    it('deve exibir mensagem de estado vazio no HTML quando lista for vazia', () => {
      const html = generatePrintableHtml(
        [],
        { totalIncome: 0, totalExpense: 0, balance: 0 },
        'Outubro de 2026',
      )

      expect(html).toContain('Nenhuma movimentação registrada no período.')
    })
  })
})
