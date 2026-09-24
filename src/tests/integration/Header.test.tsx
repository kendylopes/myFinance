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
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument()
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
})
