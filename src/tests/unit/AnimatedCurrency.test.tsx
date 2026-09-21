import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AnimatedCurrency } from '../../presentation/components/common/AnimatedCurrency'

describe('<AnimatedCurrency /> (Padrão Awwwards / Números Vivos)', () => {
  it('deve renderizar o valor formatado inicialmente em moeda brasileira', () => {
    render(<AnimatedCurrency value={1250.5} data-testid="animated-val" />)

    const el = screen.getByTestId('animated-val')
    expect(el).toBeInTheDocument()
    expect(el.textContent).toMatch(/1\.250,50/)
  })

  it('deve conter title acessível com o valor formatado', () => {
    render(<AnimatedCurrency value={500} data-testid="animated-val" />)

    const el = screen.getByTestId('animated-val')
    expect(el).toHaveAttribute('title')
    expect(el.getAttribute('title')).toMatch(/500,00/)
  })

  it('deve lidar com valores negativos e zero', () => {
    const { rerender } = render(<AnimatedCurrency value={0} data-testid="zero-val" />)
    expect(screen.getByTestId('zero-val').textContent).toMatch(/0,00/)

    rerender(<AnimatedCurrency value={-350.2} data-testid="zero-val" />)
    expect(screen.getByTestId('zero-val')).toBeInTheDocument()
  })
})
