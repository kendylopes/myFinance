import { describe, expect, it } from 'vitest'
import { predictCategoryFromDescription } from '../../domain/services/categoryPredictor'

describe('predictCategoryFromDescription (Auto-Classificação Inteligente)', () => {
  it('deve retornar null para descrições vazias ou muito curtas', () => {
    expect(predictCategoryFromDescription('')).toBeNull()
    expect(predictCategoryFromDescription('a')).toBeNull()
    expect(predictCategoryFromDescription('   ')).toBeNull()
  })

  it('deve identificar Despesas comuns com acentos e sem acentos', () => {
    // Alimentação
    expect(predictCategoryFromDescription('Almoço no restaurante')).toEqual({
      category: 'Alimentação',
      suggestedType: 'expense',
    })
    expect(predictCategoryFromDescription('compra supermercado')).toEqual({
      category: 'Alimentação',
      suggestedType: 'expense',
    })
    expect(predictCategoryFromDescription('padaria pao de queijo')).toEqual({
      category: 'Alimentação',
      suggestedType: 'expense',
    })

    // Transporte
    expect(predictCategoryFromDescription('Gasolina aditivada posto ipiranga')).toEqual({
      category: 'Transporte',
      suggestedType: 'expense',
    })
    expect(predictCategoryFromDescription('uber para o trabalho')).toEqual({
      category: 'Transporte',
      suggestedType: 'expense',
    })

    // Moradia
    expect(predictCategoryFromDescription('Conta de luz CPFL')).toEqual({
      category: 'Moradia',
      suggestedType: 'expense',
    })
    expect(predictCategoryFromDescription('Aluguel do apartamento')).toEqual({
      category: 'Moradia',
      suggestedType: 'expense',
    })

    // Saúde
    expect(predictCategoryFromDescription('farmacia remedio dor')).toEqual({
      category: 'Saúde',
      suggestedType: 'expense',
    })

    // Lazer
    expect(predictCategoryFromDescription('ingresso de cinema')).toEqual({
      category: 'Lazer',
      suggestedType: 'expense',
    })
    expect(predictCategoryFromDescription('mensalidade netflix')).toEqual({
      category: 'Lazer',
      suggestedType: 'expense',
    })
  })

  it('deve identificar Receitas comuns e sugerir o tipo income', () => {
    // Salário
    expect(predictCategoryFromDescription('Salário mensal da empresa')).toEqual({
      category: 'Salário',
      suggestedType: 'income',
    })
    expect(predictCategoryFromDescription('Adiantamento quinzenal')).toEqual({
      category: 'Salário',
      suggestedType: 'income',
    })

    // Freelance
    expect(predictCategoryFromDescription('Projeto freela landing page')).toEqual({
      category: 'Freelance / Bico',
      suggestedType: 'income',
    })

    // Investimentos
    expect(predictCategoryFromDescription('Dividendos recebidos MXRF11')).toEqual({
      category: 'Investimentos',
      suggestedType: 'income',
    })
  })

  it('deve retornar null quando a descrição não contiver palavras-chave conhecidas', () => {
    expect(predictCategoryFromDescription('xyz abc 1234')).toBeNull()
  })
})
