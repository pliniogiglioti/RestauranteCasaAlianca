import { useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { ShoppingCart, MapPin, UtensilsCrossed } from 'lucide-react'
import { BannerSlider } from '@/components/client/BannerSlider'
import { CategoryFilter } from '@/components/client/CategoryFilter'
import { DishCard } from '@/components/client/DishCard'
import { DishOfDay } from '@/components/client/DishOfDay'
import { SearchBar } from '@/components/client/SearchBar'
import { CartDrawer, FloatingCartButton } from '@/components/client/CartDrawer'
import { DishModal } from '@/components/client/DishModal'
import { useCardapio } from '@/hooks/useCardapio'
import { useCart } from '@/hooks/useCart'
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
  const { pratos, pratosDoDia, categorias, banners, loading, error } = useCardapio()
  const { mesaNumero, totalItens } = useCart()

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
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="bg-white sticky top-0 z-20 shadow-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <UtensilsCrossed size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500 leading-none">Casa Aliança</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-brand-500" />
                <span className="text-xs font-bold text-gray-800">Mesa {mesaNumero || '—'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2.5 bg-brand-500 rounded-xl text-white shadow-sm hover:bg-brand-600 active:scale-95 transition-all"
          >
            <ShoppingCart size={18} />
            {totalItens() > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-md">
                {totalItens() > 9 ? '9+' : totalItens()}
              </span>
            )}
          </button>
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
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
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
