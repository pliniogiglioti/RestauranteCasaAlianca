import { supabase } from '@/lib/supabase'
import type { Configuracao } from '@/types'

export async function getConfiguracao(lojaId?: string | null): Promise<Configuracao | null> {
  let query = supabase.from('configuracoes').select('*')

  if (lojaId) {
    query = query.eq('loja_id', lojaId)
  }

  const { data } = await query.limit(1).maybeSingle()
  return data as Configuracao | null
}

export async function upsertConfiguracao(
  config: Partial<Omit<Configuracao, 'created_at' | 'updated_at'>>,
  id?: string
): Promise<void> {
  if (id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('configuracoes').update(config as any).eq('id', id)
    if (error) throw error
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await supabase.from('configuracoes').insert(config as any)
    if (error) throw error
  }
}
