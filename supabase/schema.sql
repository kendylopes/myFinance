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
    status TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('paid', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices para buscas rápidas e ordenação por data e usuário
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions (date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions (type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (status);

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

CREATE POLICY "Transacoes do usuario autenticado - UPDATE"
    ON public.transactions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

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

-- ==============================================================================
-- 5. Tabela de Dívidas & Empréstimos (Agiotas, Contratos e Renovações)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    lender_name TEXT NOT NULL,
    description TEXT,
    original_amount NUMERIC(12, 2) NOT NULL CHECK (original_amount > 0),
    current_balance NUMERIC(12, 2) NOT NULL CHECK (current_balance >= 0),
    interest_rate NUMERIC(6, 2) NOT NULL DEFAULT 0,
    interest_type TEXT NOT NULL DEFAULT 'monthly' CHECK (interest_type IN ('monthly', 'daily', 'fixed')),
    fixed_interest_amount NUMERIC(12, 2),
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_installments INT,
    paid_installments INT NOT NULL DEFAULT 0,
    installment_amount NUMERIC(12, 2),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'renewed')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts (user_id);
CREATE INDEX IF NOT EXISTS idx_debts_due_date ON public.debts (due_date ASC);
CREATE INDEX IF NOT EXISTS idx_debts_status ON public.debts (status);

-- 6. Tabela de Pagamentos / Renovações de Dívidas
CREATE TABLE IF NOT EXISTS public.debt_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    debt_id UUID REFERENCES public.debts(id) ON DELETE CASCADE,
    payment_date DATE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    type TEXT NOT NULL CHECK (type IN ('renewal', 'amortization', 'installment', 'full_payoff')),
    interest_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    principal_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
    new_due_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON public.debt_payments (debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_user_id ON public.debt_payments (user_id);

-- RLS para Dívidas e Pagamentos
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debt_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dividas do usuario autenticado - ALL"
    ON public.debts FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Pagamentos de dividas do usuario autenticado - ALL"
    ON public.debt_payments FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
