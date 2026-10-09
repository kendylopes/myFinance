# Instruções e Regras do Projeto (myFinance)

## Diretrizes de Estilo e Classes Tailwind CSS (Classes Canônicas)

Para evitar avisos do linter do Tailwind CSS (`suggestCanonicalClasses`), sempre adote as classes canônicas nativas da escala do Tailwind v4 em vez de notações arbitrárias entre colchetes:

### 1. Opacidades Canônicas de Cores
Evite colchetes com frações decimais arbitrárias como `bg-white/[0.04]`. Use a sintaxe percentual direta do Tailwind:
- Use `bg-white/3` em vez de `bg-white/[0.03]`
- Use `bg-white/4` em vez de `bg-white/[0.04]`
- Use `bg-white/5` em vez de `bg-white/[0.05]`
- Use `focus:bg-white/6` ou `bg-white/6` em vez de `bg-white/[0.06]`
- Use `border-white/8` ou `bg-white/8` em vez de `border-white/[0.08]`
- Use `border-white/10` em vez de `border-white/[0.1]`
- Use `border-white/15` em vez de `border-white/[0.15]`

### 2. Dimensões e Espaçamentos (Width, Height, Max/Min)
Sempre prefira os utilitários da escala numérica nativa (múltiplos de 4px ou fração de 2px) em vez de pixels arbitrários:
- Use `min-w-170` em vez de `min-w-[680px]` (170 × 4px = 680px)
- Use `max-w-10.5` em vez de `max-w-[42px]` (10.5 × 4px = 42px)
- Use `max-w-36` em vez de `max-w-[144px]`

### 3. Padrão de Idioma
- Sempre responder em Português do Brasil.
