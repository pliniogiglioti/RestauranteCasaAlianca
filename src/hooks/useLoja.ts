import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LojaStore {
  lojaId: string | null
  lojaSlug: string | null
  lojaNome: string | null
  setLoja: (id: string, slug: string, nome: string) => void
  clearLoja: () => void
}

export const useLoja = create<LojaStore>()(
  persist(
    (set) => ({
      lojaId: null,
      lojaSlug: null,
      lojaNome: null,
      setLoja: (id, slug, nome) => set({ lojaId: id, lojaSlug: slug, lojaNome: nome }),
      clearLoja: () => set({ lojaId: null, lojaSlug: null, lojaNome: null }),
    }),
    { name: 'loja-selecionada' }
  )
)
