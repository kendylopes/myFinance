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
    type TEXT NOT NULL DEFAULT 'payable' CHECK (type IN ('payable', 'receivable')),
    phone TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_debts_user_id ON public.debts (user_id);
CREATE INDEX IF NOT EXISTS idx_debts_type ON public.debts (type);
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

-- 7. Funções RPC de Integração com o WhatsApp Bot (Myfi)

CREATE OR REPLACE FUNCTION public.record_whatsapp_debt(
    p_user_id UUID,
    p_lender_name TEXT,
    p_amount NUMERIC,
    p_type TEXT DEFAULT 'receivable',
    p_phone TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_due_date DATE DEFAULT NULL,
    p_interest_rate NUMERIC DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_id UUID;
    v_due DATE;
    v_desc TEXT;
BEGIN
    v_due := COALESCE(p_due_date, (current_date + interval '30 days')::DATE);
    v_desc := COALESCE(p_description, 
        CASE WHEN p_type = 'receivable' 
             THEN 'Empréstimo concedido a ' || p_lender_name 
             ELSE 'Dívida com ' || p_lender_name 
        END
    );

    INSERT INTO public.debts (
        user_id,
        lender_name,
        original_amount,
        current_balance,
        interest_rate,
        interest_type,
        start_date,
        due_date,
        status,
        type,
        phone,
        description
    ) VALUES (
        p_user_id,
        p_lender_name,
        p_amount,
        p_amount,
        COALESCE(p_interest_rate, 0),
        'monthly',
        current_date,
        v_due,
        'active',
        p_type,
        p_phone,
        v_desc
    ) RETURNING id INTO v_new_id;

    IF p_type = 'receivable' THEN
        INSERT INTO public.transactions (
            user_id,
            title,
            amount,
            type,
            category,
            date,
            status
        ) VALUES (
            p_user_id,
            'Empréstimo para ' || p_lender_name,
            p_amount,
            'expense',
            'Empréstimo',
            current_date,
            'paid'
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true, 
        'debt_id', v_new_id,
        'lender_name', p_lender_name,
        'amount', p_amount,
        'type', p_type,
        'due_date', v_due
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_whatsapp_debts_summary(
    p_user_id UUID,
    p_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_receivable NUMERIC := 0;
    v_total_payable NUMERIC := 0;
    v_receivables JSONB := '[]'::jsonb;
    v_payables JSONB := '[]'::jsonb;
BEGIN
    SELECT 
        COALESCE(SUM(current_balance), 0),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', lender_name,
                'balance', current_balance,
                'due_date', due_date,
                'phone', phone,
                'status', status
            ) ORDER BY due_date ASC
        ), '[]'::jsonb)
    INTO v_total_receivable, v_receivables
    FROM public.debts
    WHERE user_id = p_user_id
      AND type = 'receivable'
      AND status != 'paid';

    SELECT 
        COALESCE(SUM(current_balance), 0),
        COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'name', lender_name,
                'balance', current_balance,
                'due_date', due_date,
                'status', status
            ) ORDER BY due_date ASC
        ), '[]'::jsonb)
    INTO v_total_payable, v_payables
    FROM public.debts
    WHERE user_id = p_user_id
      AND type = 'payable'
      AND status != 'paid';

    RETURN jsonb_build_object(
        'total_receivable', v_total_receivable,
        'total_payable', v_total_payable,
        'receivables', v_receivables,
        'payables', v_payables
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.pay_whatsapp_debt_by_name(
    p_user_id UUID,
    p_name TEXT,
    p_amount NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_debt RECORD;
    v_new_balance NUMERIC;
    v_new_status TEXT;
    v_payment_id UUID;
BEGIN
    SELECT * INTO v_debt
    FROM public.debts
    WHERE user_id = p_user_id
      AND status != 'paid'
      AND lender_name ILIKE '%' || p_name || '%'
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Nenhum empréstimo ou dívida ativa encontrada para ' || p_name
        );
    END IF;

    v_new_balance := GREATEST(0, v_debt.current_balance - p_amount);
    IF v_new_balance = 0 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := v_debt.status;
    END IF;

    UPDATE public.debts
    SET current_balance = v_new_balance,
        status = v_new_status,
        updated_at = now()
    WHERE id = v_debt.id;

    INSERT INTO public.debt_payments (
        debt_id,
        amount,
        payment_date,
        type,
        principal_paid,
        interest_paid,
        notes
    ) VALUES (
        v_debt.id,
        p_amount,
        current_date,
        CASE WHEN v_new_balance = 0 THEN 'full_payoff' ELSE 'amortization' END,
        p_amount,
        0,
        'Registrado via WhatsApp Myfi'
    ) RETURNING id INTO v_payment_id;

    INSERT INTO public.transactions (
        user_id,
        title,
        amount,
        type,
        category,
        date,
        status
    ) VALUES (
        p_user_id,
        CASE WHEN v_debt.type = 'receivable' 
             THEN 'Recebimento de empréstimo: ' || v_debt.lender_name
             ELSE 'Pagamento de dívida: ' || v_debt.lender_name
        END,
        p_amount,
        CASE WHEN v_debt.type = 'receivable' THEN 'income' ELSE 'expense' END,
        'Empréstimo',
        current_date,
        'paid'
    );

    RETURN jsonb_build_object(
        'success', true,
        'debt_id', v_debt.id,
        'lender_name', v_debt.lender_name,
        'type', v_debt.type,
        'amount_paid', p_amount,
        'new_balance', v_new_balance,
        'status', v_new_status
    );
END;
$$;
