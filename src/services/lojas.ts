import { supabase } from '@/lib/supabase'
import type { Loja, LojaInsert, LojaUpdate } from '@/types'

export async function getLojas(): Promise<Loja[]> {
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .order('nome', { ascending: true })

  if (error) throw error
  return (data ?? []) as Loja[]
}

export async function getLojaBySlug(slug: string): Promise<Loja> {
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .eq('slug', slug)
    .eq('ativo', true)
    .single()

  if (error) throw error
  return data as Loja
}

export async function getLojaById(id: string): Promise<Loja> {
  const { data, error } = await supabase
    .from('lojas')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Loja
}

export async function createLoja(loja: LojaInsert): Promise<Loja> {
  const { data, error } = await supabase
    .from('lojas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(loja as any)
    .select()
    .single()

  if (error) throw error
  return data as Loja
}

export async function updateLoja(id: string, loja: LojaUpdate): Promise<Loja> {
  const { data, error } = await supabase
    .from('lojas')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(loja as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Loja
}

export async function deleteLoja(id: string): Promise<void> {
  const { error } = await supabase.from('lojas').delete().eq('id', id)
  if (error) throw error
}

export function gerarSlugLoja(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
