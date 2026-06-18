import { useState, useEffect, useCallback } from 'react'
import { getPratosAtivos, getPratoDodia } from '@/services/pratos'
import { getCategoriasAtivas } from '@/services/categorias'
import { getBannersAtivos } from '@/services/banners'
import { getDiaSemanaAtual } from '@/types'
import type { Categoria, Banner, PratoComCategoria } from '@/types'

export function useCardapio(lojaId?: string | null) {
  const [pratos, setPratos] = useState<PratoComCategoria[]>([])
  const [pratosDoDia, setPratosDoDia] = useState<PratoComCategoria[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true)
      const [pratosData, categoriaData, bannersData, pratoDoDiaData] = await Promise.all([
        getPratosAtivos(lojaId),
        getCategoriasAtivas(lojaId),
        getBannersAtivos(lojaId),
        getPratoDodia(getDiaSemanaAtual(), lojaId),
      ])

      setPratos(pratosData)
      setCategorias(categoriaData)
      setBanners(bannersData)
      setPratosDoDia(pratoDoDiaData)
    } catch {
      setError('Erro ao carregar o cardápio. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [lojaId])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  return {
    pratos,
    pratosDoDia,
    categorias,
    banners,
    loading,
    error,
    recarregar: carregarDados,
  }
}
