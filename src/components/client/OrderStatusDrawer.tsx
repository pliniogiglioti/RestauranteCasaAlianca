import { useEffect, useState } from 'react'
import {
  X,
  Clock,
  ChefHat,
  CheckCircle,
  Utensils,
  PartyPopper,
  RefreshCw,
  UtensilsCrossed,
  MapPin,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { usePedidoAtivo } from '@/hooks/usePedidoAtivo'
import type { StatusPedido } from '@/types'
import { formatCurrency } from '@/types'

interface OrderStatusDrawerProps {
  isOpen: boolean
  onClose: () => void
}

interface StatusConfig {
  label: string
  descricao: string
  icon: React.ReactNode
  color: string
  bg: string
  border: string
  pulse: boolean
}

const STATUS_CONFIG: Record<StatusPedido, StatusConfig> = {
  recebido: {
    label: 'Pedido Recebido',
    descricao: 'Seu pedido chegou à cozinha!',
    icon: <Clock size={24} />,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    pulse: true,
  },
  em_preparo: {
    label: 'Em Preparo',
    descricao: 'Nossos chefs estão preparando seu pedido com carinho.',
    icon: <ChefHat size={24} />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    pulse: true,
  },
  pronto: {
    label: 'Pronto!',
    descricao: 'Seu pedido está pronto e sera entregue em breve.',
    icon: <CheckCircle size={24} />,
    color: 'text-green-600',
    bg: 'bg-green-50',
    border: 'border-green-200',
    pulse: true,
  },
  entregue: {
    label: 'Entregue na Mesa',
    descricao: 'Bom apetite! Aproveite seu pedido.',
    icon: <Utensils size={24} />,
    color: 'text-purple-600',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    pulse: false,
  },
  finalizado: {
    label: 'Finalizado',
    descricao: 'Obrigado pela preferencia! Volte sempre.',
    icon: <PartyPopper size={24} />,
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    pulse: false,
  },
}

const ORDEM_STATUS: StatusPedido[] = ['recebido', 'em_preparo', 'pronto', 'entregue', 'finalizado']

export function OrderStatusDrawer({ isOpen, onClose }: OrderStatusDrawerProps) {
  const { pedido, atualizarStatus, limparPedido } = usePedidoAtivo()
  const [status, setStatus] = useState<StatusPedido | null>(pedido?.status ?? null)
  const [valorTotal, setValorTotal] = useState<number>(0)
  const [numeroPedido, setNumeroPedido] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const mesaNumero = pedido?.mesaNumero
  const pedidoId = pedido?.pedidoId

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (!pedidoId) {
      setLoading(false)
      return
    }

    let active = true

    void supabase
      .from('pedidos')
      .select('status, valor_total, created_at')
      .eq('id', pedidoId)
      .single()
      .then(async ({ data }) => {
        if (!active) return

        if (data) {
          setStatus(data.status as StatusPedido)
          setValorTotal(data.valor_total as number)
          atualizarStatus(data.status as StatusPedido)

          const { count } = await supabase
            .from('pedidos')
            .select('id', { count: 'exact', head: true })
            .lte('created_at', data.created_at)

          if (active) setNumeroPedido(count ?? 1)
        }

        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [isOpen, pedidoId, atualizarStatus])

  useEffect(() => {
    if (!isOpen || !pedidoId) return

    const channel = supabase
      .channel(`pedido-drawer-${pedidoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${pedidoId}` },
        (payload) => {
          const novo = payload.new as { status: StatusPedido; valor_total: number }
          setStatus(novo.status)
          setValorTotal(novo.valor_total)
          atualizarStatus(novo.status)
          setLastUpdate(new Date())
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [isOpen, pedidoId, atualizarStatus])

  if (!pedido) return null

  const config = status ? STATUS_CONFIG[status] : null
  const indexAtual = status ? ORDEM_STATUS.indexOf(status) : -1

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}

      <div
        className={`
          fixed top-0 right-0 z-50 h-full w-full max-w-md bg-[#f5f5f5] shadow-2xl
          transition-transform duration-300 ease-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <header className="bg-white border-b border-gray-100 px-4 py-4 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex-1">
              <h1 className="font-bold text-gray-900">Meu Pedido</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin size={10} className="text-brand-500" />
                <span className="text-xs text-gray-500">Mesa {mesaNumero}</span>
              </div>
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <RefreshCw size={11} className="text-brand-500" />
              Tempo real
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {config && (
                <div className={`rounded-3xl border-2 ${config.border} ${config.bg} p-6 text-center`}>
                  <div
                    className={`
                      w-20 h-20 rounded-full ${config.bg} border-2 ${config.border}
                      flex items-center justify-center mx-auto mb-4 ${config.color}
                      ${config.pulse ? 'animate-pulse-soft' : ''}
                    `}
                  >
                    {config.icon}
                  </div>
                  <h2 className={`text-2xl font-bold ${config.color} mb-1`}>{config.label}</h2>
                  <p className="text-gray-600 text-sm">{config.descricao}</p>
                  <p className="text-xs text-gray-400 mt-3">
                    Atualizado as {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 text-sm mb-4">Progresso do pedido</h3>
                <div className="relative">
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100" />
                  <div className="space-y-1">
                    {ORDEM_STATUS.map((s, index) => {
                      const cfg = STATUS_CONFIG[s]
                      const feito = index <= indexAtual
                      const atual = index === indexAtual

                      return (
                        <div key={s} className="flex items-center gap-4 relative">
                          <div
                            className={`
                              w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 z-10
                              ${feito ? `${cfg.bg} ${cfg.border} ${cfg.color}` : 'bg-white border-gray-200 text-gray-300'}
                              ${atual ? 'scale-110 shadow-md' : ''}
                            `}
                          >
                            <div className={`${feito ? '' : 'opacity-30'}`}>
                              {index === 0 && <Clock size={16} />}
                              {index === 1 && <ChefHat size={16} />}
                              {index === 2 && <CheckCircle size={16} />}
                              {index === 3 && <Utensils size={16} />}
                              {index === 4 && <PartyPopper size={16} />}
                            </div>
                          </div>
                          <div className="flex-1 py-3">
                            <p className={`text-sm font-semibold ${feito ? 'text-gray-900' : 'text-gray-400'}`}>
                              {cfg.label}
                              {atual && (
                                <span className="ml-2 text-xs font-normal bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full animate-pulse">
                                  agora
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Pedido</span>
                  <span className="font-mono font-bold text-gray-900 text-xs">#{numeroPedido ?? '...'}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Mesa</span>
                  <span className="font-bold text-gray-900">Mesa {mesaNumero}</span>
                </div>
                {valorTotal > 0 && (
                  <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Total</span>
                    <span className="font-bold text-brand-600">{formatCurrency(valorTotal)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
          {status === 'finalizado' ? (
            <button
              onClick={() => {
                limparPedido()
                onClose()
              }}
              className="w-full py-4 rounded-2xl bg-brand-500 text-white font-bold hover:bg-brand-600 transition-colors shadow-lg shadow-brand-200"
            >
              Fechar pedido
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl border-2 border-brand-200 text-brand-600 font-bold hover:bg-brand-50 transition-colors"
            >
              Continuar comprando
            </button>
          )}
        </div>
      </div>
    </>
  )
}
