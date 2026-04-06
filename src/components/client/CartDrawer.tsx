import { Minus, Plus, Trash2, ShoppingCart, MessageSquare, Zap } from 'lucide-react'
import { formatCurrency } from '@/types'
import { useCart } from '@/hooks/useCart'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBebidasParaUpsell } from '@/services/pratos'
import type { PratoComCategoria } from '@/types'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    observacaoGeral,
    mesaNumero,
    updateQuantidade,
    removeItem,
    updateObservacaoItem,
    setObservacaoGeral,
    totalValor,
    totalItens,
  } = useCart()
  const [editingObs, setEditingObs] = useState<string | null>(null)
  const touchStartY = useRef<number | null>(null)
  const touchCurrentY = useRef<number | null>(null)
  const navigate = useNavigate()

  function handleFinalizar() {
    onClose()
    navigate('/pedido/resumo')
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartY.current = e.touches[0]?.clientY ?? null
    touchCurrentY.current = touchStartY.current
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    touchCurrentY.current = e.touches[0]?.clientY ?? null
  }

  function handleTouchEnd() {
    if (touchStartY.current === null || touchCurrentY.current === null) return
    const deltaY = touchCurrentY.current - touchStartY.current
    if (deltaY > 70) onClose()
    touchStartY.current = null
    touchCurrentY.current = null
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 w-full max-h-[88vh] bg-white z-50 shadow-2xl
          flex flex-col transition-transform duration-300 ease-out
          rounded-t-[32px] overflow-hidden
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
        `}
      >
        <div
          className="flex justify-center pt-3 pb-2 bg-white shrink-0 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-500" />
            <h2 className="font-bold text-gray-900">Seu Pedido</h2>
            {totalItens() > 0 && (
              <span className="bg-brand-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {totalItens()}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {mesaNumero > 0 && (
              <span className="text-xs bg-brand-50 text-brand-700 font-semibold px-2.5 py-1 rounded-full border border-brand-200">
                Mesa {mesaNumero}
              </span>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ShoppingCart size={24} className="text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">Seu carrinho está vazio</p>
              <p className="text-gray-400 text-sm mt-1">Adicione pratos para continuar</p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {/* Items */}
              {items.map((item) => (
                <div key={item.prato.id} className="bg-gray-50 rounded-2xl p-3">
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      {item.prato.imagem_url ? (
                        <img
                          src={item.prato.imagem_url}
                          alt={item.prato.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-100 flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {item.prato.nome}
                      </h4>
                      <p className="text-brand-600 font-bold text-sm mt-0.5">
                        {formatCurrency(item.prato.preco * item.quantidade)}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {formatCurrency(item.prato.preco)} cada
                      </p>
                    </div>

                    <button
                      onClick={() => removeItem(item.prato.id)}
                      className="p-1.5 text-gray-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 bg-white rounded-full shadow-sm border border-gray-200 p-1">
                      <button
                        onClick={() => updateQuantidade(item.prato.id, item.quantidade - 1)}
                        className="w-6 h-6 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 hover:bg-brand-100 active:scale-95 transition-all"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-gray-900 font-bold text-sm w-5 text-center">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() => updateQuantidade(item.prato.id, item.quantidade + 1)}
                        className="w-6 h-6 rounded-full bg-[#113917] flex items-center justify-center text-white hover:bg-[#0d2e13] active:scale-95 transition-all"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <button
                      onClick={() =>
                        setEditingObs(editingObs === item.prato.id ? null : item.prato.id)
                      }
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full transition-colors ${
                        item.observacao
                          ? 'bg-brand-100 text-brand-700'
                          : 'text-gray-500 hover:text-brand-600 hover:bg-brand-50'
                      }`}
                    >
                      <MessageSquare size={11} />
                      {item.observacao ? 'Obs.' : 'Adicionar obs.'}
                    </button>
                  </div>

                  {editingObs === item.prato.id && (
                    <textarea
                      className="w-full mt-2 text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                      placeholder="Ex: sem cebola, bem passado..."
                      rows={2}
                      value={item.observacao}
                      onChange={(e) => updateObservacaoItem(item.prato.id, e.target.value)}
                    />
                  )}
                </div>
              ))}

              {/* ─── Upsell: Bebidas ────────────────────────── */}
              <UpsellBebidas />

              {/* Observação geral */}
              <div className="bg-gray-50 rounded-2xl p-3">
                <label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5 mb-2">
                  <MessageSquare size={12} />
                  Observação Geral (opcional)
                </label>
                <textarea
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-brand-400 bg-white"
                  placeholder="Alguma informação geral sobre o pedido..."
                  rows={2}
                  value={observacaoGeral}
                  onChange={(e) => setObservacaoGeral(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-gray-100 bg-white space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-gray-600 font-medium">Total</span>
              <span className="text-brand-600 font-bold text-xl">
                {formatCurrency(totalValor())}
              </span>
            </div>
            <button
              onClick={handleFinalizar}
              className="w-full bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 active:scale-[0.98] transition-all text-base"
            >
              Finalizar Pedido
            </button>
          </div>
        )}
      </div>
    </>
  )
}

