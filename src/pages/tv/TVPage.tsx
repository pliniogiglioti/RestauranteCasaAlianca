import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
import type { PedidoCompleto } from '@/types'

export function TVPage() {
  const { nomeRestaurante } = useConfiguracoes()
  const [prontos, setProntos] = useState<PedidoCompleto[]>([])
  const [emPreparo, setEmPreparo] = useState<PedidoCompleto[]>([])

  async function carregarPedidos() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, mesa:mesas(*), itens:pedido_itens(*)')
      .in('status', ['pronto', 'em_preparo', 'recebido'])
      .order('updated_at', { ascending: true })

    if (!error && data) {
      const pedidos = data as unknown as PedidoCompleto[]
      setProntos(pedidos.filter((p) => p.status === 'pronto'))
      setEmPreparo(pedidos.filter((p) => p.status === 'em_preparo' || p.status === 'recebido'))
    }
  }

  useEffect(() => {
    void carregarPedidos()

    const channel = supabase
      .channel('tv-pedidos')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        void carregarPedidos()
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <AppIcon size="sm" />
          <span className="text-lg font-bold tracking-wide">{nomeRestaurante}</span>
        </div>
        <Clock />
      </header>

      {/* Dois painéis */}
      <div className="flex-1 grid grid-cols-2 divide-x divide-gray-800 overflow-hidden">

        {/* PAINEL ESQUERDO — Retire aqui */}
        <div className="flex flex-col">
          {/* Título painel */}
          <div className="bg-green-600 px-6 py-4 text-center">
            <p className="text-white font-black text-2xl tracking-wider uppercase">
              Retire aqui
            </p>
          </div>

          {/* Cards de pedidos prontos */}
          <div className="flex-1 p-4 overflow-y-auto">
            {prontos.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-30">
                <p className="text-gray-400 text-lg">Nenhum pedido pronto</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 content-start">
                {prontos.map((p) => (
                  <CardPedido key={p.id} pedido={p} variant="pronto" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PAINEL DIREITO — Em preparo */}
        <div className="flex flex-col">
          {/* Título painel */}
          <div className="bg-yellow-500 px-6 py-4 text-center">
            <p className="text-gray-900 font-black text-2xl tracking-wider uppercase">
              Em preparo
            </p>
          </div>

          {/* Cards de pedidos em preparo */}
          <div className="flex-1 p-4 overflow-y-auto">
            {emPreparo.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-30">
                <p className="text-gray-400 text-lg">Nenhum pedido em preparo</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 content-start">
                {emPreparo.map((p) => (
                  <CardPedido key={p.id} pedido={p} variant="preparo" />
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

function CardPedido({
  pedido,
  variant,
}: {
  pedido: PedidoCompleto
  variant: 'pronto' | 'preparo'
}) {
  const isPronto = variant === 'pronto'

  return (
    <div
      className={`rounded-2xl flex flex-col items-center justify-center py-5 px-3 text-center gap-1 transition-all ${
        isPronto
          ? 'bg-green-500/20 border-2 border-green-500 shadow-lg shadow-green-500/20'
          : 'bg-yellow-500/10 border-2 border-yellow-500/50'
      }`}
    >
      <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${isPronto ? 'text-green-400' : 'text-yellow-400/70'}`}>
        Mesa
      </p>
      <p className={`font-black leading-none ${isPronto ? 'text-6xl text-white' : 'text-5xl text-gray-300'}`}>
        {pedido.mesa?.numero ?? '—'}
      </p>
      {pedido.nome_cliente && (
        <p className={`text-sm font-semibold mt-1 truncate w-full ${isPronto ? 'text-green-300' : 'text-gray-400'}`}>
          {pedido.nome_cliente}
        </p>
      )}
    </div>
  )
}

function Clock() {
  const [hora, setHora] = useState(() =>
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  )
  useEffect(() => {
    const id = setInterval(() => {
      setHora(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    }, 10000)
    return () => clearInterval(id)
  }, [])
  return <span className="text-2xl font-bold text-gray-400 tabular-nums">{hora}</span>
}
