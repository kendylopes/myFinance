import { describe, expect, it } from 'vitest'
import {
  addMonthsToDate,
  formatDate,
  formatMonthYear,
  getAdjacentMonth,
  getCurrentYearMonth,
  getLocalDateString,
} from '../../core/formatters/date'

describe('date formatters (Utilitários de Manipulação e Formatação de Datas)', () => {
  describe('getLocalDateString', () => {
    it('deve formatar data local no formato YYYY-MM-DD sem distorção de UTC', () => {
      const fixedDate = new Date(2026, 9, 2, 23, 45, 0) // 02 de Outubro de 2026 às 23:45
      expect(getLocalDateString(fixedDate)).toBe('2026-10-02')
    })

    it('deve preencher mês e dia com zero à esquerda', () => {
      const singleDigit = new Date(2026, 0, 5) // 05 de Janeiro de 2026
      expect(getLocalDateString(singleDigit)).toBe('2026-01-05')
    })
  })

  describe('formatDate', () => {
    it('deve formatar YYYY-MM-DD para DD/MM/AAAA', () => {
      expect(formatDate('2026-10-02')).toBe('02/10/2026')
      expect(formatDate('')).toBe('')
    })
  })

  describe('getCurrentYearMonth & formatMonthYear', () => {
    it('deve retornar formato YYYY-MM para o mês atual', () => {
      expect(getCurrentYearMonth()).toMatch(/^\d{4}-\d{2}$/)
    })

    it('deve formatar por extenso com primeira letra maiúscula', () => {
      expect(formatMonthYear('2026-10')).toContain('Outubro de 2026')
      expect(formatMonthYear('all')).toBe('Todos os períodos')
    })
  })

  describe('getAdjacentMonth & addMonthsToDate', () => {
    it('deve calcular meses anteriores e posteriores', () => {
      expect(getAdjacentMonth('2026-10', 1)).toBe('2026-11')
      expect(getAdjacentMonth('2026-10', -1)).toBe('2026-09')
      expect(getAdjacentMonth('2026-01', -1)).toBe('2025-12')
    })

    it('deve fazer clamp de dias em meses mais curtos', () => {
      // 31 de Janeiro + 1 mês -> 28 de Fevereiro em ano não bissexto
      expect(addMonthsToDate('2026-01-31', 1)).toBe('2026-02-28')
      // Adicionar 0 meses retorna a mesma data
      expect(addMonthsToDate('2026-05-15', 0)).toBe('2026-05-15')
    })
  })
})
