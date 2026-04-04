import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, MapPin, UtensilsCrossed, MessageSquare } from 'lucide-react'
import { formatCurrency } from '@/types'
import { useCart } from '@/hooks/useCart'
import { usePedidoAtivo } from '@/hooks/usePedidoAtivo'
import { criarPedido } from '@/services/pedidos'
import toast from 'react-hot-toast'

export function OrderSummaryPage() {
  const navigate = useNavigate()
  const { items, observacaoGeral, mesaId, mesaNumero, mesaSlug, totalValor, clearCart } = useCart()
  const { salvarPedido } = usePedidoAtivo()
  const [loading, setLoading] = useState(false)

  async function handleConfirmar() {
    if (items.length === 0) return

    try {
      setLoading(true)
      const pedido = await criarPedido({
        mesa_id: mesaId,
        observacao_geral: observacaoGeral || undefined,
        itens: items,
      })
      salvarPedido({
        pedidoId: pedido.id,
        mesaId,
        mesaNumero: mesaNumero ?? 0,
        mesaSlug: mesaSlug ?? '',
        criadoEm: new Date().toISOString(),
        status: 'recebido',
      })
      clearCart()
      toast.success('Pedido enviado com sucesso!')
      navigate('/pedido/status', { replace: true })
    } catch {
      toast.error('Erro ao enviar o pedido. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (items.length === 0) {
    navigate(-1)
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">Resumo do Pedido</h1>
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin size={10} className="text-brand-500" />
              <span className="text-xs text-gray-500">Mesa {mesaNumero}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto p-4 pb-32 space-y-4">
        {/* Itens */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
          <div className="px-4 py-3 border-b border-gray-50">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
              <UtensilsCrossed size={15} className="text-brand-500" />
              Itens do Pedido
            </h2>
          </div>

          <div className="divide-y divide-gray-50">
            {items.map((item) => (
              <div key={item.prato.id} className="px-4 py-3">
                <div className="flex gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    {item.prato.imagem_url ? (
                      <img
                        src={item.prato.imagem_url}
                        alt={item.prato.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {item.prato.nome}
                      </p>
                      <span className="text-brand-600 font-bold text-sm shrink-0">
                        {formatCurrency(item.prato.preco * item.quantidade)}
                      </span>
                    </div>
                    <p className="text-gray-400 text-xs mt-0.5">
                      {item.quantidade}x {formatCurrency(item.prato.preco)}
                    </p>
                    {item.observacao && (
                      <p className="text-gray-500 text-xs mt-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                        💬 {item.observacao}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Observação geral */}
        {observacaoGeral && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-2">
              <MessageSquare size={15} className="text-brand-500" />
              Observação Geral
            </h3>
            <p className="text-gray-600 text-sm bg-gray-50 rounded-xl px-3 py-2">
              {observacaoGeral}
            </p>
          </div>
        )}

        {/* Total */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Subtotal</span>
            <span className="text-gray-900 font-semibold">{formatCurrency(totalValor())}</span>
          </div>
          <div className="border-t border-gray-100 mt-3 pt-3 flex items-center justify-between">
            <span className="text-gray-900 font-bold text-lg">Total</span>
            <span className="text-brand-600 font-black text-2xl">{formatCurrency(totalValor())}</span>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 shadow-lg">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleConfirmar}
            disabled={loading}
            className="w-full bg-brand-500 hover:bg-brand-600 active:brand-700 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Confirmar Pedido
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
