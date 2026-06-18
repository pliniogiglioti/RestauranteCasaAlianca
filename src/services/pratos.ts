import { supabase } from '@/lib/supabase'
import type { PratoInsert, PratoUpdate, DiaSemana } from '@/types'
import type { PratoComCategoria } from '@/types'

export async function getPratos(lojaId?: string | null): Promise<PratoComCategoria[]> {
  let query = supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .order('nome', { ascending: true })
  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as PratoComCategoria[]
}

export async function getPratosAtivos(lojaId?: string | null): Promise<PratoComCategoria[]> {
  let query = supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .eq('ativo', true)
    .order('nome', { ascending: true })
  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as PratoComCategoria[]
}

export async function getBebidasParaUpsell(lojaId?: string | null): Promise<PratoComCategoria[]> {
  const { data: bebidasPedidas, error: erroContagem } = await supabase
    .from('pedido_itens')
    .select('prato_id, quantidade')

  let idsMaisVendidos: string[] = []

  if (!erroContagem && bebidasPedidas) {
    const contagem: Record<string, number> = {}
    for (const item of bebidasPedidas as { prato_id: string | null; quantidade: number }[]) {
      if (item.prato_id) {
        contagem[item.prato_id] = (contagem[item.prato_id] ?? 0) + item.quantidade
      }
    }
    idsMaisVendidos = Object.keys(contagem).sort((a, b) => contagem[b] - contagem[a])
  }

  let query = supabase
    .from('pratos')
    .select(`*, categoria:categorias!inner(*)`)
    .eq('ativo', true)
    .eq('categorias.slug', 'bebidas')
  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query
  if (error) throw error
  const bebidas = (data ?? []) as unknown as PratoComCategoria[]

  if (idsMaisVendidos.length === 0) return bebidas

  return bebidas.sort((a, b) => {
    const posA = idsMaisVendidos.indexOf(a.id)
    const posB = idsMaisVendidos.indexOf(b.id)
    if (posA === -1 && posB === -1) return 0
    if (posA === -1) return 1
    if (posB === -1) return -1
    return posA - posB
  })
}

export async function getPratoDodia(dia: DiaSemana, lojaId?: string | null): Promise<PratoComCategoria[]> {
  let query = supabase
    .from('pratos')
    .select(`*, categoria:categorias(*)`)
    .eq('ativo', true)
    .eq('prato_do_dia', true)
    .eq('dia_prato_do_dia', dia)
  if (lojaId) query = query.eq('loja_id', lojaId)

  const { data, error } = await query
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
