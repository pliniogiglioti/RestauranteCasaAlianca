import { supabase } from '@/lib/supabase'
import type { Categoria, CategoriaInsert, CategoriaUpdate } from '@/types'

export async function getCategorias(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .order('ordem', { ascending: true })

  if (error) throw error
  return (data ?? []) as Categoria[]
}

export async function getCategoriasAtivas(): Promise<Categoria[]> {
  const { data, error } = await supabase
    .from('categorias')
    .select('*')
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  if (error) throw error
  return (data ?? []) as Categoria[]
}

export async function createCategoria(categoria: CategoriaInsert): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(categoria as any)
    .select()
    .single()

  if (error) throw error
  return data as Categoria
}

export async function updateCategoria(id: string, categoria: CategoriaUpdate): Promise<Categoria> {
  const { data, error } = await supabase
    .from('categorias')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(categoria as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Categoria
}

export async function deleteCategoria(id: string): Promise<void> {
  const { error } = await supabase.from('categorias').delete().eq('id', id)
  if (error) throw error
}

export async function reordenarCategorias(ids: string[]): Promise<void> {
  const updates = ids.map((id, index) =>
    supabase
      .from('categorias')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ ordem: index + 1 } as any)
      .eq('id', id)
  )
  await Promise.all(updates)
}

export function gerarSlugCategoria(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
