import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToastProvider, useToast } from '../../core/toast/toastContext'
import { ToastContainer } from '../../presentation/components/common/ToastContainer'

function TestComponent() {
  const toast = useToast()

  return (
    <div>
      <button
        type="button"
        onClick={() => toast.success('Sucesso!', 'Operação realizada com êxito.')}
      >
        Disparar Sucesso
      </button>
      <button type="button" onClick={() => toast.error('Erro!', 'Algo deu errado na requisição.')}>
        Disparar Erro
      </button>
      <button type="button" onClick={() => toast.warning('Atenção!', 'Limite quase atingido.')}>
        Disparar Aviso
      </button>
      <button
        type="button"
        onClick={() => toast.info('Informação', 'Nova funcionalidade disponível.')}
      >
        Disparar Info
      </button>
      <ToastContainer />
    </div>
  )
}

describe('Toast System (<ToastProvider /> & useToast)', () => {
  it('deve disparar e exibir uma notificação de sucesso na tela', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    const button = screen.getByRole('button', { name: 'Disparar Sucesso' })
    await user.click(button)

    expect(screen.getByText('Sucesso!')).toBeInTheDocument()
    expect(screen.getByText('Operação realizada com êxito.')).toBeInTheDocument()
  })

  it('deve permitir fechar a notificação manualmente ao clicar no botão X', async () => {
    const user = userEvent.setup()

    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>,
    )

    const button = screen.getByRole('button', { name: 'Disparar Erro' })
    await user.click(button)

    expect(screen.getByText('Erro!')).toBeInTheDocument()

    const closeBtn = screen.getByRole('button', { name: 'Fechar notificação' })
    await user.click(closeBtn)

    // Aguarda a animação de saída de 200ms
    await act(async () => {
      await new Promise((r) => setTimeout(r, 250))
    })

    expect(screen.queryByText('Erro!')).not.toBeInTheDocument()
  })

  it('deve disparar toast com ação clicável', async () => {
    const user = userEvent.setup()
    const handleAction = vi.fn()

    function ActionComponent() {
      const toast = useToast()
      return (
        <div>
          <button
            type="button"
            onClick={() =>
              toast.info('Item removido', undefined, {
                action: { label: 'Desfazer', onClick: handleAction },
              })
            }
          >
            Disparar com Ação
          </button>
          <ToastContainer />
        </div>
      )
    }

    render(
      <ToastProvider>
        <ActionComponent />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Disparar com Ação' }))

    const actionBtn = screen.getByRole('button', { name: 'Desfazer' })
    expect(actionBtn).toBeInTheDocument()

    await user.click(actionBtn)
    expect(handleAction).toHaveBeenCalledTimes(1)
  })
})
