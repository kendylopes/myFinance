import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthPage } from '../../presentation/components/auth/AuthPage'

describe('<AuthPage /> (Tela de Autenticação / Auth Gate)', () => {
  it('deve renderizar a tela de autenticação com a aba de login ativa inicialmente', () => {
    render(<AuthPage onLogin={vi.fn()} onRegister={vi.fn()} />)

    expect(screen.getByText('myFinance')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acessar Conta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar no myFinance' })).toBeInTheDocument()
  }, 25000)

  it('deve alternar para a aba de criar conta e exibir os campos de nome e confirmação', () => {
    render(<AuthPage onLogin={vi.fn()} onRegister={vi.fn()} />)

    const tabCriar = screen.getByRole('button', { name: 'Criar Nova Conta' })
    fireEvent.click(tabCriar)

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar Minha Conta' })).toBeInTheDocument()
  }, 25000)

  it('deve validar e disparar onLogin com credenciais corretas', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true })
    render(<AuthPage onLogin={mockLogin} onRegister={vi.fn()} />)

    const emailInput = screen.getByLabelText(/E-mail/i)
    const passwordInput = screen.getByLabelText(/^Senha/i)
    const submitBtn = screen.getByRole('button', { name: 'Entrar no myFinance' })

    fireEvent.change(emailInput, { target: { value: 'usuario@nuvem.com' } })
    fireEvent.change(passwordInput, { target: { value: 'senha123' } })
    fireEvent.click(submitBtn)

    expect(mockLogin).toHaveBeenCalledWith('usuario@nuvem.com', 'senha123')
  }, 25000)

  it('deve exibir mensagem clara e botão de criar conta quando login falhar para usuário explicitamente não cadastrado', async () => {
    const mockLogin = vi.fn().mockResolvedValue({
      success: false,
      error: 'Este e-mail ainda não está cadastrado no myFinance.',
    })
    render(<AuthPage onLogin={mockLogin} onRegister={vi.fn()} />)

    const emailInput = screen.getByLabelText(/E-mail/i)
    const passwordInput = screen.getByLabelText(/^Senha/i)
    const submitBtn = screen.getByRole('button', { name: 'Entrar no myFinance' })

    fireEvent.change(emailInput, { target: { value: 'novato@exemplo.com' } })
    fireEvent.change(passwordInput, { target: { value: 'senha123' } })
    fireEvent.click(submitBtn)

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Conta não localizada/i)).toBeInTheDocument()
    expect(screen.getByText(/Nenhuma conta foi encontrada com este e-mail/i)).toBeInTheDocument()

    // Botão de ação rápida para criar conta direto do erro
    const quickRegisterBtn = screen.getByRole('button', {
      name: /Criar conta com este e-mail/i,
    })
    expect(quickRegisterBtn).toBeInTheDocument()

    // Ao clicar, deve alternar para a aba de criar conta preservando o e-mail
    fireEvent.click(quickRegisterBtn)
    expect(screen.getByRole('button', { name: 'Criar Minha Conta' })).toBeInTheDocument()
    expect(screen.getByLabelText(/E-mail/i)).toHaveValue('novato@exemplo.com')
  }, 25000)

  it('deve exibir aviso contextual de senha muito curta, desabilitar formulário e reabilitar ao sair do aviso', async () => {
    const mockLogin = vi.fn()
    render(<AuthPage onLogin={mockLogin} onRegister={vi.fn()} />)

    const emailInput = screen.getByLabelText(/E-mail/i)
    const passwordInput = screen.getByLabelText(/^Senha/i)
    const submitBtn = screen.getByRole('button', { name: 'Entrar no myFinance' })

    fireEvent.change(emailInput, { target: { value: 'kendylopes@gmail.com' } })
    fireEvent.change(passwordInput, { target: { value: '12345' } }) // 5 caracteres!
    fireEvent.click(submitBtn)

    const alertBox = await screen.findByRole('alert')
    expect(alertBox).toBeInTheDocument()
    expect(screen.getByText('Senha muito curta')).toBeInTheDocument()
    expect(screen.getByText(/A senha precisa ter no mínimo 6 dígitos/i)).toBeInTheDocument()

    // Os inputs abaixo devem estar desabilitados enquanto o aviso estiver aberto
    expect(emailInput).toBeDisabled()
    expect(passwordInput).toBeDisabled()
    expect(submitBtn).toBeDisabled()

    // O alert não deve conter a tag de "Novo por aqui?" nem o botão de criar conta
    expect(within(alertBox).queryByText('Novo por aqui?')).not.toBeInTheDocument()
    expect(
      within(alertBox).queryByRole('button', { name: /Criar conta com este e-mail/i }),
    ).not.toBeInTheDocument()

    // Clicar em "Sair do aviso" deve fechar o alerta e reabilitar os inputs
    const exitBtn = within(alertBox).getByRole('button', { name: /Sair do aviso/i })
    fireEvent.click(exitBtn)

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(emailInput).not.toBeDisabled()
    expect(passwordInput).not.toBeDisabled()
    expect(submitBtn).not.toBeDisabled()
    expect(mockLogin).not.toHaveBeenCalled()
  }, 25000)
})
