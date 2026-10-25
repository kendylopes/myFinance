import { describe, expect, it } from 'vitest'
// @ts-expect-error - scripts/whatsapp-bridge.mjs é ESM puro sem tipos .d.ts
import { parseDebtAction } from '../../../scripts/whatsapp-bridge.mjs'

describe('WhatsApp Bridge - parseDebtAction (Cobranças e Empréstimos)', () => {
  it('deve identificar registro de empréstimo concedido (cobrança a receber)', () => {
    const res1 = parseDebtAction('emprestei 50 pro Carlos')
    expect(res1).toEqual({
      action: 'create_debt',
      name: 'Carlos',
      amount: 50,
      type: 'receivable',
    })

    const res2 = parseDebtAction('emprestei 120,50 para Mariana')
    expect(res2).toEqual({
      action: 'create_debt',
      name: 'Mariana',
      amount: 120.5,
      type: 'receivable',
    })

    const res3 = parseDebtAction('cobrar 80 do João')
    expect(res3).toEqual({
      action: 'create_debt',
      name: 'João',
      amount: 80,
      type: 'receivable',
    })
  })

  it('deve identificar registro de dívida tomada (a pagar)', () => {
    const res1 = parseDebtAction('peguei emprestado 500 do Zé')
    expect(res1).toEqual({
      action: 'create_debt',
      name: 'Zé',
      amount: 500,
      type: 'payable',
    })

    const res2 = parseDebtAction('estou devendo 350 pro Marcelo')
    expect(res2).toEqual({
      action: 'create_debt',
      name: 'Marcelo',
      amount: 350,
      type: 'payable',
    })
  })

  it('deve identificar consulta de quem me deve', () => {
    expect(parseDebtAction('quem me deve?')).toEqual({ action: 'query_receivables' })
    expect(parseDebtAction('quem tá me devendo')).toEqual({ action: 'query_receivables' })
    expect(parseDebtAction('cobranças')).toEqual({ action: 'query_receivables' })
    expect(parseDebtAction('meus empréstimos')).toEqual({ action: 'query_receivables' })
  })

  it('deve identificar consulta de minhas dívidas', () => {
    expect(parseDebtAction('minhas dívidas')).toEqual({ action: 'query_payables' })
    expect(parseDebtAction('quanto eu devo?')).toEqual({ action: 'query_payables' })
    expect(parseDebtAction('quem eu devo')).toEqual({ action: 'query_payables' })
  })

  it('deve identificar recebimento de pagamento de devedor', () => {
    const res1 = parseDebtAction('Carlos me pagou 50')
    expect(res1).toEqual({
      action: 'pay_debt',
      name: 'Carlos',
      amount: 50,
      type: 'receivable',
    })

    const res2 = parseDebtAction('recebi 100 da Mariana')
    expect(res2).toEqual({
      action: 'pay_debt',
      name: 'Mariana',
      amount: 100,
      type: 'receivable',
    })
  })

  it('deve identificar pagamento de dívida própria', () => {
    const res = parseDebtAction('paguei 200 pro Zé')
    expect(res).toEqual({
      action: 'pay_debt',
      name: 'Zé',
      amount: 200,
      type: 'payable',
    })
  })

  it('deve retornar null para mensagens de gastos normais que não envolvem empréstimos', () => {
    expect(parseDebtAction('gastei 45 no almoço')).toBeNull()
    expect(parseDebtAction('comprei 55 de gasolina')).toBeNull()
    expect(parseDebtAction('qual meu saldo?')).toBeNull()
  })
})
