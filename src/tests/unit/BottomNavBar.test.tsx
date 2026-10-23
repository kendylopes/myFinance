import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import { BottomNavBar } from '../../presentation/components/layout/BottomNavBar'

describe('<BottomNavBar /> (Barra de Navegação Inferior Mobile-First)', () => {
  const defaultProps = {
    activeSection: 'dashboard',
    onSelectSection: vi.fn(),
    onOpenNewTransaction: vi.fn(),
    onOpenSettings: vi.fn(),
  }

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ThemeProvider>
          <BottomNavBar {...defaultProps} {...props} />
        </ThemeProvider>
      </ToastProvider>,
    )
  }

  it('deve renderizar os itens principais (Início, Extrato, Botão Central +, Cartões, Mais)', () => {
    renderComponent()

    expect(screen.getByRole('button', { name: /Início/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Extrato/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nova Transação/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cartões/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Mais opções/i })).toBeInTheDocument()
  })

  it('deve disparar onSelectSection ao clicar em Extrato e Cartões', async () => {
    const onSelectSection = vi.fn()
    const user = userEvent.setup()

    renderComponent({ onSelectSection })

    await user.click(screen.getByRole('button', { name: /Extrato/i }))
    expect(onSelectSection).toHaveBeenCalledWith('transactions')

    await user.click(screen.getByRole('button', { name: /Cartões/i }))
    expect(onSelectSection).toHaveBeenCalledWith('cards')
  })

  it('deve disparar onOpenNewTransaction ao clicar no botão central flutuante (+)', async () => {
    const onOpenNewTransaction = vi.fn()
    const user = userEvent.setup()

    renderComponent({ onOpenNewTransaction })

    const fabBtn = screen.getByRole('button', { name: /Nova Transação/i })
    await user.click(fabBtn)

    expect(onOpenNewTransaction).toHaveBeenCalledTimes(1)
  })

  it('deve abrir o Bottom Sheet ao clicar em Mais e permitir navegar para Dívidas', async () => {
    const onSelectSection = vi.fn()
    const user = userEvent.setup()

    renderComponent({ onSelectSection })

    const moreBtn = screen.getByRole('button', { name: /Mais opções/i })
    await user.click(moreBtn)

    // O modal deve ser exibido com as opções especializadas
    expect(screen.getByText('Mais Funcionalidades')).toBeInTheDocument()
    expect(screen.getByText('Dívidas & Empréstimos')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp IA')).toBeInTheDocument()
    expect(screen.getByText('Relatórios')).toBeInTheDocument()

    // Clica em Dívidas
    await user.click(screen.getByText('Dívidas & Empréstimos'))
    expect(onSelectSection).toHaveBeenCalledWith('debts')

    // O bottom sheet deve ter sido fechado
    expect(screen.queryByText('Mais Funcionalidades')).not.toBeInTheDocument()
  })

  it('deve fechar o Bottom Sheet ao pressionar Escape', async () => {
    const user = userEvent.setup()

    renderComponent()

    await user.click(screen.getByRole('button', { name: /Mais opções/i }))
    expect(screen.getByText('Mais Funcionalidades')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByText('Mais Funcionalidades')).not.toBeInTheDocument()
  })
})
