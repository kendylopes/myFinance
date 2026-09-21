import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { BalanceSparkline } from '../../presentation/components/dashboard/BalanceSparkline'

describe('<BalanceSparkline /> (Visualização Vetorial SVG de Fluxo)', () => {
  it('deve renderizar o elemento SVG quando houver ao menos 2 pontos', () => {
    const { container } = render(<BalanceSparkline points={[100, 150, 200, 180, 250]} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()

    const paths = container.querySelectorAll('path')
    expect(paths.length).toBe(2) // Um para o gradiente de área e um para a linha stroke
  })

  it('não deve renderizar nada se houver menos de 2 pontos', () => {
    const { container } = render(<BalanceSparkline points={[100]} />)
    expect(container.querySelector('svg')).toBeNull()
  })
})
