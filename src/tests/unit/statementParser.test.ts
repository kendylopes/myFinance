import { describe, expect, it } from 'vitest'
import type { Transaction } from '../../domain/models/transaction'
import {
  detectDuplicates,
  parseAmountValue,
  parseCsvContent,
  parseCsvDate,
  parseOfxContent,
  parseOfxDate,
  parseStatementFile,
} from '../../domain/services/statementParser'

describe('statementParser (Parser de Extratos Bancários OFX e CSV)', () => {
  describe('parseOfxDate & parseCsvDate & parseAmountValue', () => {
    it('deve converter data OFX para YYYY-MM-DD', () => {
      expect(parseOfxDate('20261004120000[-3:BRT]')).toBe('2026-10-04')
      expect(parseOfxDate('20260905')).toBe('2026-09-05')
      expect(parseOfxDate('invalido')).toBe('')
    })

    it('deve converter data CSV para YYYY-MM-DD', () => {
      expect(parseCsvDate('04/10/2026')).toBe('2026-10-04')
      expect(parseCsvDate('4/5/2026')).toBe('2026-05-04')
      expect(parseCsvDate('2026-10-04')).toBe('2026-10-04')
      expect(parseCsvDate('invalido')).toBe('')
    })

    it('deve converter valores brasileiros e internacionais', () => {
      expect(parseAmountValue('1.250,50')).toBe(1250.5)
      expect(parseAmountValue('-45,90')).toBe(-45.9)
      expect(parseAmountValue('R$ 350,00')).toBe(350.0)
      expect(parseAmountValue('1250.50')).toBe(1250.5)
      expect(parseAmountValue('1,250.50')).toBe(1250.5)
    })
  })

  describe('parseOfxContent', () => {
    it('deve extrair transações de extrato OFX típico de bancos brasileiros', () => {
      const ofxSample = `
        <OFX>
          <BANKTRANLIST>
            <STMTTRN>
              <TRNTYPE>DEBIT
              <DTPOSTED>20261002120000
              <TRNAMT>-85.50
              <MEMO>SUPERMERCADO PAO DE ACUCAR
            </STMTTRN>
            <STMTTRN>
              <TRNTYPE>CREDIT
              <DTPOSTED>20261003120000
              <TRNAMT>3500.00
              <NAME>SALARIO MENSAL
            </STMTTRN>
          </BANKTRANLIST>
        </OFX>
      `

      const items = parseOfxContent(ofxSample)
      expect(items).toHaveLength(2)

      // Item 1: Despesa
      expect(items[0].date).toBe('2026-10-02')
      expect(items[0].title).toBe('SUPERMERCADO PAO DE ACUCAR')
      expect(items[0].amount).toBe(85.5)
      expect(items[0].type).toBe('expense')
      expect(items[0].status).toBe('paid')
      expect(items[0].category).toBe('Alimentação') // Auto-classificado!

      // Item 2: Receita
      expect(items[1].date).toBe('2026-10-03')
      expect(items[1].title).toBe('SALARIO MENSAL')
      expect(items[1].amount).toBe(3500.0)
      expect(items[1].type).toBe('income')
      expect(items[1].category).toBe('Salário') // Auto-classificado!
    })
  })

  describe('parseCsvContent', () => {
    it('deve fazer parse de CSV com separador ponto-e-vírgula e vírgula decimal', () => {
      const csvSample = `Data;Descrição;Valor;Tipo
01/10/2026;Restaurante Almoço;-35,00;Débito
02/10/2026;Pix Recebido João;150,00;Crédito`

      const items = parseCsvContent(csvSample)
      expect(items).toHaveLength(2)

      expect(items[0].date).toBe('2026-10-01')
      expect(items[0].title).toBe('Restaurante Almoço')
      expect(items[0].amount).toBe(35.0)
      expect(items[0].type).toBe('expense')
      expect(items[0].category).toBe('Alimentação')

      expect(items[1].date).toBe('2026-10-02')
      expect(items[1].title).toBe('Pix Recebido João')
      expect(items[1].amount).toBe(150.0)
      expect(items[1].type).toBe('income')
    })
  })

  describe('detectDuplicates', () => {
    it('deve marcar possíveis duplicatas se já existirem transações idênticas', () => {
      const existing: Transaction[] = [
        {
          id: 'existing-1',
          title: 'Posto Shell Gasolina',
          amount: 150.0,
          type: 'expense',
          category: 'Transporte',
          date: '2026-10-02',
        },
      ]

      const parsedItems = [
        {
          id: 'item-1',
          date: '2026-10-02',
          title: 'Posto Shell',
          amount: 150.0,
          type: 'expense' as const,
          category: 'Transporte',
          status: 'paid' as const,
          selected: true,
        },
        {
          id: 'item-2',
          date: '2026-10-02',
          title: 'Farmácia',
          amount: 50.0,
          type: 'expense' as const,
          category: 'Saúde',
          status: 'paid' as const,
          selected: true,
        },
      ]

      const processed = detectDuplicates(parsedItems, existing)
      expect(processed[0].isDuplicate).toBe(true)
      expect(processed[0].selected).toBe(false) // Desmarcado por precaução

      expect(processed[1].isDuplicate).toBeFalsy()
      expect(processed[1].selected).toBe(true)
    })
  })

  describe('parseStatementFile', () => {
    it('deve orquestrar detecção de arquivo OFX automaticamente', () => {
      const ofxSample = `
        <OFX>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261001120000
            <TRNAMT>-20.00
            <MEMO>PADARIA
          </STMTTRN>
        </OFX>
      `

      const result = parseStatementFile(ofxSample, 'extrato_nubank.ofx')
      expect(result.fileType).toBe('ofx')
      expect(result.totalItems).toBe(1)
      expect(result.items[0].title).toBe('PADARIA')
    })
  })
})
