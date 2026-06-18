import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LojaStore {
  lojaId: string | null
  lojaSlug: string | null
  lojaNome: string | null
  setLoja: (id: string, slug: string, nome: string) => void
  clearLoja: () => void
}

function syncElectron(lojaId: string | null) {
  if (typeof window !== 'undefined' && window.electronAPI?.setLoja) {
    void window.electronAPI.setLoja(lojaId ?? '')
  }
}

export const useLoja = create<LojaStore>()(
  persist(
    (set) => ({
      lojaId: null,
      lojaSlug: null,
      lojaNome: null,
      setLoja: (id, slug, nome) => {
        set({ lojaId: id, lojaSlug: slug, lojaNome: nome })
        syncElectron(id)
      },
      clearLoja: () => {
        set({ lojaId: null, lojaSlug: null, lojaNome: null })
        syncElectron(null)
      },
    }),
    { name: 'loja-selecionada' }
  )
)
