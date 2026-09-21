# 💰 myFinance — Estado Vivo do Projeto & Memória Contínua

> **Última atualização:** 19 de Setembro de 2026  
> **Status Geral:** 🟢 Em Desenvolvimento / Arquitetura Sênior / 100% Testado / Biome Ativo  
> **Repositório:** `kendylopes/myFinance` ([github.com/kendylopes/myFinance](https://github.com/kendylopes/myFinance))  
> **Caminho Local:** `c:\Users\Kennedy\Desktop\dev\myFinance`

---

## 📌 1. Visão Geral do Projeto

O **myFinance** é uma aplicação web moderna de gestão financeira pessoal e planejamento de fluxo de caixa, desenvolvida sob os princípios de **Clean Architecture** (separação estrita entre UI, Regras de Domínio e Camada de Acesso a Dados), **alta performance**, **acessibilidade** e **testabilidade automatizada**.

---

## 🛠️ 2. Stack Tecnológica & Ferramental

- **Frontend Core:** React 19 (`react@^19.2.8`, `react-dom@^19.2.8`), TypeScript (`typescript@~6.0.2`), Vite 8 (`vite@^8.3.0`)
- **Estilização:** Tailwind CSS v4 (`tailwindcss@^4.3.3`, `@tailwindcss/vite@^4.3.3`)
- **Ícones:** Lucide React (`lucide-react@^1.47.0`)
- **Qualidade de Código & Linter:** Biome 2.5 (`@biomejs/biome@2.5.14`) — substitui ESLint e Prettier com checagens em ~60ms
- **Suíte de Testes:** Vitest 5 (`vitest@^5.0.1`), React Testing Library (`@testing-library/react@^16.3.3`), Jest DOM (`@testing-library/jest-dom@^7.0.1`), JSDOM (`jsdom@^30.1.0`)
- **Persistência:** `LocalStorageTransactionRepository` implementando contrato `ITransactionRepository` (desacoplamento total para futura integração com Supabase ou REST)

---

## 📁 3. Estrutura de Diretórios & Camadas

```text
myFinance/
├── .vscode/
│   └── settings.json                 # Integração VS Code com Biome e Tailwind v4
├── src/
│   ├── core/                         # Utilitários compartilhados e helpers
│   │   └── formatters/
│   │       ├── currency.ts           # Formatação em moeda BRL (R$ 0,00)
│   │       └── date.ts               # Formatação de datas pt-BR (DD/MM/AAAA)
│   ├── domain/                       # 🧠 REGRAS DE NEGÓCIO PURAS (Zero React)
│   │   ├── models/
│   │   │   └── transaction.ts        # Interfaces, DTOs e entidades
│   │   ├── services/
│   │   │   └── financeCalculations.ts# Cálculos puros de totais, balanço e validações
│   │   └── repositories/
│   │       └── ITransactionRepository.ts # Contrato do repositório
│   ├── data/                         # 💾 ACESSO A DADOS & STORAGE
│   │   └── repositories/
│   │       └── LocalStorageTransactionRepository.ts # Implementação concreta LocalStorage
│   ├── presentation/                 # 🎨 CAMADA VISUAL (React 19)
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Header.tsx        # Cabeçalho com contador dinâmico
│   │   │   └── dashboard/
│   │   │       ├── SummaryCards.tsx  # Cards de métricas (Entradas, Saídas, Saldo)
│   │   │       ├── TransactionForm.tsx # Formulário de novo lançamento com a11y
│   │   │       ├── TransactionItem.tsx # Item individual com exclusão
│   │   │       └── TransactionList.tsx # Listagem com Empty State
│   │   └── hooks/
│   │       └── useFinance.ts         # Hook orquestrador com useMemo e useCallback
│   ├── tests/                        # 🧪 SUÍTE DE TESTES (Vitest + RTL)
│   │   ├── setup.ts                  # Setup com jest-dom matchers
│   │   ├── unit/
│   │   │   ├── financeCalculations.test.ts # 9 testes de regras de domínio
│   │   │   └── LocalStorageTransactionRepository.test.ts # 4 testes de persistência
│   │   └── integration/
│   │       ├── SummaryCards.test.tsx # 2 testes de renderização de métricas
│   │       └── TransactionForm.test.tsx # 2 testes de interação e validação
│   ├── App.tsx                       # Componente raiz declarativo (45 linhas)
│   ├── main.tsx                      # Ponto de entrada com verificação segura do DOM
│   └── index.css                     # Configuração global do Tailwind v4 (@import "tailwindcss")
├── biome.json                        # Configuração do Biome 2.5 (regras, formatação, vcs)
├── vite.config.ts                    # Configuração do Vite, Tailwind e Vitest
├── tsconfig.json                     # Configurações do compilador TypeScript
└── README.md                         # Documentação principal e guia de uso
```

---

## 🛡️ 4. Padrões de Qualidade & Métricas Atingidas

- **Suíte de Testes Automatizados:** 🟢 **66/66 testes passando** (Vitest em 13 suítes):
  - Cálculos de receitas, despesas, saldo líquido e agrupamento por categoria.
  - Cálculo de meta orçamentária (`calculateBudgetProgress`) com status safe, warning e exceeded.
  - Filtragem combinada por busca textual, categoria e tipo de transação (`filterTransactions`).
  - Geração de extrato CSV com cabeçalho, UTF-8 BOM, separador brasileiro e escape de caracteres (`generateCsvContent`).
  - Geração de documento de impressão/PDF estruturado com cabeçalho, cards e tabela zebrada (`generatePrintableHtml`).
  - Cálculo percentual relativo por categoria com ordenação da maior para a menor despesa.
  - Filtragem temporal por mês (`filterTransactionsByMonth`) e modo global.
  - Validações estritas de inputs (valores positivos, descrições obrigatórias).
  - Integridade de gravação e exclusão nos repositórios de transações e orçamento.
  - Renderização correta e acessibilidade de cards, seletor de mês, barra de meta, formulário, filtros, ações de exportação e gráfico Donut SVG.
  - **[NOVO] Números Vivos & Interpolação:** Validação unitária de `AnimatedCurrency` com formatação BRL, acessibilidade e valores negativos.
  - **[NOVO] Curva Vetorial de Tendência:** Validação unitária do componente vetorial `BalanceSparkline` com paths Bézier SVG puros.
- **Qualidade de Código (Biome):** 🟢 **0 erros, 0 avisos** (`npm run lint` em 48 arquivos).
- **Tipagem Estrita (TypeScript):** 🟢 **0 erros de compilação** (`npm run build` gerando bundle otimizado de produção em ~9s).
- **Acessibilidade:** Padrão WAI-ARIA estrito, foco visível, contraste calibrado e compatibilidade total com leitores de tela e preferência de movimento reduzido (`prefers-reduced-motion`).

---

## 📋 5. Roadmap de Próximas Funcionalidades (Backlog Priorizado)

- [x] **📅 Filtro por Período & Mês:**
  - Seletor de mês/ano com navegação anterior/próximo, atalho para mês atual, modo "Todos os Períodos" e recálculo reativo de saldo e listagem.
- [x] **📊 Gráficos de Distribuição de Despesas:**
  - Gráfico Donut SVG interativo com fatias proporcionais, legenda colorida, total centralizado e barras de progresso lineares por categoria.
- [x] **🎯 Barra de Meta / Orçamento Mensal:**
  - Definição de teto de gastos mensal com indicador de progresso, persistência via `LocalStorageBudgetRepository`, feedback de 3 níveis (seguro, alerta 75%+, ultrapassado 100%+) e edição inline.
- [x] **🏷️ Filtros por Categoria & Busca:**
  - Barra de pesquisa textual em tempo real, chips interativos com as categorias disponíveis, seletor por tipo (Todos, Entradas, Saídas) e contador de movimentações exibidas.
- [x] **📤 Exportação de Extrato (CSV / PDF):**
  - Download do relatório de movimentações financeiras em arquivo CSV estruturado compatível com Excel/Sheets e emissão de extrato diagramado pronto para impressão ou salvamento em PDF nativo via navegador (0 KB de dependências extras).
- [x] **🏆 Elevação de UI ao Padrão Awwwards (Motion & Micro-interactions):**
  - Spotlight interativo de cursor nos cards (`useSpotlight` passivo a 120 FPS).
  - Animated Counter Tickers com interpolação numérica suave e desaceleração cúbica (`AnimatedCurrency`).
  - Laser Shimmer translúcido deslizante em botões de ação e barra de meta orçamentária (`animate-shimmer-sweep`).
  - Mini Sparkline SVG com curva Bézier suave de tendência financeira dentro do card de saldo (`BalanceSparkline`).
  - Sound Design tátil nativo via Web Audio API com sintetizador analógico de vidro/cerâmica e botão de mute no Header (`soundFX`).
- [ ] **☁️ Repositório em Nuvem (Supabase / Backend):**
  - Implementação de `SupabaseTransactionRepository` e `SupabaseBudgetRepository` para sincronização remota, persistência em nuvem e suporte multi-usuário (preparação para bot e celular).

---

## 📍 6. Onde Paramos (Checkpoint Atual)

- **Última Ação:** Concluída com êxito a **Elevação da UI para o Padrão Awwwards (Site of the Day Quality)**:
  - Implementado **Spotlight Interativo** sobre as superfícies de vidro usando listener passivo via `ref` para alta performance a 120 FPS sem re-renders.
  - Implementado **Animated Currency Ticker** para contagem fluida e viva de valores financeiros com easing cúbico suave.
  - Implementado **Laser Shimmer** especular sobre o botão de submissão e sobre a barra de orçamento.
  - Implementado **BalanceSparkline** SVG com interpolação Bézier contínua no card de saldo.
  - Implementado **Sound Design Háptico** (Web Audio API nativa com zero dependências externas) e alternância no Header.
  - Suíte de testes expandida para **66/66 aprovados** em 13 arquivos, Biome 100% limpo em 48 arquivos e build de produção validado.
- **Próximo Passo Recomendado:** Implementar a **Funcionalidade 6: ☁️ Conexão com Banco de Dados em Nuvem (Supabase)** para permitir envio direto de movimentações via celular.
