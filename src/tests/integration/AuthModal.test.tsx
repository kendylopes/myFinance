import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthModal } from '../../presentation/components/auth/AuthModal'

describe('<AuthModal /> (Modal de Autenticação)', () => {
  it('não deve renderizar nada quando isOpen for false', () => {
    const { container } = render(
      <AuthModal isOpen={false} onClose={vi.fn()} onLogin={vi.fn()} onRegister={vi.fn()} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('deve renderizar a aba de login inicialmente quando aberto', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onLogin={vi.fn()} onRegister={vi.fn()} />)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Acessar myFinance')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar no myFinance' })).toBeInTheDocument()
  })

  it('deve alternar para a aba de Criar Conta e exibir campos adicionais', () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onLogin={vi.fn()} onRegister={vi.fn()} />)

    const tabCriarConta = screen.getByRole('button', { name: 'Criar Conta' })
    fireEvent.click(tabCriarConta)

    expect(screen.getByText('Criar Conta na Nuvem')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar Minha Conta' })).toBeInTheDocument()
  })

  it('deve exibir mensagem de erro se a senha tiver menos de 6 caracteres', async () => {
    render(<AuthModal isOpen={true} onClose={vi.fn()} onLogin={vi.fn()} onRegister={vi.fn()} />)

    const emailInput = screen.getByLabelText(/E-mail/i)
    const passwordInput = screen.getByLabelText(/^Senha/i)
    const submitBtn = screen.getByRole('button', { name: 'Entrar no myFinance' })

    fireEvent.change(emailInput, { target: { value: 'teste@exemplo.com' } })
    fireEvent.change(passwordInput, { target: { value: '123' } })
    fireEvent.click(submitBtn)

    expect(await screen.findByRole('alert')).toHaveTextContent('mínimo 6 caracteres')
  })

  it('deve acionar onLogin ao submeter credenciais válidas', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true })
    const mockClose = vi.fn()

    render(<AuthModal isOpen={true} onClose={mockClose} onLogin={mockLogin} onRegister={vi.fn()} />)

    const emailInput = screen.getByLabelText(/E-mail/i)
    const passwordInput = screen.getByLabelText(/^Senha/i)
    const submitBtn = screen.getByRole('button', { name: 'Entrar no myFinance' })

    fireEvent.change(emailInput, { target: { value: 'usuario@teste.com' } })
    fireEvent.change(passwordInput, { target: { value: '123456' } })
    fireEvent.click(submitBtn)

    expect(mockLogin).toHaveBeenCalledWith('usuario@teste.com', '123456')
  })
})
