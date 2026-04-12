import { Plus, Minus, ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { AppDrawer } from '@/components/ui/Drawer'
import { useCart } from '@/hooks/useCart'
import { formatCurrency } from '@/types'
import type { Prato } from '@/types'
import { getPrecoVigente, isPromocaoAtiva } from '@/lib/pricing'

interface DishModalProps {
  prato: (Prato & { categoria?: { nome: string; icone?: string | null } | null }) | null
  onClose: () => void
}

export function DishModal({ prato, onClose }: DishModalProps) {
  const { items, addItem, updateQuantidade } = useCart()
  const [visiblePrato, setVisiblePrato] = useState<DishModalProps['prato']>(prato)

  useEffect(() => {
    if (prato) {
      setVisiblePrato(prato)
    }
  }, [prato])

  const pratoAtual = visiblePrato ?? prato

  if (!pratoAtual) return null

  const cartItem = items.find((i) => i.prato.id === pratoAtual.id)
  const quantidade = cartItem?.quantidade ?? 0
  const precoVigente = getPrecoVigente(pratoAtual)
  const promocaoAtiva = isPromocaoAtiva(pratoAtual)

  return (
    <AppDrawer
      open={!!prato}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      onAnimationEnd={(open) => {
        if (!open) setVisiblePrato(null)
      }}
      direction="bottom"
      title={pratoAtual.nome}
      description={pratoAtual.descricao ?? 'Detalhes do prato selecionado.'}
      contentClassName="mx-auto w-full max-w-lg max-h-[92vh] overflow-hidden rounded-t-[32px] sm:bottom-4 sm:rounded-[32px]"
      showHandle
    >
      <div className="relative flex h-full flex-col">
        <div className="aspect-[16/9] w-full shrink-0 overflow-hidden">
          {pratoAtual.imagem_url ? (
            <img
              src={pratoAtual.imagem_url}
              alt={pratoAtual.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-sm font-semibold text-brand-700">
              Sem foto
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {pratoAtual.categoria && (
            <span className="text-xs text-brand-600 font-semibold bg-brand-50 px-2.5 py-1 rounded-full">
              {pratoAtual.categoria.icone} {pratoAtual.categoria.nome}
            </span>
          )}
          <h2 className="font-bold text-gray-900 text-2xl font-display mt-2 leading-tight">
            {pratoAtual.nome}
          </h2>
          {pratoAtual.descricao && (
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">{pratoAtual.descricao}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {promocaoAtiva && (
              <span className="text-base font-semibold text-gray-400 line-through">
                {formatCurrency(pratoAtual.preco)}
              </span>
            )}
            <p className={`font-bold text-2xl ${promocaoAtiva ? 'text-green-600' : 'text-brand-600'}`}>
              {formatCurrency(precoVigente)}
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 bg-white">
          {quantidade > 0 ? (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 bg-brand-50 rounded-2xl p-2">
                <button
                  onClick={() => updateQuantidade(pratoAtual.id, quantidade - 1)}
                  className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-95 transition-all"
                >
                  <Minus size={16} />
                </button>
                <span className="text-brand-700 font-bold text-lg w-8 text-center">
                  {quantidade}
                </span>
                <button
                  onClick={() => addItem(pratoAtual)}
                  className="w-10 h-10 rounded-xl bg-[#113917] shadow-sm flex items-center justify-center text-white hover:bg-[#0d2e13] active:scale-95 transition-all"
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Total</p>
                <p className="text-brand-600 font-bold text-lg">
                  {formatCurrency(precoVigente * quantidade)}
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => addItem(pratoAtual)}
              className="w-full bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <ShoppingCart size={18} />
              Adicionar ao Pedido
            </button>
          )}
        </div>
      </div>
    </AppDrawer>
  )
}
