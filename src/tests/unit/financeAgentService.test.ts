import { describe, expect, it } from 'vitest'
import { processFinanceAgentMessage } from '../../core/ai/financeAgentService'

describe('financeAgentService', () => {
  it('deve extrair corretamente uma despesa com valor e categoria', async () => {
    const res = await processFinanceAgentMessage({
      message: 'Gastei 54 reais no almoço de hoje',
      currentDate: '2026-10-19',
    })

    expect(res.action).toBe('create_transaction')
    expect(res.proposedTransaction).toBeDefined()
    expect(res.proposedTransaction?.type).toBe('expense')
    expect(res.proposedTransaction?.amount).toBe(54)
    expect(res.proposedTransaction?.category).toBe('Alimentação')
    expect(res.proposedTransaction?.status).toBe('paid')
  })

  it('deve extrair corretamente uma receita/ganho', async () => {
    const res = await processFinanceAgentMessage({
      message: 'Recebi 1500 de um freela',
      currentDate: '2026-10-19',
    })

    expect(res.action).toBe('create_transaction')
    expect(res.proposedTransaction?.type).toBe('income')
    expect(res.proposedTransaction?.amount).toBe(1500)
    expect(res.proposedTransaction?.category).toBe('Trabalho')
  })

  it('deve reconhecer consulta de saldo', async () => {
    const res = await processFinanceAgentMessage({
      message: 'Qual é o meu saldo atual?',
      currentDate: '2026-10-19',
    })

    expect(res.action).toBe('query_summary')
  })

  it('deve responder educadamente a saudações sem valor', async () => {
    const res = await processFinanceAgentMessage({
      message: 'Olá bom dia!',
      currentDate: '2026-10-19',
    })

    expect(res.action).toBe('clarification')
    expect(res.replyText).toContain('Olá! Sou o assistente do myFinance')
  })
})
