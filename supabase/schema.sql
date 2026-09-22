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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    title TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas rápidas e ordenação por data e usuário
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category);

-- 3. Tabela de Categorias Personalizadas (Entrada e Saída)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    icon TEXT NOT NULL DEFAULT 'Tag',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (user_id, name, type)
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories (user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories (type);

-- 4. Tabela de Metas / Orçamento Mensal (por Usuário)
CREATE TABLE IF NOT EXISTS public.budgets (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    id TEXT NOT NULL DEFAULT 'global',
    budget_amount NUMERIC(12, 2) NOT NULL CHECK (budget_amount >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (user_id, id)
);

-- ==============================================================================
-- 🔒 Políticas de Segurança por Usuário (Row Level Security - RLS)
-- ==============================================================================
-- Habilitar RLS em todas as tabelas
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Transações: cada usuário autenticado manipula apenas os seus dados
CREATE POLICY "Transacoes do usuario autenticado - SELECT"
    ON public.transactions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Transacoes do usuario autenticado - INSERT"
    ON public.transactions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Transacoes do usuario autenticado - DELETE"
    ON public.transactions FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Categorias: cada usuário autenticado manipula apenas as suas categorias personalizadas
CREATE POLICY "Categorias do usuario autenticado - ALL"
    ON public.categories FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Metas Orçamentárias: cada usuário autenticado manipula apenas as suas metas
CREATE POLICY "Metas do usuario autenticado - SELECT"
    ON public.budgets FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Metas do usuario autenticado - ALL"
    ON public.budgets FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
