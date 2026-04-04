import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { StatusPedido } from '@/types'

interface PedidoAtivo {
  pedidoId: string
  mesaId: string
  mesaNumero: number
  mesaSlug: string
  criadoEm: string
  status: StatusPedido
}

interface PedidoAtivoStore {
  pedido: PedidoAtivo | null
  salvarPedido: (p: PedidoAtivo) => void
  atualizarStatus: (status: StatusPedido) => void
  limparPedido: () => void
}

export const usePedidoAtivo = create<PedidoAtivoStore>()(
  persist(
    (set, get) => ({
      pedido: null,
      salvarPedido: (pedido) => set({ pedido }),
      atualizarStatus: (status) => {
        const pedido = get().pedido
        if (pedido) set({ pedido: { ...pedido, status } })
      },
      limparPedido: () => set({ pedido: null }),
    }),
    { name: 'pedido-ativo' }
  )
)
