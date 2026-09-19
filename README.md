# 💰 myFinance — Gestão Financeira Pessoal Moderna & Escalável

> Aplicativo moderno de gestão e planejamento financeiro pessoal construído com **React 19**, **TypeScript**, **Tailwind CSS v4**, **Clean Architecture** e **Biome**.

[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Biome](https://img.shields.io/badge/Biome-2.5-60A5FA?style=for-the-badge&logo=biome&logoColor=white)](https://biomejs.dev)
[![Vitest](https://img.shields.io/badge/Vitest-5.0-FCC72B?style=for-the-badge&logo=vitest&logoColor=black)](https://vitest.dev)
[![Tests](https://img.shields.io/badge/Tests-17%20Passed-success?style=for-the-badge)](https://vitest.dev)

---

## 📌 1. Visão Geral

O **myFinance** foi desenhado com foco em três pilares fundamentais:

1. **Didática e Clareza:** Código limpo, desacoplado e fácil de evoluir.
2. **Arquitetura Profissional:** Estrita separação entre Interface Visual (UI), Regras de Domínio (Lógica pura) e Camada de Acesso a Dados (Repository Pattern).
3. **Qualidade & Performance:** 100% de testes automatizados com Vitest, garantia de 60fps em re-renderizações e padronização ultrarrápida com o Biome.

---

## ✨ 2. Principais Funcionalidades

- 🟢 **Gestão de Entradas e Saídas:** Cadastro de receitas e despesas com título, valor, categoria e data.
- 📊 **Dashboard em Tempo Real:**
  - Card de **Total de Entradas** (acumulado).
  - Card de **Total de Saídas** (acumulado).
  - Card de **Saldo Atual** (com feedback visual e dinâmico: azul/verde para positivo e vermelho para negativo).
- 💾 **Persistência Segura:** Armazenamento local no navegador (`LocalStorage`) com tolerância a falhas e dados iniciais pré-carregados.
- 🗑️ **Histórico Interativo:** Listagem cronológica reversa com botão individual de exclusão e indicador de estado vazio (*Empty State*).
- ♿ **Acessibilidade Completa (a11y):** Labels estritamente associados, inputs validados e alertas acessíveis para leitores de tela.

---

## 🏛️ 3. Arquitetura do Software (Clean Architecture)

O projeto adota uma arquitetura em camadas orientada a responsabilidades únicas:

```text
src/
├── core/                                     # Utilitários compartilhados e formatadores
│   └── formatters/
│       ├── currency.ts                       # Formatação em Real Brasileiro (BRL)
│       └── date.ts                           # Formatação de datas no padrão pt-BR
│
├── domain/                                   # 🧠 REGRAS DE NEGÓCIO PURAS (Zero dependência de React)
│   ├── models/
│   │   └── transaction.ts                    # Interfaces, DTOs e entidades de domínio
│   ├── services/
│   │   └── financeCalculations.ts            # Cálculos puros (Entradas, Saídas, Saldo e Validações)
│   └── repositories/
│       └── ITransactionRepository.ts         # Contrato do repositório (Interface)
│
├── data/                                     # 💾 CAMADA DE DADOS E PERSISTÊNCIA
│   └── repositories/
│       └── LocalStorageTransactionRepository.ts # Implementação concreta para LocalStorage
│
├── presentation/                             # 🎨 CAMADA VISUAL & INTERFACE (React 19)
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx                    # Topbar com contador de movimentações
│   │   └── dashboard/
│   │       ├── SummaryCards.tsx              # Cards métricos de saldo e despesas
│   │       ├── TransactionForm.tsx           # Formulário isolado e validado
│   │       ├── TransactionItem.tsx           # Item da lista com formatação e exclusão
│   │       └── TransactionList.tsx           # Lista com Empty State e feedback
│   └── hooks/
│       └── useFinance.ts                     # Custom Hook que orquestra estado e repositório
│
├── tests/                                    # 🧪 SUÍTE DE TESTES E QUALIDADE (Vitest + RTL)
│   ├── setup.ts                              # Setup do ambiente JSDOM
│   ├── unit/
│   │   ├── financeCalculations.test.ts       # Testes unitários das regras matemáticas
│   │   └── LocalStorageTransactionRepository.test.ts # Testes de persistência e I/O
│   └── integration/
│       ├── SummaryCards.test.tsx             # Testes de renderização dos cards
│       └── TransactionForm.test.tsx          # Testes de interação do usuário
│
└── App.tsx                                   # 🚀 Ponto de entrada declarativo e enxuto
```

> 💡 **Vantagem do Repository Pattern:** Se você quiser migrar o armazenamento de `LocalStorage` para o **Supabase**, basta criar a classe `SupabaseTransactionRepository` implementando `ITransactionRepository`. **Nenhum componente visual precisará ser alterado!**

---

## 🛠️ 4. Stack Tecnológica

| Ferramenta | Finalidade |
| :--- | :--- |
| **React 19** | Biblioteca para interfaces reativas baseadas em componentes funcionais. |
| **TypeScript** | Tipagem estrita em tempo de compilação prevenindo bugs lógicos e matemáticos. |
| **Vite 8** | Construtor de build e servidor de desenvolvimento ultra-otimizado com HMR instantâneo. |
| **Tailwind CSS v4** | Framework de estilização utilitária de última geração com `@tailwindcss/vite`. |
| **Lucide React** | Biblioteca de ícones vetoriais modernos e leves. |
| **Biome 2.5** | Ferramenta em Rust para formatação de código e análise estática (linting) instantânea. |
| **Vitest** | Runner de testes moderno e integrado ao pipeline do Vite. |
| **React Testing Library** | Testes de integração focados na experiência e comportamento real do usuário. |

---

## 🚀 5. Como Executar o Projeto

### Pré-requisitos

- **Node.js:** versão 20.x ou superior recomendada.
- **npm** (ou yarn/pnpm).

### Instalação

```powershell
# 1. Clone ou acesse a pasta do repositório
cd myFinance

# 2. Instale as dependências
npm install

# 3. Inicie o servidor de desenvolvimento
npm run dev
```

Abra seu navegador em [http://localhost:5173](http://localhost:5173).

---

## 🧪 6. Scripts Disponíveis

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o servidor local de desenvolvimento com Vite. |
| `npm run test` | Executa todos os 17 testes unitários e de integração uma única vez. |
| `npm run test:watch` | Executa os testes no modo interativo contínuo (*watch mode*). |
| `npm run lint` | Analisa a saúde e conformidade do código com o **Biome** (~60ms). |
| `npm run lint:fix` | Corrige problemas automáticos e organiza imports com o **Biome**. |
| `npm run format` | Aplica as regras de formatação em todo o projeto. |
| `npm run build` | Compila o projeto com validação estrita de tipos e gera os assets para produção (`dist/`). |
| `npm run preview` | Executa localmente o bundle final de produção gerado. |

---

## 📋 7. Próximos Passos (Roadmap)

- [ ] **Filtros e Busca:** Filtragem de transações por mês, ano e categorias.
- [ ] **Gráficos Visuais:** Gráficos de rosca/pizza para distribuição de despesas por categoria.
- [ ] **Exportação de Dados:** Exportação de extratos em CSV ou PDF.
- [ ] **Backend na Nuvem:** Suporte opcional a sincronização com banco de dados Supabase via `SupabaseTransactionRepository`.

---

Desenvolvido com foco em excelência técnica, clareza e manutenibilidade.
