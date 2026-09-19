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

- **Suíte de Testes Automatizados:** 🟢 **28/28 testes passando** (Vitest):
  - Cálculos de receitas, despesas, saldo líquido e agrupamento por categoria.
  - Cálculo percentual relativo por categoria com ordenação da maior para a menor despesa.
  - Filtragem temporal por mês (`filterTransactionsByMonth`) e modo global.
  - Comportamento de saldos negativos, listas vazias e períodos sem despesas.
  - Validações estritas de inputs (valores positivos, descrições obrigatórias).
  - Integridade de gravação e exclusão no repositório.
  - Renderização correta e acessibilidade dos cards, seletor de mês, formulário e gráfico Donut SVG.
- **Qualidade de Código (Biome):** 🟢 **0 erros, 0 avisos** (`npm run lint` executa em ~100ms).
- **Tipagem Estrita (TypeScript):** 🟢 **0 erros de compilação** (`npm run build` gerando bundle otimizado de produção em ~4.7s).
- **Acessibilidade:** Formulários, seletores e gráficos 100% associados com `htmlFor`, `id`, `aria-label` e `role="img"`, suporte a leitores de tela e contrastes adequados.

---

## 📋 5. Roadmap de Próximas Funcionalidades (Backlog Priorizado)

- [x] **📅 Filtro por Período & Mês:**
  - Seletor de mês/ano com navegação anterior/próximo, atalho para mês atual, modo "Todos os Períodos" e recálculo reativo de saldo e listagem.
- [x] **📊 Gráficos de Distribuição de Despesas:**
  - Gráfico Donut SVG interativo com fatias proporcionais, legenda colorida, total centralizado e barras de progresso lineares por categoria.
- [ ] **🎯 Barra de Meta / Orçamento Mensal:**
  - Definição de teto de gastos mensal com indicador de progresso e alertas de proximidade do limite.
- [ ] **🏷️ Filtros por Categoria & Busca:**
  - Barra de pesquisa textual e chips de filtro por categoria (Alimentação, Moradia, etc.).
- [ ] **📤 Exportação de Extrato (CSV / PDF):**
  - Download do relatório de movimentações financeiras em arquivo CSV estruturado ou PDF diagramado.
- [ ] **☁️ Repositório em Nuvem (Supabase / Backend):**
  - Implementação de `SupabaseTransactionRepository` para sincronização em nuvem e autenticação de usuários.

---

## 📍 6. Onde Paramos (Checkpoint Atual)

- **Última Ação:** Implementada com sucesso a **Funcionalidade 2: Gráficos de Distribuição de Despesas por Categoria**:
  - Criado componente [ExpenseCategoryChart.tsx](file:///c:/Users/Kennedy/Desktop/dev/myFinance/src/presentation/components/dashboard/ExpenseCategoryChart.tsx) com gráfico Donut em SVG nativo, total centralizado, badges de porcentagem e barras de progresso individuais.
  - Criada regra de domínio pura `calculateExpensesByCategory` em [financeCalculations.ts](file:///c:/Users/Kennedy/Desktop/dev/myFinance/src/domain/services/financeCalculations.ts) com mapeamento de cores consistentes e ordenação por maior volume de gasto.
  - Suíte de testes expandida para **28 testes unitários e de integração (100% aprovados)**.
- **Próximo Passo Recomendado:** Implementar a **Funcionalidade 3: 🎯 Barra de Meta / Orçamento Mensal**.
