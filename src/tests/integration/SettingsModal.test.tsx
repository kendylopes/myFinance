import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ThemeProvider } from '../../core/theme/themeContext'
import { SettingsModal } from '../../presentation/components/settings/SettingsModal'

describe('<SettingsModal /> (Configurações: Moeda Local, Tema Dark e Branco Normal)', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  const renderModal = (props: {
    isOpen: boolean
    onClose: () => void
    initialTab?: 'general' | 'themes'
  }) => {
    return render(
      <ThemeProvider>
        <CurrencyProvider>
          <SettingsModal {...props} />
        </CurrencyProvider>
      </ThemeProvider>,
    )
  }

  it('não deve renderizar nada quando isOpen for false', () => {
    renderModal({ isOpen: false, onClose: vi.fn() })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve exibir o título de configurações, seletor de modo e moedas quando aberto', () => {
    renderModal({ isOpen: true, onClose: vi.fn() })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Configurações do Sistema')).toBeInTheDocument()
    expect(screen.getAllByText('Tema Dark').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Tema Branco Normal').length).toBeGreaterThan(0)
    expect(screen.getByText('Escolha da Moeda Local')).toBeInTheDocument()
    expect(screen.getByText('BRL')).toBeInTheDocument()
    expect(screen.getByText('USD')).toBeInTheDocument()
    expect(screen.getByText('EUR')).toBeInTheDocument()
  })

  it('deve alternar para o Tema Branco Normal ao clicar no card correspondente', async () => {
    const user = userEvent.setup()
    renderModal({ isOpen: true, onClose: vi.fn() })

    const lightBtn = screen.getByRole('button', { name: /Tema Branco Normal/i })
    await user.click(lightBtn)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('deve alternar para o Tema Dark ao clicar no card de Tema Dark', async () => {
    const user = userEvent.setup()
    renderModal({ isOpen: true, onClose: vi.fn() })

    // Primeiro vai para light
    const lightBtn = screen.getByRole('button', { name: /Tema Branco Normal/i })
    await user.click(lightBtn)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')

    // Depois volta para dark
    const darkBtn = screen.getByRole('button', { name: /Tema Dark/i })
    await user.click(darkBtn)
    expect(document.documentElement.getAttribute('data-theme')).not.toBe('light')
  })

  it('deve alternar para a moeda USD ao clicar no botão de USD', async () => {
    const user = userEvent.setup()
    renderModal({ isOpen: true, onClose: vi.fn() })

    const usdBtn = screen.getByRole('button', { name: /USD/i })
    await user.click(usdBtn)

    expect(localStorage.getItem('myfinance_currency')).toBe('USD')
  })

  it('deve fechar ao clicar no botão Concluir', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()
    renderModal({ isOpen: true, onClose: onCloseMock })

    const doneBtn = screen.getByRole('button', { name: /Concluir/i })
    await user.click(doneBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
