import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { Header } from '../../presentation/components/layout/Header'

describe('<Header /> (Componente de Cabeçalho)', () => {
  it('deve renderizar o título da seção ativa', () => {
    render(
      <ThemeProvider>
        <Header activeSection="dashboard" />
      </ThemeProvider>,
    )
    expect(screen.getByText(/Dashboard/i)).toBeInTheDocument()
  })

  it('deve renderizar o título RELATÓRIOS quando activeSection for reports', () => {
    render(
      <ThemeProvider>
        <Header activeSection="reports" />
      </ThemeProvider>,
    )
    expect(screen.getByText(/Relatórios/i)).toBeInTheDocument()
    expect(screen.getByText(/Análise detalhada por semana, mês, ano/i)).toBeInTheDocument()
  })

  it('deve renderizar o botão único de Nova Transação e chamar onOpenNewTransaction ao clicar', () => {
    const onOpenNewTransaction = vi.fn()

    render(
      <ThemeProvider>
        <Header activeSection="dashboard" onOpenNewTransaction={onOpenNewTransaction} />
      </ThemeProvider>,
    )

    const newTxBtn = screen.getByRole('button', { name: /Nova Transação/i })
    expect(newTxBtn).toBeInTheDocument()

    fireEvent.click(newTxBtn)
    expect(onOpenNewTransaction).toHaveBeenCalledTimes(1)
  })

  it('deve renderizar o título e subtítulo corretos quando activeSection for cards', () => {
    render(
      <ThemeProvider>
        <Header activeSection="cards" />
      </ThemeProvider>,
    )
    expect(screen.getByText('Cartões & Faturas')).toBeInTheDocument()
    expect(
      screen.getByText('Acompanhamento de compras parceladas, limites e faturas futuras'),
    ).toBeInTheDocument()
  })

  it('deve renderizar o título e subtítulo corretos quando activeSection for debts', () => {
    render(
      <ThemeProvider>
        <Header activeSection="debts" />
      </ThemeProvider>,
    )
    expect(screen.getByText('Dívidas & Empréstimos')).toBeInTheDocument()
    expect(
      screen.getByText('Gestão estratégica de agiotas, empréstimos pessoais e rolagem de juros'),
    ).toBeInTheDocument()
  })
})
