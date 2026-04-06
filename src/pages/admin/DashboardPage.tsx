import { useEffect, useState } from 'react'
import { TableProperties, UtensilsCrossed, Tag, ClipboardList, TrendingUp, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/admin/PageHeader'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { StatusBadge } from '@/components/ui/Badge'
import { formatCurrency } from '@/types'
import { Link } from 'react-router-dom'

interface Stats {
  mesas: number
  pratos: number
  categorias: number
  pedidosHoje: number
  receitaHoje: number
  pedidosAtivos: number
}

interface PedidoRecente {
  id: string
  mesa: { numero: number } | null
  status: string
  valor_total: number
  created_at: string
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [pedidosRecentes, setPedidosRecentes] = useState<PedidoRecente[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function carregarDados() {
      try {
        const hoje = new Date()
        hoje.setHours(0, 0, 0, 0)

        const [mesasRes, pratosRes, categoriasRes, pedidosRes] = await Promise.all([
          supabase.from('mesas').select('id', { count: 'exact' }).eq('ativo', true),
          supabase.from('pratos').select('id', { count: 'exact' }).eq('ativo', true),
          supabase.from('categorias').select('id', { count: 'exact' }).eq('ativo', true),
          supabase
            .from('pedidos')
            .select('id, status, valor_total, created_at, mesa:mesas(numero)')
            .gte('created_at', hoje.toISOString())
            .order('created_at', { ascending: false }),
        ])

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pedidos = (pedidosRes.data ?? []) as any[]
        const receitaHoje = pedidos.reduce(
          (s: number, p: { valor_total: number }) => s + (p.valor_total ?? 0),
          0
        )
        const pedidosAtivos = pedidos.filter(
          (p: { status: string }) => !['finalizado', 'entregue'].includes(p.status)
        ).length

        setStats({
          mesas: mesasRes.count ?? 0,
          pratos: pratosRes.count ?? 0,
          categorias: categoriasRes.count ?? 0,
          pedidosHoje: pedidos.length,
          receitaHoje,
          pedidosAtivos,
        })

        setPedidosRecentes(pedidos.slice(0, 5) as PedidoRecente[])
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [])

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle={`Bem-vindo de volta! ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={<TableProperties size={20} />}
          label="Mesas Ativas"
          value={String(stats?.mesas ?? 0)}
          color="blue"
          href="/admin/mesas"
        />
        <StatCard
          icon={<UtensilsCrossed size={20} />}
          label="Pratos Ativos"
          value={String(stats?.pratos ?? 0)}
          color="red"
          href="/admin/pratos"
        />
        <StatCard
          icon={<Tag size={20} />}
          label="Categorias"
          value={String(stats?.categorias ?? 0)}
          color="purple"
          href="/admin/categorias"
        />
        <StatCard
          icon={<ClipboardList size={20} />}
          label="Pedidos Hoje"
          value={String(stats?.pedidosHoje ?? 0)}
          color="green"
          href="/admin/pedidos"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Receita Hoje"
          value={formatCurrency(stats?.receitaHoje ?? 0)}
          color="emerald"
        />
        <StatCard
          icon={<Clock size={20} />}
          label="Em Andamento"
          value={String(stats?.pedidosAtivos ?? 0)}
          color="yellow"
          href="/admin/pedidos"
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Pedidos Recentes</h2>
          <Link to="/admin/pedidos" className="text-brand-600 text-sm font-medium hover:text-brand-700">
            Ver todos →
          </Link>
        </div>

        {pedidosRecentes.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            Nenhum pedido hoje ainda
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pedidosRecentes.map((pedido) => (
              <div key={pedido.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 text-xs font-bold">
                    {pedido.mesa?.numero ?? '—'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Mesa {pedido.mesa?.numero ?? 'N/A'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(pedido.created_at).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={pedido.status} />
                  <span className="text-sm font-bold text-gray-900">
                    {formatCurrency(pedido.valor_total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  color,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
  href?: string
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-brand-50 text-brand-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    yellow: 'bg-yellow-50 text-yellow-600',
  }

  const content = (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-gray-500 text-sm mt-0.5">{label}</p>
    </div>
  )

  if (href) return <Link to={href}>{content}</Link>
  return content
}
