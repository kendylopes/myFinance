-- ==============================================================================
-- Migration: Integração WhatsApp Multi-Tenant para Agente de IA do myFinance
-- Tabela de vinculação de número de telefone e códigos temporários de ativação (OTP)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.user_whatsapp_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE,
    activation_code VARCHAR(12),
    activation_code_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT false NOT NULL,
    daily_limit_messages INTEGER DEFAULT 100 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT user_whatsapp_unique_user UNIQUE (user_id)
);

-- Índices para busca rápida no Webhook quando o WhatsApp enviar uma mensagem
CREATE INDEX IF NOT EXISTS idx_whatsapp_phone_number ON public.user_whatsapp_integrations (phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_activation_code ON public.user_whatsapp_integrations (activation_code);

-- Habilitar Row Level Security (RLS) para proteção absoluta entre inquilinos
ALTER TABLE public.user_whatsapp_integrations ENABLE ROW LEVEL SECURITY;

-- Política de Leitura: Usuário autenticado só pode ver sua própria integração
CREATE POLICY "Users can view own whatsapp integration"
    ON public.user_whatsapp_integrations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política de Inserção: Usuário autenticado só pode criar integração para si mesmo
CREATE POLICY "Users can create own whatsapp integration"
    ON public.user_whatsapp_integrations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política de Atualização: Usuário autenticado só pode atualizar sua própria integração
CREATE POLICY "Users can update own whatsapp integration"
    ON public.user_whatsapp_integrations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política de Exclusão: Usuário autenticado só pode remover sua própria integração
CREATE POLICY "Users can delete own whatsapp integration"
    ON public.user_whatsapp_integrations
    FOR DELETE
    USING (auth.uid() = user_id);
