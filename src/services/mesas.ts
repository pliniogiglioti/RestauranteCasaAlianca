import { supabase } from '@/lib/supabase'
import type { Mesa, MesaInsert, MesaUpdate } from '@/types'

export async function getMesas(lojaId?: string | null): Promise<Mesa[]> {
  let query = supabase.from('mesas').select('*').order('numero', { ascending: true })
  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Mesa[]
}

export async function getMesaBySlug(slug: string, lojaId?: string | null): Promise<Mesa> {
  let query = supabase
    .from('mesas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)

  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query.single()
  if (error) throw error
  return data as Mesa
}

export async function getMesaById(id: string): Promise<Mesa> {
  const { data, error } = await supabase
    .from('mesas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Mesa
}

export async function createMesa(mesa: MesaInsert): Promise<Mesa> {
  const { data, error } = await supabase
    .from('mesas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(mesa as any)
    .select()
    .single()

  if (error) throw error
  return data as Mesa
}

export async function updateMesa(id: string, mesa: MesaUpdate): Promise<Mesa> {
  const { data, error } = await supabase
    .from('mesas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(mesa as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Mesa
}

export async function deleteMesa(id: string): Promise<void> {
  const { error } = await supabase.from('mesas').delete().eq('id', id)
  if (error) throw error
}

export function gerarSlugMesa(numero: number): string {
  return `mesa-${numero}`
}

export function gerarQrCodeUrl(slug: string, baseUrl: string, lojaSlug: string): string {
  return `${baseUrl}/${lojaSlug}/mesa/${slug}`
}
