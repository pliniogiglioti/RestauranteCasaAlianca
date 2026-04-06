import { X, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useEffect } from 'react'
import { formatCurrency } from '@/types'
import type { Prato } from '@/types'
import { useCart } from '@/hooks/useCart'

interface DishModalProps {
  prato: Prato & { categoria?: { nome: string; icone?: string | null } | null } | null
  onClose: () => void
}

export function DishModal({ prato, onClose }: DishModalProps) {
  const { items, addItem, updateQuantidade } = useCart()

  useEffect(() => {
    if (prato) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [prato])

  if (!prato) return null

  const cartItem = items.find((i) => i.prato.id === prato.id)
  const quantidade = cartItem?.quantidade ?? 0

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="relative bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up shadow-2xl max-h-[92vh] flex flex-col">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Image */}
        <div className="aspect-[16/9] w-full shrink-0 overflow-hidden">
          {prato.imagem_url ? (
            <img
              src={prato.imagem_url}
              alt={prato.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-6xl">
              🍽️
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {prato.categoria && (
            <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full">
              {prato.categoria.icone} {prato.categoria.nome}
            </span>
          )}
          <h2 className="font-bold text-gray-900 text-2xl font-display mt-2 leading-tight">
            {prato.nome}
          </h2>
          {prato.descricao && (
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{prato.descricao}</p>
          )}
          <p className="text-brand-600 font-bold text-2xl mt-4">
            {formatCurrency(prato.preco)}
          </p>
        </div>

        {/* Actions */}
        <div className="p-5 border-t border-gray-100 bg-white">
          {quantidade > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 bg-brand-50 rounded-2xl p-2">
                <button
                  onClick={() => updateQuantidade(prato.id, quantidade - 1)}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-95 transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="text-brand-700 font-bold text-lg w-8 text-center">
                  {quantidade}
                </span>
                <button
                  onClick={() => addItem(prato)}
                  className="w-10 h-10 rounded-xl bg-[#113917] shadow-sm flex items-center justify-center text-white hover:bg-[#0d2e13] active:scale-95 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-brand-600 font-bold text-lg">
                  {formatCurrency(prato.preco * quantidade)}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => addItem(prato)}
              className="w-full bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Adicionar ao Pedido
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
