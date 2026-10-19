import { getSupabaseClient } from '../../data/sources/supabaseClient'

export interface WhatsAppIntegration {
  id: string
  userId: string
  phoneNumber: string | null
  activationCode: string | null
  activationCodeExpiresAt: string | null
  isActive: boolean
  dailyLimitMessages: number
  createdAt: string
  updatedAt: string
}

const LOCAL_STORAGE_KEY = 'myfinance_whatsapp_integration_mock'

/**
 * Consulta a integração do WhatsApp do usuário logado
 */
export async function getWhatsAppIntegration(userId: string): Promise<WhatsAppIntegration | null> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    // Fallback local se o Supabase não estiver configurado
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`)
    return saved ? JSON.parse(saved) : null
  }

  try {
    const { data, error } = await supabase
      .from('user_whatsapp_integrations')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[WhatsAppService] Falha ao consultar integração:', error.message)
      return null
    }

    if (!data) return null

    return {
      id: data.id,
      userId: data.user_id,
      phoneNumber: data.phone_number,
      activationCode: data.activation_code,
      activationCodeExpiresAt: data.activation_code_expires_at,
      isActive: data.is_active,
      dailyLimitMessages: data.daily_limit_messages ?? 100,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  } catch (err) {
    console.error('[WhatsAppService] Erro inesperado ao consultar:', err)
    return null
  }
}

/**
 * Gera um código temporário de 6 dígitos para o usuário enviar no WhatsApp e validar seu número
 */
export async function generateActivationCode(userId: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutos de validade

  const supabase = getSupabaseClient()

  if (!supabase) {
    const mock: WhatsAppIntegration = {
      id: `local-${userId}`,
      userId,
      phoneNumber: null,
      activationCode: code,
      activationCodeExpiresAt: expiresAt,
      isActive: false,
      dailyLimitMessages: 100,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(mock))
    return code
  }

  try {
    const { error } = await supabase.from('user_whatsapp_integrations').upsert(
      {
        user_id: userId,
        activation_code: code,
        activation_code_expires_at: expiresAt,
        is_active: false,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )

    if (error) {
      console.error('[WhatsAppService] Erro ao salvar código de ativação:', error.message)
      throw new Error(`Falha ao gerar código: ${error.message}`)
    }

    return code
  } catch (err) {
    console.error('[WhatsAppService] Erro inesperado:', err)
    throw err
  }
}

/**
 * Desconecta a integração do WhatsApp do usuário
 */
export async function disconnectWhatsApp(userId: string): Promise<boolean> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    localStorage.removeItem(`${LOCAL_STORAGE_KEY}_${userId}`)
    return true
  }

  try {
    const { error } = await supabase
      .from('user_whatsapp_integrations')
      .update({
        phone_number: null,
        activation_code: null,
        activation_code_expires_at: null,
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)

    return !error
  } catch (err) {
    console.error('[WhatsAppService] Erro ao desconectar:', err)
    return false
  }
}
