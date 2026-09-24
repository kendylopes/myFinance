import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CurrencyProvider } from '../../core/currency/currencyContext'
import { ThemeProvider } from '../../core/theme/themeContext'
import {
  OnboardingModal,
  type OnboardingModalProps,
} from '../../presentation/components/onboarding/OnboardingModal'

describe('<OnboardingModal /> (Modal de Boas-Vindas Inteligente)', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  const renderModal = (props: Partial<OnboardingModalProps> = {}) => {
    const defaultProps: OnboardingModalProps = {
      isOpen: true,
      onClose: vi.fn(),
      onInjectDemoData: vi.fn().mockResolvedValue(undefined),
      onCompleteZeroSetup: vi.fn().mockResolvedValue(undefined),
      userName: 'Kennedy',
    }

    return render(
      <ThemeProvider>
        <CurrencyProvider>
          <OnboardingModal {...defaultProps} {...props} />
        </CurrencyProvider>
      </ThemeProvider>,
    )
  }

  it('não deve renderizar nada quando isOpen for false', () => {
    renderModal({ isOpen: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve exibir a saudação e as duas opções quando aberto', () => {
    renderModal({ userName: 'Kennedy' })

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Bem-vindo, Kennedy!/i)).toBeInTheDocument()
    expect(screen.getByText('Começar do Zero')).toBeInTheDocument()
    expect(screen.getByText('Dados de Exemplo')).toBeInTheDocument()
    expect(screen.getByText(/Pular introdução/i)).toBeInTheDocument()
  })

  it('deve disparar onInjectDemoData ao escolher Dados de Exemplo', async () => {
    const onInjectDemoDataMock = vi.fn().mockResolvedValue(undefined)
    const onCloseMock = vi.fn()
    const user = userEvent.setup()

    renderModal({
      onInjectDemoData: onInjectDemoDataMock,
      onClose: onCloseMock,
    })

    const demoBtn = screen.getByRole('button', { name: /Dados de Exemplo/i })
    await user.click(demoBtn)

    expect(onInjectDemoDataMock).toHaveBeenCalledTimes(1)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('deve navegar para a etapa de configuração do zero e submeter com sucesso', async () => {
    const onCompleteZeroSetupMock = vi.fn().mockResolvedValue(undefined)
    const onCloseMock = vi.fn()
    const user = userEvent.setup()

    renderModal({
      onCompleteZeroSetup: onCompleteZeroSetupMock,
      onClose: onCloseMock,
    })

    // Clica em Começar do Zero
    const zeroBtn = screen.getByRole('button', { name: /Começar do Zero/i })
    await user.click(zeroBtn)

    // Preenche saldo inicial
    const balanceInput = screen.getByPlaceholderText(/Ex: 2500,00/i)
    await user.type(balanceInput, '1500')

    // Submete formulário
    const submitBtn = screen.getByRole('button', { name: /Acessar Dashboard/i })
    await user.click(submitBtn)

    expect(onCompleteZeroSetupMock).toHaveBeenCalledWith(1500, 3000)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  it('deve fechar ao clicar no botão fechar ou em pular', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()

    renderModal({ onClose: onCloseMock })

    const skipBtn = screen.getByRole('button', { name: /Pular introdução/i })
    await user.click(skipBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
