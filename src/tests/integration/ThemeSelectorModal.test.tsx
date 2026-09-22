import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ThemeProvider } from '../../core/theme/themeContext'
import { ThemeSelectorModal } from '../../presentation/components/theme/ThemeSelectorModal'

describe('<ThemeSelectorModal /> (Modal de 5 Temas Dev)', () => {
  it('não deve renderizar nada quando isOpen for false', () => {
    render(
      <ThemeProvider>
        <ThemeSelectorModal isOpen={false} onClose={vi.fn()} />
      </ThemeProvider>,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('deve renderizar os 5 temas de desenvolvedor quando aberto', () => {
    render(
      <ThemeProvider>
        <ThemeSelectorModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>,
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Temas de Desenvolvedor')).toBeInTheDocument()
    expect(screen.getByText('Emerald Matrix')).toBeInTheDocument()
    expect(screen.getByText('Dracula Official')).toBeInTheDocument()
    expect(screen.getByText('Tokyo Night')).toBeInTheDocument()
    expect(screen.getByText('Catppuccin Mocha')).toBeInTheDocument()
    expect(screen.getByText('One Dark Pro')).toBeInTheDocument()
  })

  it('deve alternar o tema ativo ao clicar no card do tema Dracula', async () => {
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeSelectorModal isOpen={true} onClose={vi.fn()} />
      </ThemeProvider>,
    )

    const draculaBtn = screen.getByRole('button', { name: /Dracula Official/i })
    await user.click(draculaBtn)

    expect(document.documentElement.getAttribute('data-theme')).toBe('dracula')
  })

  it('deve fechar ao clicar no botão fechar ou concluir', async () => {
    const onCloseMock = vi.fn()
    const user = userEvent.setup()

    render(
      <ThemeProvider>
        <ThemeSelectorModal isOpen={true} onClose={onCloseMock} />
      </ThemeProvider>,
    )

    const closeBtn = screen.getByRole('button', { name: /Fechar modal de temas/i })
    await user.click(closeBtn)

    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
