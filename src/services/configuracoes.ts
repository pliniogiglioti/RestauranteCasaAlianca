import { supabase } from '@/lib/supabase'
import type { Configuracao } from '@/types'

export async function getConfiguracao(): Promise<Configuracao | null> {
  const { data } = await supabase
    .from('configuracoes')
    .select('*')
    .limit(1)
    .maybeSingle()

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
