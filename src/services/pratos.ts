import { supabase } from '@/lib/supabase'
import type { PratoInsert, PratoUpdate, DiaSemana } from '@/types'
import type { PratoComCategoria } from '@/types'

export async function getPratos(): Promise<PratoComCategoria[]> {
  const { data, error } = await supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .order('nome', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as PratoComCategoria[]
}

export async function getPratosAtivos(): Promise<PratoComCategoria[]> {
  const { data, error } = await supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  if (error) throw error
  return (data ?? []) as unknown as PratoComCategoria[]
}

export async function getPratoDodia(dia: DiaSemana): Promise<PratoComCategoria[]> {
  const { data, error } = await supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .eq('ativo', true)
    .eq('prato_do_dia', true)
    .eq('dia_prato_do_dia', dia)

  if (error) throw error
  return (data ?? []) as unknown as PratoComCategoria[]
}

export async function createPrato(prato: PratoInsert): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('pratos')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(prato as any)
    .select()
    .single()

  if (error) throw error
  return data as { id: string }
}

export async function updatePrato(id: string, prato: PratoUpdate): Promise<{ id: string }> {
  const { data, error } = await supabase
    .from('pratos')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(prato as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as { id: string }
}

export async function deletePrato(id: string): Promise<void> {
  const { error } = await supabase.from('pratos').delete().eq('id', id)
  if (error) throw error
}

export async function uploadImagemPrato(file: File, pratoId: string): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `pratos/${pratoId}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('imagens')
    .upload(path, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('imagens').getPublicUrl(path)
  return data.publicUrl
}
