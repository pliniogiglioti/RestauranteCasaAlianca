export type {
  Database,
  DiaSemana,
  StatusPedido,
  LojaRow as Loja,
  LojaInsert,
  LojaUpdate,
  MesaRow as Mesa,
  MesaInsert,
  MesaUpdate,
  CategoriaRow as Categoria,
  CategoriaInsert,
  CategoriaUpdate,
  PratoRow as Prato,
  PratoInsert,
  PratoUpdate,
  BannerRow as Banner,
  BannerInsert,
  BannerUpdate,
  PedidoRow as Pedido,
  PedidoInsert,
  PedidoUpdate,
  PedidoItemRow as PedidoItem,
  PedidoItemInsert,
  ProfileRow as Profile,
  ConfiguracaoRow as Configuracao,
} from './database'

import type {
  CategoriaRow,
  PratoRow,
  PedidoRow,
  PedidoItemRow,
  MesaRow,
  DiaSemana,
  StatusPedido,
} from './database'

export type PratoComCategoria = PratoRow & {
  categoria: CategoriaRow | null
}

export type PedidoCompleto = PedidoRow & {
  mesa: MesaRow | null
  itens: PedidoItemRow[]
}

// Cart types
export interface CartItem {
  prato: PratoRow
  quantidade: number
  observacao: string
}

export interface Cart {
  items: CartItem[]
  observacaoGeral: string
  mesaId: string
  mesaNumero: number
}

export const DIAS_SEMANA: { value: DiaSemana; label: string }[] = [
  { value: 'segunda', label: 'Segunda-feira' },
  { value: 'terca', label: 'Terça-feira' },
  { value: 'quarta', label: 'Quarta-feira' },
  { value: 'quinta', label: 'Quinta-feira' },
  { value: 'sexta', label: 'Sexta-feira' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

export const STATUS_PEDIDO: { value: StatusPedido; label: string; color: string }[] = [
  { value: 'recebido', label: 'Recebido', color: 'blue' },
  { value: 'em_preparo', label: 'Em Preparo', color: 'yellow' },
  { value: 'pronto', label: 'Pronto', color: 'green' },
  { value: 'entregue', label: 'Entregue na Mesa', color: 'purple' },
  { value: 'finalizado', label: 'Finalizado', color: 'gray' },
]

export function getDiaSemanaAtual(date = new Date()): DiaSemana {
  const dias: DiaSemana[] = [
    'domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado',
  ]
  return dias[date.getDay()]
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}
