import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DashboardSkeleton } from '../../presentation/components/dashboard/DashboardSkeleton'

describe('<DashboardSkeleton /> (Skeleton de Carregamento do Dashboard)', () => {
  it('deve renderizar a estrutura completa com indicador de aria-busy', () => {
    render(<DashboardSkeleton />)
    const el = screen.getByTestId('dashboard-skeleton')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-busy', 'true')
  })

  it('deve conter múltiplos elementos de carregamento com shimmer', () => {
    render(<DashboardSkeleton />)
    const statusItems = screen.getAllByRole('status')
    expect(statusItems.length).toBeGreaterThan(10)
  })
})
