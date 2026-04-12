import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { formatCurrency } from '@/types'
import type { Prato } from '@/types'
import { useCart } from '@/hooks/useCart'
import { getPrecoVigente, isPromocaoAtiva } from '@/lib/pricing'

interface DishCardProps {
  prato: Prato & { categoria?: { nome: string; icone?: string | null } | null }
  onDetails?: (prato: Prato) => void
}

export function DishCard({ prato, onDetails }: DishCardProps) {
  const { items, addItem, updateQuantidade } = useCart()
  const cartItem = items.find((i) => i.prato.id === prato.id)
  const quantidade = cartItem?.quantidade ?? 0
  const precoVigente = getPrecoVigente(prato)
  const promocaoAtiva = isPromocaoAtiva(prato)

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div
        className="relative aspect-[4/3] cursor-pointer overflow-hidden"
        onClick={() => onDetails?.(prato)}
      >
        {prato.imagem_url ? (
          <img
            src={prato.imagem_url}
            alt={prato.nome}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}

        {/* Category badge */}
        {prato.categoria && (
          <div className="absolute top-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium px-2 py-1 rounded-full shadow-sm">
              {prato.categoria.icone} {prato.categoria.nome}
            </span>
          </div>
        )}

        {promocaoAtiva && (
          <div className="absolute right-2 top-2">
            <span className="rounded-full bg-green-600 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
              Promocao
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3">
        <h3
          className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 cursor-pointer hover:text-brand-600 transition-colors"
          onClick={() => onDetails?.(prato)}
        >
          {prato.nome}
        </h3>
        {prato.descricao && (
          <p className="text-gray-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {prato.descricao}
          </p>
        )}

        <div className="mt-3">
          <div className="flex flex-wrap items-center gap-2">
            {promocaoAtiva && (
              <span className="text-xs font-semibold text-gray-400 line-through">
                {formatCurrency(prato.preco)}
              </span>
            )}
            <span className={`font-bold text-base ${promocaoAtiva ? 'text-green-600' : 'text-brand-600'}`}>
              {formatCurrency(precoVigente)}
            </span>
          </div>

          {/* Cart controls */}
          {quantidade > 0 ? (
            <div className="flex items-center gap-2 bg-brand-50 rounded-full p-1 mt-2 w-fit">
              <button
                onClick={() => updateQuantidade(prato.id, quantidade - 1)}
                className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-95 transition-all"
              >
                <Minus size={12} />
              </button>
              <span className="text-brand-700 font-bold text-sm w-4 text-center">
                {quantidade}
              </span>
              <button
                onClick={() => addItem(prato)}
                className="w-7 h-7 rounded-full bg-[#113917] shadow-sm flex items-center justify-center text-white hover:bg-[#0d2e13] active:scale-95 transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => addItem(prato)}
              className="flex items-center gap-1.5 bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white text-xs font-medium px-3 py-2 rounded-full shadow-sm active:scale-95 transition-all mt-2 w-fit"
            >
              <ShoppingCart size={12} />
              Adicionar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
