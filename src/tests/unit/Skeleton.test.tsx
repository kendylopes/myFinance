import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Skeleton } from '../../presentation/components/common/Skeleton'

describe('<Skeleton /> (Componente de Carregamento Shimmer)', () => {
  it('deve renderizar com a role status e acessibilidade', () => {
    render(<Skeleton data-testid="test-skeleton" />)
    const el = screen.getByTestId('test-skeleton')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('role', 'status')
    expect(el).toHaveAttribute('aria-label', 'Carregando conteúdo')
  })

  it('deve aplicar as classes da variante circular e dimensões customizadas', () => {
    render(<Skeleton data-testid="circle-skeleton" variant="circular" width={48} height={48} />)
    const el = screen.getByTestId('circle-skeleton')
    expect(el).toHaveClass('rounded-full')
    expect(el).toHaveStyle({ width: '48px', height: '48px' })
  })

  it('deve aplicar a variante de texto com classe apropriada', () => {
    render(<Skeleton data-testid="text-skeleton" variant="text" />)
    const el = screen.getByTestId('text-skeleton')
    expect(el).toHaveClass('h-4')
  })
})
