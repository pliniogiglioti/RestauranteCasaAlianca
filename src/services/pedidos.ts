import { supabase } from '@/lib/supabase'
import type { StatusPedido, CartItem, PedidoCompleto, Pedido } from '@/types'

export interface CriarPedidoInput {
  mesa_id: string
  observacao_geral?: string
  itens: CartItem[]
}

export async function criarPedido(input: CriarPedidoInput): Promise<Pedido> {
  const valor_total = input.itens.reduce(
    (acc, item) => acc + item.prato.preco * item.quantidade,
    0
  )

  const { data: pedido, error: pedidoError } = await supabase
    .from('pedidos')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      mesa_id: input.mesa_id,
      observacao_geral: input.observacao_geral ?? null,
      valor_total,
      status: 'recebido',
    } as any)
    .select()
    .single()

  if (pedidoError) throw pedidoError

  const pedidoData = pedido as Pedido

  const itens = input.itens.map((item) => ({
    pedido_id: pedidoData.id,
    prato_id: item.prato.id,
    nome_prato: item.prato.nome,
    quantidade: item.quantidade,
    preco_unitario: item.prato.preco,
    observacao_item: item.observacao || null,
  }))

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: itensError } = await supabase.from('pedido_itens').insert(itens as any)
  if (itensError) throw itensError

  return pedidoData
}

export async function getPedidos(): Promise<PedidoCompleto[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`*, mesa:mesas(*), itens:pedido_itens(*)`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as PedidoCompleto[]
}

export async function getPedidosByStatus(status: StatusPedido): Promise<PedidoCompleto[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`*, mesa:mesas(*), itens:pedido_itens(*)`)
    .eq('status', status)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as PedidoCompleto[]
}

export async function getPedidosByMesa(mesa_id: string): Promise<PedidoCompleto[]> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`*, mesa:mesas(*), itens:pedido_itens(*)`)
    .eq('mesa_id', mesa_id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as PedidoCompleto[]
}

export async function getPedidoById(id: string): Promise<PedidoCompleto> {
  const { data, error } = await supabase
    .from('pedidos')
    .select(`*, mesa:mesas(*), itens:pedido_itens(*)`)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as unknown as PedidoCompleto
}

export async function atualizarStatusPedido(id: string, status: StatusPedido): Promise<Pedido> {
  const { data, error } = await supabase
    .from('pedidos')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update({ status } as any)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Pedido
}
