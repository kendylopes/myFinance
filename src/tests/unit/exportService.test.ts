import { describe, expect, it } from 'vitest'
import type { FinanceSummary, Transaction } from '../../domain/models/transaction'
import { generateCsvContent, generatePrintableHtml } from '../../domain/services/exportService'

describe('exportService (Exportação CSV e HTML Imprimível)', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Salário Mensal',
      amount: 4500,
      type: 'income',
      category: 'Trabalho',
      date: '2026-09-05',
    },
    {
      id: '2',
      title: 'Mercado; Supermercado & "Padaria"',
      amount: 325.5,
      type: 'expense',
      category: 'Alimentação',
      date: '2026-09-10',
    },
  ]

  const sampleSummary: FinanceSummary = {
    totalIncome: 4500,
    totalExpense: 325.5,
    balance: 4174.5,
  }

  describe('generateCsvContent', () => {
    it('deve gerar cabeçalho CSV com separador ponto-e-vírgula e UTF-8 BOM', () => {
      const csv = generateCsvContent([])
      expect(csv.startsWith('\uFEFF')).toBe(true)
      expect(csv).toContain('Data;Descrição;Categoria;Tipo;Valor (R$)')
    })

    it('deve formatar linhas de dados com valores decimais brasileiros e escape de aspas', () => {
      const csv = generateCsvContent(sampleTransactions)
      const lines = csv.split('\r\n')

      expect(lines).toHaveLength(3) // Cabeçalho + 2 linhas de dados
      // Linha 1: Salário
      expect(lines[1]).toContain('Trabalho;Receita;4500,00')
      // Linha 2: Título com ; e " escapados
      expect(lines[2]).toContain('"Mercado; Supermercado & ""Padaria"""')
      expect(lines[2]).toContain('Alimentação;Despesa;325,50')
    })
  })

  describe('generatePrintableHtml', () => {
    it('deve gerar documento HTML válido contendo marca, resumo e período', () => {
      const html = generatePrintableHtml(sampleTransactions, sampleSummary, 'Setembro de 2026')

      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('my<span>Finance</span>')
      expect(html).toContain('Setembro de 2026')
      expect(html).toContain('4.500,00')
      expect(html).toContain('325,50')
      expect(html).toContain('Salário Mensal')
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
