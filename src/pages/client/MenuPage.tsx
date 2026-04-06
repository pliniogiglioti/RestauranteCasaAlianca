import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ShoppingCart, MapPin, Clock } from 'lucide-react'
import { BannerSlider } from '@/components/client/BannerSlider'
import { CategoryFilter } from '@/components/client/CategoryFilter'
import { DishCard } from '@/components/client/DishCard'
import { DishOfDay } from '@/components/client/DishOfDay'
import { SearchBar } from '@/components/client/SearchBar'
import { CartDrawer, FloatingCartButton } from '@/components/client/CartDrawer'
import { DishModal } from '@/components/client/DishModal'
import { useCardapio } from '@/hooks/useCardapio'
import { useCart } from '@/hooks/useCart'
import { usePedidoAtivo } from '@/hooks/usePedidoAtivo'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import type { PratoComCategoria } from '@/types'

interface CategoriaGrupo {
  id: string
  nome: string
  icone: string | null
  ordem: number
  pratos: PratoComCategoria[]
}

export function MenuPage() {
  const { slug: _slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { pratos, pratosDoDia, categorias, banners, loading, error } = useCardapio()
  const { mesaNumero, totalItens } = useCart()
  const { pedido } = usePedidoAtivo()
  const { nomeRestaurante } = useConfiguracoes()

  const [search, setSearch] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [selectedPrato, setSelectedPrato] = useState<PratoComCategoria | null>(null)

  const pratosFilter = useMemo(() => {
    return pratos.filter((p) => {
      const matchesSearch =
        !search ||
        p.nome.toLowerCase().includes(search.toLowerCase()) ||
        (p.descricao ?? '').toLowerCase().includes(search.toLowerCase())
      const matchesCategoria = !selectedCategoria || p.categoria_id === selectedCategoria
      return matchesSearch && matchesCategoria
    })
  }, [pratos, search, selectedCategoria])

  const pratosByCategoria = useMemo((): CategoriaGrupo[] => {
    const map = new Map<string, CategoriaGrupo>()

    for (const prato of pratosFilter) {
      if (!prato.categoria_id || !prato.categoria) continue
      const catId = prato.categoria_id
      if (!map.has(catId)) {
        map.set(catId, {
          id: catId,
          nome: prato.categoria.nome,
          icone: prato.categoria.icone ?? null,
          ordem: prato.categoria.ordem ?? 0,
          pratos: [],
        })
      }
      map.get(catId)!.pratos.push(prato as PratoComCategoria)
    }

    return Array.from(map.values()).sort((a, b) => a.ordem - b.ordem)
  }, [pratosFilter])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-brand-600 font-medium underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-28">
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <AppIcon size="sm" />
            <div>
              <p className="text-xs text-gray-500 leading-none">{nomeRestaurante}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-brand-500" />
                <span className="text-xs font-bold text-gray-800">Mesa {mesaNumero || '—'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {pedido && (
              <button
                onClick={() => navigate('/pedido/status')}
                className="flex items-center gap-1.5 bg-[#e8f0ea] border border-[#7ea287] text-[#113917] text-xs font-semibold px-3 py-2 rounded-xl hover:bg-[#dbe9df] active:scale-95 transition-all animate-pulse-soft"
              >
                <Clock size={13} />
                Meu Pedido
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2.5 bg-[#113917] rounded-xl text-white shadow-sm hover:bg-[#0d2e13] active:scale-95 transition-all"
            >
              <ShoppingCart size={18} />
              {totalItens() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#081d0c] text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                  {totalItens() > 9 ? '9+' : totalItens()}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="px-4 pb-3">
          <SearchBar value={search} onChange={setSearch} />
        </div>
      </header>

      {loading ? (
        <SectionLoading />
      ) : (
        <div className="space-y-5 pt-4">
          {banners.length > 0 && <BannerSlider banners={banners} />}

          {categorias.length > 0 && (
            <CategoryFilter
              categorias={categorias}
              selected={selectedCategoria}
              onSelect={setSelectedCategoria}
            />
          )}

          {!search && !selectedCategoria && pratosDoDia.length > 0 && (
            <DishOfDay
              pratos={pratosDoDia as PratoComCategoria[]}
              onDetails={(p) => setSelectedPrato(p as PratoComCategoria)}
            />
          )}

          {pratosByCategoria.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <span className="text-5xl mb-4">🔍</span>
              <p className="text-gray-500 font-medium">Nenhum prato encontrado</p>
              {search && (
                <p className="text-gray-400 text-sm mt-1">
                  Tente buscar por outro nome
                </p>
              )}
            </div>
          ) : (
            pratosByCategoria.map((grupo) => (
              <section key={grupo.id} className="px-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{grupo.icone}</span>
                  <h2 className="text-base font-bold text-gray-800">{grupo.nome}</h2>
                  <div className="flex-1 h-px bg-gray-300" />
                  <span className="text-xs text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {grupo.pratos.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {grupo.pratos.map((prato) => (
                    <DishCard
                      key={prato.id}
                      prato={prato}
                      onDetails={(p) => setSelectedPrato(p as PratoComCategoria)}
                    />
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      )}

      {!cartOpen && <FloatingCartButton onClick={() => setCartOpen(true)} />}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <DishModal prato={selectedPrato} onClose={() => setSelectedPrato(null)} />
    </div>
  )
}
