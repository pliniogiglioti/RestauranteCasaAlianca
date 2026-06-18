// ─── Loja (Empresa) ──────────────────────────────────────────
export interface LojaRow {
  id: string
  nome: string
  slug: string
  ativo: boolean
  telefone: string | null
  endereco: string | null
  created_at: string
  updated_at: string
}

export interface LojaInsert {
  nome: string
  slug: string
  ativo?: boolean
  telefone?: string | null
  endereco?: string | null
}

export type LojaUpdate = Partial<LojaInsert>

export type DiaSemana =
  | 'segunda'
  | 'terca'
  | 'quarta'
  | 'quinta'
  | 'sexta'
  | 'sabado'
  | 'domingo'

export type StatusPedido =
  | 'recebido'
  | 'em_preparo'
  | 'pronto'
  | 'entregue'
  | 'finalizado'

// ─── Row types ──────────────────────────────────────────────
export interface MesaRow {
  id: string
  numero: number
  slug: string
  qr_code_url: string | null
  ativo: boolean
  loja_id: string | null
  created_at: string
  updated_at: string
}

export interface CategoriaRow {
  id: string
  nome: string
  slug: string
  icone: string | null
  ordem: number
  ativo: boolean
  loja_id: string | null
  created_at: string
  updated_at: string
}

export interface PratoRow {
  id: string
  nome: string
  descricao: string | null
  imagem_url: string | null
  preco: number
  preco_promocional: number | null
  dia_promocional: DiaSemana | null
  categoria_id: string | null
  ativo: boolean
  prato_do_dia: boolean
  dia_prato_do_dia: DiaSemana | null
  loja_id: string | null
  created_at: string
  updated_at: string
}

export interface BannerRow {
  id: string
  titulo: string
  subtitulo: string | null
  imagem_url: string
  link_opcional: string | null
  ordem: number
  ativo: boolean
  loja_id: string | null
  created_at: string
  updated_at: string
}

export interface PedidoRow {
  id: string
  mesa_id: string | null
  loja_id: string | null
  status: StatusPedido
  comanda_externa: string | null
  nome_cliente: string | null
  observacao_geral: string | null
  valor_total: number
  created_at: string
  updated_at: string
}

export interface PedidoItemRow {
  id: string
  pedido_id: string
  prato_id: string | null
  nome_prato: string
  quantidade: number
  preco_unitario: number
  observacao_item: string | null
  subtotal: number
  created_at: string
}

export interface ProfileRow {
  id: string
  email: string
  nome: string | null
  role: 'admin' | 'super_admin'
  loja_id: string | null
  created_at: string
  updated_at: string
}

export interface ConfiguracaoRow {
  id: string
  loja_id: string | null
  nome_restaurante: string
  slogan: string | null
  icone_app: string | null
  logo_url: string | null
  cor_primaria: string | null
  descricao: string | null
  telefone: string | null
  endereco: string | null
  created_at: string
  updated_at: string
}

// ─── Insert types ────────────────────────────────────────────
export interface MesaInsert {
  numero: number
  slug: string
  qr_code_url?: string | null
  ativo?: boolean
  loja_id?: string | null
}

export interface CategoriaInsert {
  nome: string
  slug: string
  icone?: string | null
  ordem?: number
  ativo?: boolean
  loja_id?: string | null
}

export interface PratoInsert {
  nome: string
  descricao?: string | null
  imagem_url?: string | null
  preco: number
  preco_promocional?: number | null
  dia_promocional?: DiaSemana | null
  categoria_id?: string | null
  ativo?: boolean
  prato_do_dia?: boolean
  dia_prato_do_dia?: DiaSemana | null
  loja_id?: string | null
}

export interface BannerInsert {
  titulo: string
  subtitulo?: string | null
  imagem_url: string
  link_opcional?: string | null
  ordem?: number
  ativo?: boolean
  loja_id?: string | null
}

export interface PedidoInsert {
  mesa_id?: string | null
  loja_id?: string | null
  status?: StatusPedido
  comanda_externa?: string | null
  nome_cliente?: string | null
  observacao_geral?: string | null
  valor_total: number
}

export interface PedidoItemInsert {
  pedido_id: string
  prato_id?: string | null
  nome_prato: string
  quantidade: number
  preco_unitario: number
  observacao_item?: string | null
}

// ─── Update types ─────────────────────────────────────────────
export type MesaUpdate = Partial<MesaInsert>
export type CategoriaUpdate = Partial<CategoriaInsert>
export type PratoUpdate = Partial<PratoInsert>
export type BannerUpdate = Partial<BannerInsert>
export type PedidoUpdate = Partial<PedidoInsert>

// ─── Supabase Database generic ────────────────────────────────
export interface Database {
  public: {
    Tables: {
      lojas: {
        Row: LojaRow
        Insert: LojaInsert
        Update: LojaUpdate
        Relationships: []
      }
      mesas: {
        Row: MesaRow
        Insert: MesaInsert
        Update: MesaUpdate
        Relationships: []
      }
      categorias: {
        Row: CategoriaRow
        Insert: CategoriaInsert
        Update: CategoriaUpdate
        Relationships: []
      }
      pratos: {
        Row: PratoRow
        Insert: PratoInsert
        Update: PratoUpdate
        Relationships: [
          {
            foreignKeyName: 'pratos_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias'
            referencedColumns: ['id']
          }
        ]
      }
      banners: {
        Row: BannerRow
        Insert: BannerInsert
        Update: BannerUpdate
        Relationships: []
      }
      pedidos: {
        Row: PedidoRow
        Insert: PedidoInsert
        Update: PedidoUpdate
        Relationships: [
          {
            foreignKeyName: 'pedidos_mesa_id_fkey'
            columns: ['mesa_id']
            isOneToOne: false
            referencedRelation: 'mesas'
            referencedColumns: ['id']
          }
        ]
      }
      pedido_itens: {
        Row: PedidoItemRow
        Insert: PedidoItemInsert
        Update: Partial<PedidoItemInsert>
        Relationships: [
          {
            foreignKeyName: 'pedido_itens_pedido_id_fkey'
            columns: ['pedido_id']
            isOneToOne: false
            referencedRelation: 'pedidos'
            referencedColumns: ['id']
          }
        ]
      }
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
      configuracoes: {
        Row: ConfiguracaoRow
        Insert: Omit<ConfiguracaoRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ConfiguracaoRow, 'id' | 'created_at' | 'updated_at'>>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
