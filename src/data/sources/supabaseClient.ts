import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Valida se as variáveis de ambiente necessárias para o Supabase estão configuradas.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) {
    return false
  }

  const trimmedUrl = supabaseUrl.trim()
  const trimmedKey = supabaseAnonKey.trim()

  // Checa se a URL é válida e se não são placeholders padrão
  const isValidUrl = trimmedUrl.startsWith('https://') && trimmedUrl.includes('supabase.co')
  const isValidKey = trimmedKey.length > 20 && !trimmedKey.includes('sua-anon-key')

  return isValidUrl && isValidKey
}

let clientInstance: SupabaseClient | null = null

/**
 * Retorna a instância única do cliente Supabase ou null caso as credenciais não estejam configuradas.
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null
  }

  if (!clientInstance) {
    clientInstance = createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  }

  return clientInstance
}
