import { useEffect, useState, type ReactNode } from 'react'
import { useParams } from 'react-router-dom'
import { Clock3, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { getLojaBySlug } from '@/services/lojas'
import { AppIcon } from '@/components/ui/AppIcon'
import type { PedidoCompleto } from '@/types'

export function TVPage() {
  const { lojaSlug } = useParams<{ lojaSlug: string }>()
  const { nomeRestaurante } = useConfiguracoes()
  const [prontos, setProntos] = useState<PedidoCompleto[]>([])
  const [emPreparo, setEmPreparo] = useState<PedidoCompleto[]>([])
  const [lojaId, setLojaId] = useState<string | null>(null)

  useEffect(() => {
    if (!lojaSlug) return
    getLojaBySlug(lojaSlug)
      .then((loja) => setLojaId(loja.id))
      .catch(() => {})
  }, [lojaSlug])

  async function carregarPedidos(lId: string | null) {
    let query = supabase
      .from('pedidos')
      .select('*, mesa:mesas(*), itens:pedido_itens(*)')
      .in('status', ['pronto', 'em_preparo', 'recebido'])
      .order('updated_at', { ascending: true })

    if (lId) query = query.eq('loja_id', lId)

    const { data, error } = await query

    if (!error && data) {
      const pedidos = data as unknown as PedidoCompleto[]
      setProntos(pedidos.filter((p) => p.status === 'pronto'))
      setEmPreparo(pedidos.filter((p) => p.status === 'em_preparo' || p.status === 'recebido'))
    }
  }

  useEffect(() => {
    void carregarPedidos(lojaId)

    const channel = supabase
      .channel(`tv-pedidos-${lojaSlug ?? 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pedidos' }, () => {
        void carregarPedidos(lojaId)
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [lojaId, lojaSlug])

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(22,163,74,0.18),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(250,204,21,0.16),_transparent_24%),linear-gradient(135deg,_#06110b_0%,_#0b1b13_45%,_#101726_100%)] text-white">
      <div className="flex min-h-screen flex-col px-6 py-5 lg:px-8">
        <header className="rounded-[32px] border border-white/10 bg-white/6 px-5 py-3.5 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl border border-black/5 bg-white p-2.5 shadow-lg shadow-black/10">
                <AppIcon size="sm" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
                  Painel de chamada
                </p>
                <h1 className="mt-0.5 text-2xl font-black tracking-tight text-white lg:text-3xl">
                  {nomeRestaurante}
                </h1>
              </div>
            </div>

            <ClockPanel />
          </div>
        </header>

        <main className="mt-6 grid min-h-0 flex-1 grid-cols-2 gap-6">
          <PainelPedidos
            title="Retire aqui"
            subtitle="Pedidos liberados para entrega"
            icon={<Sparkles size={22} />}
            pedidos={prontos}
            variant="pronto"
          />
          <PainelPedidos
            title="Em preparo"
            subtitle="Pedidos recebidos pela cozinha"
            icon={<Clock3 size={22} />}
            pedidos={emPreparo}
            variant="preparo"
          />
        </main>
      </div>
    </div>
  )
}

function PainelPedidos({
  title,
  subtitle,
  icon,
  pedidos,
  variant,
}: {
  title: string
  subtitle: string
  icon: ReactNode
  pedidos: PedidoCompleto[]
  variant: 'pronto' | 'preparo'
}) {
  const isPronto = variant === 'pronto'

  return (
    <section
      className={`flex min-h-0 flex-col overflow-hidden rounded-[34px] border ${
        isPronto
          ? 'border-emerald-400/30 bg-emerald-500/10 shadow-[0_24px_90px_-35px_rgba(34,197,94,0.55)]'
          : 'border-amber-300/25 bg-amber-400/8 shadow-[0_24px_90px_-35px_rgba(250,204,21,0.35)]'
      }`}
    >
      <div
        className={`flex items-center justify-between border-b px-5 py-4 ${
          isPronto ? 'border-emerald-300/20 bg-emerald-400/10' : 'border-amber-200/15 bg-amber-300/10'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
              isPronto ? 'bg-emerald-300/15 text-emerald-200' : 'bg-amber-200/15 text-amber-100'
            }`}
          >
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white lg:text-3xl">{title}</h2>
            <p className={`text-sm ${isPronto ? 'text-emerald-100/75' : 'text-amber-50/70'}`}>
              {subtitle}
            </p>
          </div>
        </div>

        <div
          className={`rounded-full px-4 py-2 text-sm font-bold ${
            isPronto ? 'bg-emerald-300/14 text-emerald-100' : 'bg-amber-200/14 text-amber-50'
          }`}
        >
          {pedidos.length} pedido{pedidos.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {pedidos.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-[28px] border border-dashed border-white/10 bg-black/10 px-8 text-center">
            <div
              className={`mb-4 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.3em] ${
                isPronto ? 'bg-emerald-300/10 text-emerald-200' : 'bg-amber-200/10 text-amber-100'
              }`}
            >
              Painel livre
            </div>
            <p className="text-3xl font-black text-white">
              {isPronto ? 'Nenhum pedido pronto' : 'Nenhum pedido em preparo'}
            </p>
            <p className="mt-2 max-w-md text-base text-white/55">
              Assim que um pedido mudar de status ele aparecera automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pedidos.map((pedido) => (
              <CardPedido key={pedido.id} pedido={pedido} variant={variant} />
            ))}
          </div>
        )}
      </div>
    </section>
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
    <article
      className={`rounded-[24px] border p-4 ${
        isPronto
          ? 'border-emerald-300/30 bg-[linear-gradient(135deg,rgba(16,185,129,0.18),rgba(5,46,22,0.8))]'
          : 'border-amber-200/20 bg-[linear-gradient(135deg,rgba(245,158,11,0.16),rgba(30,25,10,0.86))]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div
          className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-[22px] border ${
            isPronto
              ? 'border-emerald-200/35 bg-emerald-200/12 text-white'
              : 'border-amber-100/20 bg-amber-100/8 text-amber-50'
          }`}
        >
          <span className={`text-xs font-bold uppercase tracking-[0.4em] ${isPronto ? 'text-emerald-100/70' : 'text-amber-100/65'}`}>
            Mesa
          </span>
          <span className="mt-1.5 text-5xl font-black leading-none tabular-nums">
            {pedido.mesa?.numero ?? '—'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.3em] ${
                isPronto ? 'bg-emerald-200/15 text-emerald-100' : 'bg-amber-100/12 text-amber-50'
              }`}
            >
              {isPronto ? 'Pode retirar' : pedido.status === 'recebido' ? 'Recebido' : 'Cozinha'}
            </span>
            <span className="text-xs font-medium text-white/45 lg:text-sm">
              Atualizado {formatHorario(pedido.updated_at)}
            </span>
          </div>

          <p className="mt-3 truncate text-4xl font-black tracking-tight text-white lg:text-[2.75rem]">
            {pedido.nome_cliente?.trim() || 'Cliente sem nome'}
          </p>

          <div className="mt-3 flex items-center gap-3 text-sm text-white/70">
            {pedido.comanda_externa && (
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-semibold">
                Comanda {pedido.comanda_externa}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

function ClockPanel() {
  const [agora, setAgora] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 text-right">
      <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-white/45">
        Agora
      </p>
      <p className="mt-1 text-3xl font-black leading-none tabular-nums text-white lg:text-4xl">
        {agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="mt-0.5 text-xs text-white/55 lg:text-sm">
        {agora.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </p>
    </div>
  )
}

function formatHorario(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