// ─── Upsell Bebidas Carousel ─────────────────────────────────
function UpsellBebidas() {
  const [bebidas, setBebidas] = useState<PratoComCategoria[]>([])
  const { items, addItem } = useCart()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getBebidasParaUpsell()
      .then(setBebidas)
      .catch(() => {/* silencioso */})
  }, [])

  // Filtra bebidas que já estão no carrinho para não duplicar no upsell
  const bebidasParaMostrar = bebidas.filter(
    (b) => !items.some((i) => i.prato.id === b.id)
  )

  if (bebidasParaMostrar.length === 0) return null

  return (
              <div className="rounded-2xl overflow-hidden border border-brand-200 bg-gradient-to-r from-brand-50 to-brand-100">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <div className="w-5 h-5 rounded-full bg-brand-500 flex items-center justify-center">
          <Zap size={11} className="text-white" />
        </div>
        <p className="text-xs font-bold text-gray-800">Adicionar bebida?</p>
        <span className="text-xs text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full font-medium ml-auto">
          Mais pedidas
        </span>
      </div>

      {/* Scroll carousel */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 overflow-x-auto px-3 pb-3 scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {bebidasParaMostrar.map((bebida, index) => (
          <DrinkCard key={bebida.id} bebida={bebida} index={index} onAdd={addItem} />
        ))}
      </div>
    </div>
  )
}

function DrinkCard({
  bebida,
  index,
  onAdd,
}: {
  bebida: PratoComCategoria
  index: number
  onAdd: (prato: PratoComCategoria) => void
}) {
  const [added, setAdded] = useState(false)

  function handleAdd() {
    onAdd(bebida)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <div className="flex-none w-28 bg-white rounded-xl overflow-hidden shadow-sm border border-brand-100">
      {/* Rank badge para os 3 primeiros */}
      <div className="relative">
        <div className="aspect-square overflow-hidden bg-gray-100">
          {bebida.imagem_url ? (
            <img
              src={bebida.imagem_url}
              alt={bebida.nome}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-3xl bg-gradient-to-br from-blue-50 to-blue-100">
              🥤
            </div>
          )}
        </div>

        {index < 3 && (
          <div className="absolute top-1 left-1 bg-brand-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
            #{index + 1}
          </div>
        )}
      </div>

      <div className="p-2">
        <p className="text-gray-800 text-xs font-semibold line-clamp-2 leading-tight min-h-[2rem]">
          {bebida.nome}
        </p>
        <p className="text-brand-600 font-bold text-xs mt-1">
          {formatCurrency(bebida.preco)}
        </p>
        <button
          onClick={handleAdd}
          className={`
            w-full mt-2 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95
            ${added
              ? 'bg-[#4f7a5c] text-white'
              : 'bg-[#113917] hover:bg-[#0d2e13] text-white'
            }
          `}
        >
          {added ? '✓ Adicionado' : '+ Adicionar'}
        </button>
      </div>
    </div>
  )
}

// ─── Floating Cart Button ─────────────────────────────────────
interface FloatingCartButtonProps {
  onClick: () => void
}

export function FloatingCartButton({ onClick }: FloatingCartButtonProps) {
  const { totalItens, totalValor } = useCart()
  const count = totalItens()

  if (count === 0) return null

  return (
    <div className="fixed bottom-6 left-4 right-4 z-30 animate-slide-up">
      <button
        onClick={onClick}
        className="w-full bg-[#113917] hover:bg-[#0d2e13] active:bg-[#081d0c] text-white font-bold py-4 px-5 rounded-2xl shadow-xl shadow-brand-300/50 active:scale-[0.98] transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-full w-7 h-7 flex items-center justify-center">
            <span className="text-xs font-black">{count}</span>
          </div>
          <span>Ver Carrinho</span>
        </div>
        <span className="font-bold">{formatCurrency(totalValor())}</span>
      </button>
    </div>
  )
}
