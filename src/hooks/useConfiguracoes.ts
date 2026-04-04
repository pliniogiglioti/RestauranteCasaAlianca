import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getConfiguracao } from '@/services/configuracoes'

interface ConfigStore {
  id: string | null
  nomeRestaurante: string
  slogan: string
  iconeApp: string
  telefone: string
  endereco: string
  fetch: () => Promise<void>
  setConfig: (c: Partial<Omit<ConfigStore, 'fetch' | 'setConfig'>>) => void
}

export const useConfiguracoes = create<ConfigStore>()(
  persist(
    (set) => ({
      id: null,
      nomeRestaurante: 'Casa Aliança',
      slogan: 'Sabores que aquecem o coração',
      iconeApp: '🍽️',
      telefone: '',
      endereco: '',

      fetch: async () => {
        try {
          const data = await getConfiguracao()
          if (!data) return
          set({
            id: data.id,
            nomeRestaurante: data.nome_restaurante || 'Casa Aliança',
            slogan: data.slogan || 'Sabores que aquecem o coração',
            iconeApp: data.icone_app || '🍽️',
            telefone: data.telefone || '',
            endereco: data.endereco || '',
          })
        } catch {
          // mantém valores do cache persistido
        }
      },

      setConfig: (c) => set(c),
    }),
    { name: 'restaurante-config' }
  )
)
