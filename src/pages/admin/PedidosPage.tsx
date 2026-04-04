import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Eye, Clock, ChevronDown } from 'lucide-react'
import { getPedidos, atualizarStatusPedido } from '@/services/pedidos'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { formatCurrency, STATUS_PEDIDO } from '@/types'
import type { PedidoCompleto, StatusPedido } from '@/types'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = STATUS_PEDIDO

export function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusPedido | 'todos'>('todos')
  const [detailPedido, setDetailPedido] = useState<PedidoCompleto | null>(null)

  const carregar = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true)
      else setRefreshing(true)
      const data = await getPedidos()
      setPedidos(data as PedidoCompleto[])
    } catch {
      toast.error('Erro ao carregar pedidos')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    carregar()
    // Auto-refresh every 30s
    const interval = setInterval(() => carregar(true), 30000)
    return () => clearInterval(interval)
  }, [carregar])

  async function handleStatusChange(pedidoId: string, status: StatusPedido) {
    try {
      await atualizarStatusPedido(pedidoId, status)
      setPedidos((prev) =>
        prev.map((p) => (p.id === pedidoId ? { ...p, status } : p))
      )
      if (detailPedido?.id === pedidoId) {
        setDetailPedido((prev) => prev ? { ...prev, status } : prev)
      }
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const pedidosFiltrados = statusFilter === 'todos'
    ? pedidos
    : pedidos.filter((p) => p.status === statusFilter)

  const contadores = STATUS_PEDIDO.reduce((acc, s) => {
    acc[s.value] = pedidos.filter((p) => p.status === s.value).length
    return acc
  }, {} as Record<string, number>)

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        subtitle="Gerencie os pedidos do restaurante"
        action={
          <Button
            variant="outline"
            onClick={() => carregar(true)}
            loading={refreshing}
          >
            <RefreshCw size={15} />
            Atualizar
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setStatusFilter('todos')}
          className={`flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
            statusFilter === 'todos'
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          Todos ({pedidos.length})
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              statusFilter === s.value
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {s.label} ({contadores[s.value] ?? 0})
          </button>
        ))}
      </div>

      {/* Pedidos list */}
      {pedidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.map((pedido) => (
            <div
              key={pedido.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4 px-4 py-4">
                {/* Mesa */}
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-brand-500 font-medium leading-none">Mesa</span>
                  <span className="text-brand-700 font-black text-lg leading-tight">
                    {pedido.mesa?.numero ?? '?'}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">
                      Pedido #{pedido.id.split('-')[0].toUpperCase()}
                    </span>
                    <StatusBadge status={pedido.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">
                      {new Date(pedido.created_at).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      {pedido.itens?.length ?? 0} ite{(pedido.itens?.length ?? 0) !== 1 ? 'ns' : 'm'}
                    </span>
                  </div>
                </div>

                {/* Total */}
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatCurrency(pedido.valor_total)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setDetailPedido(pedido)}
                    className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-gray-200 hover:border-brand-200"
                  >
                    <Eye size={15} />
                  </button>

                  <div className="relative group">
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:border-brand-300 text-gray-700 hover:text-brand-700 transition-colors bg-white">
                      Alterar
                      <ChevronDown size={13} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 z-20 hidden group-hover:block">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          onClick={() => handleStatusChange(pedido.id, s.value)}
                          className={`w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl ${
                            pedido.status === s.value ? 'text-brand-600 font-semibold bg-brand-50' : 'text-gray-700'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pedido detail modal */}
      <Modal
        isOpen={!!detailPedido}
        onClose={() => setDetailPedido(null)}
        title={`Pedido #${detailPedido?.id.split('-')[0].toUpperCase() ?? ''}`}
        size="lg"
      >
        {detailPedido && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Mesa</p>
                <p className="font-bold text-gray-900">Mesa {detailPedido.mesa?.numero ?? 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Status</p>
                <StatusBadge status={detailPedido.status} />
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Data/Hora</p>
                <p className="font-semibold text-gray-900 text-sm">
                  {new Date(detailPedido.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-0.5">Total</p>
                <p className="font-bold text-brand-600">{formatCurrency(detailPedido.valor_total)}</p>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Itens</h3>
              <div className="space-y-2">
                {detailPedido.itens?.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">
                        <span className="text-brand-600 font-bold">{item.quantidade}x</span> {item.nome_prato}
                      </p>
                      {item.observacao_item && (
                        <p className="text-xs text-gray-500 mt-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">
                          💬 {item.observacao_item}
                        </p>
                      )}
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Observação geral */}
            {detailPedido.observacao_geral && (
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Observação Geral</h3>
                <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3">
                  {detailPedido.observacao_geral}
                </p>
              </div>
            )}

            {/* Change status */}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Alterar Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STATUS_OPTIONS.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => handleStatusChange(detailPedido.id, s.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                      detailPedido.status === s.value
                        ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
