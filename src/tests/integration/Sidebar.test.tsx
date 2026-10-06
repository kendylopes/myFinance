import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ToastProvider } from '../../core/toast/toastContext'
import { Sidebar } from '../../presentation/components/layout/Sidebar'

describe('<Sidebar /> (Menu Lateral de Navegação)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'dev@myfinance.app',
    name: 'Dev Kennedy',
  }

  const defaultProps = {
    user: mockUser,
    onLogout: vi.fn(),
    activeSection: 'dashboard',
    onSelectSection: vi.fn(),
    onOpenSettingsModal: vi.fn(),
    isMobileOpen: false,
    onCloseMobile: vi.fn(),
  }

  const renderSidebar = (props = {}) => {
    return render(
      <ToastProvider>
        <ThemeProvider>
          <Sidebar {...defaultProps} {...props} />
        </ThemeProvider>
      </ToastProvider>,
    )
  }

  it('deve renderizar a marca, itens de navegação, botão de instalar app e configurações', () => {
    renderSidebar()

    expect(screen.getByText(/my/i)).toBeInTheDocument()
    expect(screen.getByText(/Finance/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Transações/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Planejamento/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Categorias/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Instalar App/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Configurações/i })).toBeInTheDocument()
  }, 25000)

  it('deve exibir o botão de logout e disparar onLogout ao clicar', async () => {
    const onLogoutMock = vi.fn()
    const user = userEvent.setup()

    renderSidebar({ onLogout: onLogoutMock })

    const logoutBtn = screen.getByRole('button', { name: /Sair da conta/i })
    expect(logoutBtn).toBeInTheDocument()
    await user.click(logoutBtn)

    expect(onLogoutMock).toHaveBeenCalledTimes(1)
  })

  it('deve disparar onSelectSection e fechar mobile ao clicar em um item de navegação', async () => {
    const onSelectSectionMock = vi.fn()
    const onCloseMobileMock = vi.fn()
    const user = userEvent.setup()

    renderSidebar({
      onSelectSection: onSelectSectionMock,
      onCloseMobile: onCloseMobileMock,
    })

    const transactionsBtn = screen.getByRole('button', { name: /Transações/i })
    await user.click(transactionsBtn)

    expect(onSelectSectionMock).toHaveBeenCalledWith('transactions')
    expect(onCloseMobileMock).toHaveBeenCalledTimes(1)
  })

  it('deve acionar onOpenSettingsModal ao clicar no botão de Configurações', async () => {
    const onOpenSettingsModalMock = vi.fn()
    const user = userEvent.setup()

    renderSidebar({ onOpenSettingsModal: onOpenSettingsModalMock })

    const configBtn = screen.getByRole('button', { name: /Configurações/i })
    await user.click(configBtn)

    expect(onOpenSettingsModalMock).toHaveBeenCalledTimes(1)
  })

  it('deve permitir clicar no botão de Instalar App e fechar menu mobile', async () => {
    const onCloseMobileMock = vi.fn()
    const user = userEvent.setup()

    renderSidebar({ onCloseMobile: onCloseMobileMock })

    const installBtn = screen.getByRole('button', { name: /Instalar App/i })
    expect(installBtn).toBeInTheDocument()
    await user.click(installBtn)

    expect(onCloseMobileMock).toHaveBeenCalledTimes(1)
  })
})
