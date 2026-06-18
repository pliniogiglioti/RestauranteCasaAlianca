import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Prato } from '@/types'
import { getPrecoVigente } from '@/lib/pricing'

interface CartStore {
  items: CartItem[]
  observacaoGeral: string
  mesaId: string
  mesaNumero: number
  mesaSlug: string
  nomeCliente: string
  lojaId: string
  lojaSlug: string

  setMesa: (id: string, numero: number, slug: string) => void
  setLoja: (id: string, slug: string) => void
  setNomeCliente: (nome: string) => void
  addItem: (prato: Prato) => void
  removeItem: (pratoId: string) => void
  updateQuantidade: (pratoId: string, quantidade: number) => void
  updateObservacaoItem: (pratoId: string, observacao: string) => void
  setObservacaoGeral: (observacao: string) => void
  clearCart: () => void

  totalItens: () => number
  totalValor: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      observacaoGeral: '',
      mesaId: '',
      mesaNumero: 0,
      mesaSlug: '',
      nomeCliente: '',
      lojaId: '',
      lojaSlug: '',

      setMesa: (id, numero, slug) =>
        set({ mesaId: id, mesaNumero: numero, mesaSlug: slug }),

      setLoja: (id, slug) => set({ lojaId: id, lojaSlug: slug }),

      setNomeCliente: (nome) => set({ nomeCliente: nome }),

      addItem: (prato) => {
        const items = get().items
        const existing = items.find((i) => i.prato.id === prato.id)

        if (existing) {
          set({
            items: items.map((i) =>
              i.prato.id === prato.id
                ? { ...i, quantidade: i.quantidade + 1 }
                : i
            ),
          })
        } else {
          set({ items: [...items, { prato, quantidade: 1, observacao: '' }] })
        }
      },

      removeItem: (pratoId) =>
        set({ items: get().items.filter((i) => i.prato.id !== pratoId) }),

      updateQuantidade: (pratoId, quantidade) => {
        if (quantidade <= 0) {
          get().removeItem(pratoId)
          return
        }
        set({
          items: get().items.map((i) =>
            i.prato.id === pratoId ? { ...i, quantidade } : i
          ),
        })
      },

      updateObservacaoItem: (pratoId, observacao) =>
        set({
          items: get().items.map((i) =>
            i.prato.id === pratoId ? { ...i, observacao } : i
          ),
        }),

      setObservacaoGeral: (observacaoGeral) => set({ observacaoGeral }),

      clearCart: () =>
        set({ items: [], observacaoGeral: '' }),

      totalItens: () =>
        get().items.reduce((acc, i) => acc + i.quantidade, 0),

      totalValor: () =>
        get().items.reduce((acc, i) => acc + getPrecoVigente(i.prato) * i.quantidade, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
)
