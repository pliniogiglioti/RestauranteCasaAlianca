import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface PedidoAtivo {
  pedidoId: string
  mesaId: string
  mesaNumero: number
  mesaSlug: string
  criadoEm: string
}

interface PedidoAtivoStore {
  pedido: PedidoAtivo | null
  salvarPedido: (p: PedidoAtivo) => void
  limparPedido: () => void
}

export const usePedidoAtivo = create<PedidoAtivoStore>()(
  persist(
    (set) => ({
      pedido: null,
      salvarPedido: (pedido) => set({ pedido }),
      limparPedido: () => set({ pedido: null }),
    }),
    { name: 'pedido-ativo' }
  )
)
