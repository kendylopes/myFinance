-- ==============================================================================
-- 💰 myFinance — Script de Criação do Banco de Dados PostgreSQL (Supabase)
-- ==============================================================================
-- Instruções:
-- 1. Acesse o painel do seu projeto no Supabase: https://supabase.com/dashboard
-- 2. No menu lateral, clique em "SQL Editor".
-- 3. Cole este script e clique no botão "Run" (ou pressione Ctrl + Enter).
-- ==============================================================================

-- 1. Habilitar extensão pgcrypto para geração de UUIDs se necessário
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Transações Financeiras (Receitas e Despesas)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas rápidas e ordenação por data
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category);

-- 3. Tabela de Metas / Orçamento Mensal
CREATE TABLE IF NOT EXISTS public.budgets (
    id TEXT PRIMARY KEY DEFAULT 'global',
    budget_amount NUMERIC(12, 2) NOT NULL CHECK (budget_amount >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Inserir orçamento padrão de R$ 3.000 se não existir
INSERT INTO public.budgets (id, budget_amount)
VALUES ('global', 3000.00)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 🔒 Políticas de Segurança (Row Level Security - RLS)
-- ==============================================================================
-- Habilitar RLS em ambas as tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas para acesso público/anon (permite leitura, inserção, atualização e exclusão)
CREATE POLICY "Permitir leitura anonima em transactions"
    ON public.transactions FOR SELECT
    USING (true);

CREATE POLICY "Permitir insercao anonima em transactions"
    ON public.transactions FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Permitir delecao anonima em transactions"
    ON public.transactions FOR DELETE
    USING (true);

CREATE POLICY "Permitir leitura anonima em budgets"
    ON public.budgets FOR SELECT
    USING (true);

CREATE POLICY "Permitir upsert anonimo em budgets"
    ON public.budgets FOR ALL
    USING (true)
    WITH CHECK (true);
