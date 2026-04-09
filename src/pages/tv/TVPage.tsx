import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
import type { PedidoCompleto } from '@/types'

const INTERVALO_SEGUNDOS = 8

export function TVPage() {
  const { nomeRestaurante } = useConfiguracoes()
  const [fila, setFila] = useState<PedidoCompleto[]>([])
  const [indiceAtual, setIndiceAtual] = useState(0)
  const [animando, setAnimando] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Carrega pedidos prontos do Supabase
  async function carregarFila() {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, mesa:mesas(*), itens:pedido_itens(*)')
      .eq('status', 'pronto')
      .order('updated_at', { ascending: true })

    if (!error && data) {
      setFila(data as unknown as PedidoCompleto[])
      setIndiceAtual(0)
    }
  }

  // Realtime: atualiza a fila quando pedidos mudam de status
  useEffect(() => {
    void carregarFila()

    const channel = supabase
      .channel('tv-pedidos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pedidos' },
        () => { void carregarFila() }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [])

  // Rotação automática entre os pedidos da fila
  useEffect(() => {
    if (fila.length <= 1) return

    timerRef.current = setTimeout(() => {
      setAnimando(true)
      setTimeout(() => {
        setIndiceAtual((i) => (i + 1) % fila.length)
        setAnimando(false)
      }, 400)
    }, INTERVALO_SEGUNDOS * 1000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [fila, indiceAtual])

  const pedidoAtual = fila[indiceAtual] ?? null

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-10 py-5 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <AppIcon size="sm" />
          <span className="text-xl font-bold text-white tracking-wide">{nomeRestaurante}</span>
        </div>
        <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-full px-5 py-2">
          <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 font-semibold text-sm">Pedidos Prontos</span>
        </div>
        <div className="text-gray-500 text-sm tabular-nums">
          <Clock />
        </div>
      </header>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-10">
        {fila.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            className={`flex flex-col items-center text-center transition-all duration-400 ${
              animando ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
          >
            {/* Label */}
            <p className="text-gray-400 text-2xl font-medium tracking-widest uppercase mb-6">
              Retire seu pedido
            </p>

            {/* Mesa destaque */}
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-brand-500/20 blur-3xl rounded-full scale-150" />
              <div className="relative bg-brand-500 rounded-3xl px-16 py-8 shadow-2xl shadow-brand-500/40">
                <p className="text-white/70 text-xl font-medium mb-1">Mesa</p>
                <p className="text-white font-black text-[6rem] leading-none tracking-tight">
                  {pedidoAtual.mesa?.numero ?? '—'}
                </p>
              </div>
            </div>

            {/* Nome do cliente */}
            {pedidoAtual.nome_cliente && (
              <p className="text-3xl font-bold text-white/90 mb-3">
                {pedidoAtual.nome_cliente}
              </p>
            )}

            {/* Valor */}
            <p className="text-gray-500 text-xl font-medium">
              R$ {Number(pedidoAtual.valor_total).toFixed(2)}
            </p>
          </div>
        )}
      </div>

      {/* Fila de espera (outros pedidos) */}
      {fila.length > 1 && (
        <div className="border-t border-gray-800 px-10 py-5">
          <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest mb-3">
            Aguardando ({fila.length - 1})
          </p>
          <div className="flex gap-3 flex-wrap">
            {fila.map((p, idx) => {
              if (idx === indiceAtual) return null
              return (
                <div
                  key={p.id}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 flex items-center gap-3"
                >
                  <span className="text-white font-bold text-lg">
                    Mesa {p.mesa?.numero ?? '—'}
                  </span>
                  {p.nome_cliente && (
                    <span className="text-gray-400 text-sm">{p.nome_cliente}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Indicadores de página */}
      {fila.length > 1 && (
        <div className="flex justify-center gap-2 pb-5">
          {fila.map((_, idx) => (
            <button
              key={idx}
              onClick={() => { setIndiceAtual(idx); setAnimando(false) }}
              className={`rounded-full transition-all duration-300 ${
                idx === indiceAtual
                  ? 'w-6 h-2 bg-brand-500'
                  : 'w-2 h-2 bg-gray-700 hover:bg-gray-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center gap-4 opacity-40">
      <div className="w-24 h-24 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center text-5xl">
        🍽️
      </div>
      <p className="text-gray-400 text-2xl font-medium">Nenhum pedido pronto</p>
      <p className="text-gray-600 text-base">Quando um pedido estiver pronto, aparecerá aqui</p>
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
