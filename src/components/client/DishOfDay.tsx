import { Star, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '@/types'
import type { Prato } from '@/types'
import { useCart } from '@/hooks/useCart'
import { getPrecoVigente, isPromocaoAtiva } from '@/lib/pricing'

type PratoComCategoria = Prato & { categoria?: { nome: string; icone?: string | null } | null }

interface DishOfDayProps {
  pratos: PratoComCategoria[]
  onDetails?: (prato: Prato) => void
}

export function DishOfDay({ pratos, onDetails }: DishOfDayProps) {
  if (pratos.length === 0) return null

  return (
    <section className="px-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1.5 bg-gradient-to-r from-brand-500 to-brand-600 text-white px-3 py-1 rounded-full shadow-sm shadow-brand-200">
          <Star size={12} className="fill-current" />
          <span className="text-xs font-bold">Prato do Dia</span>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-brand-200 to-transparent" />
      </div>

      <div className="space-y-3">
        {pratos.map((prato) => (
          <DishOfDayCard key={prato.id} prato={prato} onDetails={onDetails} />
        ))}
      </div>
    </section>
  )
}

function DishOfDayCard({
  prato,
  onDetails,
}: {
  prato: PratoComCategoria
  onDetails?: (prato: Prato) => void
}) {
  const { items, addItem, updateQuantidade } = useCart()
  const cartItem = items.find((i) => i.prato.id === prato.id)
  const quantidade = cartItem?.quantidade ?? 0
  const precoVigente = getPrecoVigente(prato)
  const promocaoAtiva = isPromocaoAtiva(prato)

  return (
    <div
      className="relative bg-gradient-to-br from-white to-brand-50 rounded-2xl overflow-hidden border border-brand-100 shadow-sm cursor-pointer"
      onClick={() => onDetails?.(prato)}
    >
      {/* Badge */}
      <div className="absolute top-3 right-3 z-10">
        <div className="bg-gradient-to-r from-brand-500 to-brand-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
          <Star size={10} className="fill-current" />
          Destaque
        </div>
      </div>

      <div className="flex gap-0">
        {/* Image */}
        <div className="w-36 shrink-0 aspect-square sm:w-44">
          {prato.imagem_url ? (
            <img
              src={prato.imagem_url}
              alt={prato.nome}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-orange-100 flex items-center justify-center">
              <span className="text-5xl">⭐</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
          <div>
            {prato.categoria && (
              <span className="text-xs text-brand-700 font-medium">
                {prato.categoria.icone} {prato.categoria.nome}
              </span>
            )}
            <h3 className="font-bold text-gray-900 text-base leading-tight mt-1 line-clamp-2">
              {prato.nome}
            </h3>
            {prato.descricao && (
              <p className="text-gray-500 text-xs mt-1 line-clamp-2">{prato.descricao}</p>
            )}
          </div>

          <div className="flex items-center justify-between mt-3 gap-2">
            <div className="flex flex-col">
              {promocaoAtiva && (
                <span className="text-xs font-semibold text-gray-400 line-through">
                  {formatCurrency(prato.preco)}
                </span>
              )}
              <span className={`font-bold text-lg ${promocaoAtiva ? 'text-green-600' : 'text-brand-600'}`}>
                {formatCurrency(precoVigente)}
              </span>
            </div>

            {quantidade > 0 ? (
              <div
                className="flex items-center gap-2 bg-white rounded-full p-1 shadow-sm border border-brand-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => updateQuantidade(prato.id, quantidade - 1)}
                  className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 hover:bg-brand-200 active:scale-95 transition-all"
                >
                  <Minus size={12} />
                </button>
                <span className="text-brand-700 font-bold text-sm w-4 text-center">
                  {quantidade}
                </span>
                <button
                  onClick={() => addItem(prato)}
                  className="w-7 h-7 rounded-full bg-[#113917] flex items-center justify-center text-white hover:bg-[#0d2e13] active:scale-95 transition-all"
                >
                  <Plus size={12} />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  addItem(prato)
                }}
                className="bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white text-xs font-bold px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all flex items-center gap-1"
              >
                <Plus size={13} />
                Pedir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
