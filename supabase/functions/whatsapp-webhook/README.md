# 🚀 myFinance — Agente de IA para WhatsApp (Supabase Edge Function)

Esta Edge Function atua como o **Webhook inteligente** que recebe mensagens do WhatsApp (Evolution API ou Meta Cloud API), processa a intenção com **Google Gemini 2.0 Flash (Function Calling)**, salva os lançamentos com segurança no **Supabase** de cada usuário e devolve a resposta no WhatsApp.

---

## 📋 Pré-requisitos e Variáveis de Ambiente

No painel do Supabase (em **Project Settings > Edge Functions > Secrets**) ou via terminal:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Chave da Google Gemini API ([Google AI Studio](https://aistudio.google.com/)) | `AIzaSy...` |
| `EVOLUTION_API_URL` | URL da sua instância da Evolution API (se for usar Evolution) | `https://sua-evolution.railway.app` |
| `EVOLUTION_API_KEY` | Chave de API da sua Evolution API | `sua_chave_secreta` |

---

## 🛠️ Como fazer o Deploy para o Supabase

1. Faça login na CLI do Supabase (se ainda não fez):
   ```bash
   npx supabase login
   ```

2. Vincule seu projeto do Supabase:
   ```bash
   npx supabase link --project-ref SEU_PROJECT_REF
   ```

3. Defina as variáveis de ambiente no Supabase:
   ```bash
   npx supabase secrets set GEMINI_API_KEY="sua_chave" EVOLUTION_API_URL="sua_url" EVOLUTION_API_KEY="sua_api_key"
   ```

4. Publique a função:
   ```bash
   npx supabase functions deploy whatsapp-webhook --no-verify-jwt
   ```

A URL do seu webhook será:
`https://<SEU_PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook`

---

## 📱 Configurando no WhatsApp (Evolution API)

Na Evolution API, configure o Webhook da sua instância para:
- **URL:** `https://<SEU_PROJECT_REF>.supabase.co/functions/v1/whatsapp-webhook`
- **Método:** `POST`
- **Eventos:** `MESSAGES_UPSERT`

---

## 🔒 Fluxo de Segurança Multi-Inquilino (Multi-Tenant)

1. Quando uma pessoa envia mensagem no WhatsApp, o webhook verifica se o número já está registrado em `user_whatsapp_integrations`.
2. Se não estiver, o bot solicita o comando de ativação:  
   `ATIVAR [CÓDIGO]` (gerado com segurança na tela de Configurações do myFinance).
3. Todas as transações criadas usam o `user_id` estritamente vinculado àquele número autenticado, impedindo vazamento de dados entre clientes.
