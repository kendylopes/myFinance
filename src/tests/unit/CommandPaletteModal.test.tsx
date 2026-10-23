import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import type { Transaction } from '../../domain/models/transaction'
import { CommandPaletteModal } from '../../presentation/components/common/CommandPaletteModal'

describe('<CommandPaletteModal /> (Paleta de Comandos Global Ctrl+K)', () => {
  const mockTransactions: Transaction[] = [
    {
      id: 'tx-101',
      title: 'Academia Mensalidade',
      amount: 150,
      type: 'expense',
      category: 'Saúde',
      date: '2026-10-15',
      status: 'paid',
    },
  ]

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSelectSection: vi.fn(),
    onOpenNewTransaction: vi.fn(),
    onOpenImport: vi.fn(),
    onOpenSettings: vi.fn(),
    onOpenThemes: vi.fn(),
    transactions: mockTransactions,
    onSelectTransaction: vi.fn(),
  }

  const renderComponent = (props = {}) => {
    return render(
      <ToastProvider>
        <ThemeProvider>
          <CommandPaletteModal {...defaultProps} {...props} />
        </ThemeProvider>
      </ToastProvider>,
    )
  }

  it('não deve renderizar nada quando isOpen for false', () => {
    renderComponent({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve renderizar a caixa de busca e comandos principais quando aberta', () => {
    renderComponent()

    expect(screen.getByRole('dialog', { name: /Paleta de Comandos/i })).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/O que você deseja fazer ou buscar/i)).toBeInTheDocument()
    expect(screen.getByText('Nova Transação')).toBeInTheDocument()
    expect(screen.getByText('Ir para Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Ir para Cartões & Faturas')).toBeInTheDocument()
  })

  it('deve filtrar itens conforme a digitação do usuário', async () => {
    const user = userEvent.setup()
    renderComponent()

    const input = screen.getByPlaceholderText(/O que você deseja fazer ou buscar/i)
    await user.type(input, 'Cartões')

    expect(screen.getByText('Ir para Cartões & Faturas')).toBeInTheDocument()
    expect(screen.queryByText('Ir para Dashboard')).not.toBeInTheDocument()
  })

  it('deve encontrar e exibir transações que coincidem com a busca', async () => {
    const user = userEvent.setup()
    renderComponent()

    const input = screen.getByPlaceholderText(/O que você deseja fazer ou buscar/i)
    await user.type(input, 'Academia')

    expect(screen.getByText('Academia Mensalidade')).toBeInTheDocument()
    expect(screen.getByText(/Saúde/)).toBeInTheDocument()
  })

  it('deve disparar ação ao clicar em um item de comando', async () => {
    const onOpenNewTransaction = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()

    renderComponent({ onOpenNewTransaction, onClose })

    const newTxBtn = screen.getByText('Nova Transação')
    await user.click(newTxBtn)

    expect(onOpenNewTransaction).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deve fechar a paleta ao pressionar Escape', () => {
    const onClose = vi.fn()
    renderComponent({ onClose })

    const input = screen.getByPlaceholderText(/O que você deseja fazer ou buscar/i)
    fireEvent.keyDown(input, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
