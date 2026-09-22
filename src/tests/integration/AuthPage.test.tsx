import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AuthPage } from '../../presentation/components/auth/AuthPage'

describe('<AuthPage /> (Tela de Autenticação / Auth Gate)', () => {
  it('deve renderizar a tela de autenticação com a aba de login ativa inicialmente', () => {
    render(<AuthPage onLogin={vi.fn()} onRegister={vi.fn()} />)

    expect(screen.getByText('myFinance')).toBeInTheDocument()
    expect(screen.getByText('CLOUD')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Acessar Conta' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar no myFinance' })).toBeInTheDocument()
  })

  it('deve alternar para a aba de criar conta e exibir os campos de nome e confirmação', () => {
    render(<AuthPage onLogin={vi.fn()} onRegister={vi.fn()} />)

    const tabCriar = screen.getByRole('button', { name: 'Criar Nova Conta' })
    fireEvent.click(tabCriar)

    expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Criar Minha Conta' })).toBeInTheDocument()
  })

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
  })
})
