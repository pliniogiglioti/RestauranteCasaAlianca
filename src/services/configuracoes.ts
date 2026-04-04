import { supabase } from '@/lib/supabase'
import type { Configuracao } from '@/types'

export async function getConfiguracao(): Promise<Configuracao | null> {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('*')
    .limit(1)
    .single()

  if (error) return null
  return data as Configuracao
}

export async function updateConfiguracao(
  id: string,
  config: Partial<Omit<Configuracao, 'id' | 'created_at' | 'updated_at'>>
): Promise<Configuracao> {
  const { data, error } = await supabase
    .from('configuracoes')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(config as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Configuracao
}
