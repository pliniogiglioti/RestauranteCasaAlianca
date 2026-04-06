import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getConfiguracao } from '@/services/configuracoes'

interface ConfigStore {
  id: string | null
  nomeRestaurante: string
  slogan: string
  iconeApp: string
  iconeUrl: string   // URL da imagem PNG (prioridade sobre emoji)
  telefone: string
  endereco: string
  fetch: () => Promise<void>
  setConfig: (c: Partial<Omit<ConfigStore, 'fetch' | 'setConfig'>>) => void
}

export const useConfiguracoes = create<ConfigStore>()(
  persist(
    (set) => ({
      id: null,
  nomeRestaurante: 'Casa Alinça',
      slogan: 'Sabores que aquecem o coração',
      iconeApp: '🍽️',
      iconeUrl: '',
      telefone: '',
      endereco: '',

      fetch: async () => {
        try {
          const data = await getConfiguracao()
          if (!data) return
          set({
            id: data.id,
      nomeRestaurante: data.nome_restaurante || 'Casa Alinça',
            slogan: data.slogan || 'Sabores que aquecem o coração',
            iconeApp: data.icone_app || '🍽️',
            iconeUrl: data.logo_url || '',
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
