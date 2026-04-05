import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  RefreshCw, Eye, Clock, CheckCircle2, ChefHat, Utensils,
  AlertTriangle, Printer, FileText, ChevronDown,
} from 'lucide-react'
import { getPedidos, atualizarStatusPedido } from '@/services/pedidos'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { formatCurrency, STATUS_PEDIDO } from '@/types'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import type { PedidoCompleto, StatusPedido } from '@/types'
import toast from 'react-hot-toast'

const STATUS_OPTIONS = STATUS_PEDIDO
const STATUS_ABERTO: StatusPedido[] = ['recebido', 'em_preparo', 'pronto', 'entregue']

const STATUS_LABEL: Record<StatusPedido, string> = {
  recebido: 'Recebido',
  em_preparo: 'Em Preparo',
  pronto: 'Pronto',
  entregue: 'Entregue',
  finalizado: 'Finalizado',
}

interface MesaGroup {
  mesaNumero: number
  mesaId: string | null
  pedidoAtual: PedidoCompleto
  pedidosAnteriores: PedidoCompleto[]
  temAberto: boolean
}

function agruparPorMesa(pedidos: PedidoCompleto[]): MesaGroup[] {
  const map = new Map<string, MesaGroup>()
  for (const pedido of pedidos) {
    const key = pedido.mesa?.id ?? 'sem-mesa'
    const numero = pedido.mesa?.numero ?? 0
    if (!map.has(key)) {
      map.set(key, { mesaNumero: numero, mesaId: pedido.mesa?.id ?? null, pedidoAtual: pedido, pedidosAnteriores: [], temAberto: false })
    } else {
      map.get(key)!.pedidosAnteriores.push(pedido)
    }
  }
  for (const group of map.values()) {
    const todos = [group.pedidoAtual, ...group.pedidosAnteriores].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    group.pedidoAtual = todos[0]
    group.pedidosAnteriores = todos.slice(1)
    group.temAberto = STATUS_ABERTO.includes(group.pedidoAtual.status)
  }
  return Array.from(map.values()).sort((a, b) => a.mesaNumero - b.mesaNumero)
}

const STATUS_ICON: Record<StatusPedido, React.ReactNode> = {
  recebido: <Clock size={12} />,
  em_preparo: <ChefHat size={12} />,
  pronto: <CheckCircle2 size={12} />,
  entregue: <Utensils size={12} />,
  finalizado: <CheckCircle2 size={12} />,
}

function toDateLocal(iso: string) {
  return iso.slice(0, 10)
}

function todayLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Relatório HTML (gerado no renderer, impresso via Electron IPC)
// ---------------------------------------------------------------------------
function buildRelatorioHTML(
  pedidos: PedidoCompleto[],
  data: string,
  nomeRestaurante: string,
  numeroPedido: Map<string, number>
): string {
  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR')
  const total = pedidos.reduce((s, p) => s + p.valor_total, 0)
  const finalizados = pedidos.filter(p => p.status === 'finalizado').length

  const rows = pedidos.map(p => `
    <tr>
      <td>#${numeroPedido.get(p.id) ?? '?'}</td>
      <td>Mesa ${p.mesa?.numero ?? '?'}</td>
      <td>${STATUS_LABEL[p.status]}</td>
      <td style="text-align:right">R$&nbsp;${p.valor_total.toFixed(2)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Courier New',monospace;font-size:12px;width:80mm;padding:8px;color:#000}
    h1{font-size:16px;text-align:center;font-weight:bold;letter-spacing:1px}
    .sub{text-align:center;font-size:11px;margin-bottom:4px}
    .div{border-top:1px dashed #000;margin:5px 0}
    table{width:100%;border-collapse:collapse}
    th{font-size:10px;text-align:left;border-bottom:1px solid #000;padding-bottom:2px}
    td{font-size:11px;padding:2px 0}
    .tot{font-weight:bold;font-size:13px;border-top:1px solid #000;padding-top:3px}
    .footer{text-align:center;font-size:10px;color:#666;margin-top:6px}
  </style></head><body>
    <h1>${nomeRestaurante.toUpperCase()}</h1>
    <p class="sub">Relatório do Dia</p>
    <p class="sub">${dataFormatada}</p>
    <div class="div"></div>
    <p style="font-size:11px">Total de pedidos: <strong>${pedidos.length}</strong></p>
    <p style="font-size:11px">Finalizados: <strong>${finalizados}</strong></p>
    <div class="div"></div>
    <table>
      <thead><tr><th>Ped.</th><th>Mesa</th><th>Status</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="div"></div>
    <p class="tot" style="text-align:right">TOTAL DO DIA: R$&nbsp;${total.toFixed(2)}</p>
    <p class="footer">Gerado em ${new Date().toLocaleString('pt-BR')}</p>
  </body></html>`
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export function PedidosPage() {
  const [pedidos, setPedidos] = useState<PedidoCompleto[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState<'mesas' | 'lista'>('mesas')
  const [statusFilter, setStatusFilter] = useState<StatusPedido | 'todos'>('todos')
  const [detailPedido, setDetailPedido] = useState<PedidoCompleto | null>(null)
  const [mesaDetalhe, setMesaDetalhe] = useState<MesaGroup | null>(null)
  const [showRelatorio, setShowRelatorio] = useState(false)
  const { nomeRestaurante } = useConfiguracoes()

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
    const interval = setInterval(() => carregar(true), 30000)
    return () => clearInterval(interval)
  }, [carregar])

  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  async function handlePrint(pedidoId: string) {
    if (!window.electronAPI) return
    try {
      await window.electronAPI.printPedido(pedidoId)
      toast.success('Enviado para impressão!')
    } catch {
      toast.error('Erro ao imprimir pedido')
    }
  }

  async function handleStatusChange(pedidoId: string, status: StatusPedido) {
    try {
      await atualizarStatusPedido(pedidoId, status)
      setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, status } : p))
      if (detailPedido?.id === pedidoId) setDetailPedido(prev => prev ? { ...prev, status } : prev)
      toast.success('Status atualizado!')
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const numeroPedido = useMemo(() => {
    const sorted = [...pedidos].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    const map = new Map<string, number>()
    sorted.forEach((p, i) => map.set(p.id, i + 1))
    return map
  }, [pedidos])

  const pedidosFiltrados = statusFilter === 'todos' ? pedidos : pedidos.filter(p => p.status === statusFilter)
  const contadores = STATUS_PEDIDO.reduce((acc, s) => { acc[s.value] = pedidos.filter(p => p.status === s.value).length; return acc }, {} as Record<string, number>)
  const mesaGroups = agruparPorMesa(pedidosFiltrados)

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pedidos"
        subtitle="Gerencie os pedidos do restaurante"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button onClick={() => setViewMode('mesas')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'mesas' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Por Mesa</button>
              <button onClick={() => setViewMode('lista')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Lista</button>
            </div>
            <Button variant="outline" onClick={() => setShowRelatorio(true)}>
              <FileText size={15} />
              Relatório do Dia
            </Button>
            <Button variant="outline" onClick={() => carregar(true)} loading={refreshing}>
              <RefreshCw size={15} />
              Atualizar
            </Button>
          </div>
        }
      />

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => setStatusFilter('todos')} className={`flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all border ${statusFilter === 'todos' ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
          Todos ({pedidos.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s.value} onClick={() => setStatusFilter(s.value)} className={`flex-none px-4 py-2 rounded-xl text-sm font-medium transition-all border ${statusFilter === s.value ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {s.label} ({contadores[s.value] ?? 0})
          </button>
        ))}
      </div>

      {pedidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Clock size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum pedido encontrado</p>
        </div>
      ) : viewMode === 'mesas' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {mesaGroups.map(group => {
            const todos = [group.pedidoAtual, ...group.pedidosAnteriores]
            const ultimos3 = todos.slice(0, 3)
            const temMais = todos.length > 3
            return (
              <div key={group.mesaId ?? 'sem-mesa'} className={`bg-white rounded-2xl shadow-sm border-2 transition-all ${group.temAberto ? 'border-brand-400 shadow-brand-100' : 'border-green-400 shadow-green-50'}`}>
                {/* Cabeçalho */}
                <div className={`flex items-center gap-3 px-4 py-3 rounded-t-xl ${group.temAberto ? 'bg-brand-50' : 'bg-green-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">Mesa {group.mesaNumero || '?'}</p>
                    <p className={`text-xs font-medium ${group.temAberto ? 'text-brand-600' : 'text-green-600'}`}>
                      {group.temAberto ? '● Em atendimento' : '✓ Livre'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 font-medium">{todos.length} pedido{todos.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Últimos 3 pedidos */}
                <div className="px-4 py-3 space-y-2">
                  {ultimos3.map(pedido => (
                    <PedidoRow
                      key={pedido.id}
                      pedido={pedido}
                      numero={numeroPedido.get(pedido.id) ?? 0}
                      onDetail={() => setDetailPedido(pedido)}
                      onStatusChange={handleStatusChange}
                      onPrint={isElectron ? handlePrint : undefined}
                    />
                  ))}
                </div>

                {/* Alerta pedidos anteriores em aberto */}
                {group.pedidosAnteriores.filter(p => STATUS_ABERTO.includes(p.status)).map(pedido => (
                  <div key={pedido.id} className="px-4 pb-2">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                        <span className="text-xs font-semibold text-amber-700">Pedido #{numeroPedido.get(pedido.id) ?? '?'} ainda em aberto</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <StatusBadge status={pedido.status} />
                        <button onClick={() => handleStatusChange(pedido.id, 'finalizado')} className="text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">Finalizar</button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Ver todos */}
                {temMais && (
                  <div className="px-4 pb-3">
                    <button
                      onClick={() => setMesaDetalhe(group)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs text-brand-600 font-medium hover:text-brand-700 py-2 border border-dashed border-brand-200 rounded-xl hover:bg-brand-50 transition-colors"
                    >
                      <ChevronDown size={13} />
                      Ver todos ({todos.length} pedidos)
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {pedidosFiltrados.slice().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map(pedido => (
            <div key={pedido.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4 px-4 py-4">
                <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs text-brand-500 font-medium leading-none">Mesa</span>
                  <span className="text-brand-700 font-black text-lg leading-tight">{pedido.mesa?.numero ?? '?'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 text-sm">Pedido #{numeroPedido.get(pedido.id) ?? '?'}</span>
                    <StatusBadge status={pedido.status} />
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-500">{new Date(pedido.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-500">{pedido.itens?.length ?? 0} iten{(pedido.itens?.length ?? 0) !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">{formatCurrency(pedido.valor_total)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => setDetailPedido(pedido)} className="p-2 rounded-xl text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-gray-200"><Eye size={15} /></button>
                  {isElectron && (
                    <button onClick={() => handlePrint(pedido.id)} className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200" title="Reimprimir pedido"><Printer size={15} /></button>
                  )}
                  <select value={pedido.status} onChange={e => handleStatusChange(pedido.id, e.target.value as StatusPedido)} className="text-sm font-medium border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer hover:border-brand-300 transition-colors">
                    {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal detalhes do pedido */}
      <Modal isOpen={!!detailPedido} onClose={() => setDetailPedido(null)} title={`Pedido #${detailPedido ? (numeroPedido.get(detailPedido.id) ?? '?') : ''} — Mesa ${detailPedido?.mesa?.numero ?? 'N/A'}`} size="lg">
        {detailPedido && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Mesa</p><p className="font-bold text-gray-900">Mesa {detailPedido.mesa?.numero ?? 'N/A'}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Status</p><StatusBadge status={detailPedido.status} /></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Data/Hora</p><p className="font-semibold text-gray-900 text-sm">{new Date(detailPedido.created_at).toLocaleString('pt-BR')}</p></div>
              <div className="bg-gray-50 rounded-xl p-3"><p className="text-xs text-gray-500 mb-0.5">Total</p><p className="font-bold text-brand-600">{formatCurrency(detailPedido.valor_total)}</p></div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Itens</h3>
              <div className="space-y-2">
                {detailPedido.itens?.map(item => (
                  <div key={item.id} className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm"><span className="text-brand-600 font-bold">{item.quantidade}x</span> {item.nome_prato}</p>
                      {item.observacao_item && <p className="text-xs text-gray-500 mt-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100">💬 {item.observacao_item}</p>}
                    </div>
                    <span className="font-bold text-gray-900 text-sm shrink-0">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </div>
            {detailPedido.observacao_geral && (
              <div>
                <h3 className="font-semibold text-gray-900 text-sm mb-2">Observação Geral</h3>
                <p className="text-gray-600 text-sm bg-gray-50 rounded-xl p-3">{detailPedido.observacao_geral}</p>
              </div>
            )}
            {isElectron && (
              <Button variant="outline" onClick={() => handlePrint(detailPedido.id)} className="w-full flex items-center gap-2 justify-center">
                <Printer size={15} />Reimprimir Pedido
              </Button>
            )}
            <div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">Alterar Status</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STATUS_OPTIONS.map(s => (
                  <button key={s.value} onClick={() => handleStatusChange(detailPedido.id, s.value)} className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${detailPedido.status === s.value ? 'bg-brand-500 text-white border-brand-500 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600'}`}>
                    {STATUS_ICON[s.value]}{s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal histórico da mesa */}
      {mesaDetalhe && (
        <MesaDetalheModal
          group={mesaDetalhe}
          pedidos={pedidos}
          numeroPedido={numeroPedido}
          isElectron={isElectron}
          onClose={() => setMesaDetalhe(null)}
          onDetail={setDetailPedido}
          onStatusChange={handleStatusChange}
          onPrint={isElectron ? handlePrint : undefined}
        />
      )}

      {/* Modal relatório do dia */}
      {showRelatorio && (
        <RelatorioModal
          pedidos={pedidos}
          numeroPedido={numeroPedido}
          nomeRestaurante={nomeRestaurante}
          isElectron={isElectron}
          onClose={() => setShowRelatorio(false)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modal: histórico da mesa com filtro de dia
// ---------------------------------------------------------------------------
function MesaDetalheModal({
  group, pedidos, numeroPedido, isElectron, onClose, onDetail, onStatusChange, onPrint,
}: {
  group: MesaGroup
  pedidos: PedidoCompleto[]
  numeroPedido: Map<string, number>
  isElectron: boolean
  onClose: () => void
  onDetail: (p: PedidoCompleto) => void
  onStatusChange: (id: string, status: StatusPedido) => void
  onPrint?: (id: string) => void
}) {
  const [data, setData] = useState(todayLocal())

  const pedidosMesa = pedidos
    .filter(p => (p.mesa?.id ?? 'sem-mesa') === (group.mesaId ?? 'sem-mesa'))
    .filter(p => toDateLocal(p.created_at) === data)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalDia = pedidosMesa.reduce((s, p) => s + p.valor_total, 0)

  return (
    <Modal isOpen onClose={onClose} title={`Mesa ${group.mesaNumero} — Histórico`} size="lg">
      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              value={data}
              onChange={e => setData(e.target.value)}
              className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <span className="text-xs text-gray-500 ml-auto">
            {pedidosMesa.length} pedido{pedidosMesa.length !== 1 ? 's' : ''} · {formatCurrency(totalDia)}
          </span>
        </div>

        {pedidosMesa.length === 0 ? (
          <div className="py-10 text-center">
            <Clock size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhum pedido nesta data</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pedidosMesa.map(pedido => (
              <div key={pedido.id} className="border border-gray-100 rounded-xl p-3">
                <PedidoRow
                  pedido={pedido}
                  numero={numeroPedido.get(pedido.id) ?? 0}
                  onDetail={() => { onClose(); onDetail(pedido) }}
                  onStatusChange={onStatusChange}
                  onPrint={onPrint}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Modal: relatório do dia
// ---------------------------------------------------------------------------
function RelatorioModal({
  pedidos, numeroPedido, nomeRestaurante, isElectron, onClose,
}: {
  pedidos: PedidoCompleto[]
  numeroPedido: Map<string, number>
  nomeRestaurante: string
  isElectron: boolean
  onClose: () => void
}) {
  const [data, setData] = useState(todayLocal())
  const [printing, setPrinting] = useState(false)

  const pedidosDia = pedidos
    .filter(p => toDateLocal(p.created_at) === data)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const totalReceita = pedidosDia.reduce((s, p) => s + p.valor_total, 0)
  const finalizados = pedidosDia.filter(p => p.status === 'finalizado').length

  async function handlePrint() {
    if (!window.electronAPI) return
    setPrinting(true)
    try {
      const html = buildRelatorioHTML(pedidosDia, data, nomeRestaurante, numeroPedido)
      await window.electronAPI.printRelatorio(html)
      toast.success('Relatório enviado para impressão!')
    } catch {
      toast.error('Erro ao imprimir relatório')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Relatório do Dia" size="lg">
      <div className="space-y-4">
        {/* Filtro de data */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Data</label>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-blue-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-blue-700">{pedidosDia.length}</p>
            <p className="text-xs text-blue-500 font-medium mt-0.5">Pedidos</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-green-700">{finalizados}</p>
            <p className="text-xs text-green-500 font-medium mt-0.5">Finalizados</p>
          </div>
          <div className="bg-brand-50 rounded-xl p-3 text-center">
            <p className="text-lg font-black text-brand-700">{formatCurrency(totalReceita)}</p>
            <p className="text-xs text-brand-500 font-medium mt-0.5">Total</p>
          </div>
        </div>

        {/* Lista */}
        {pedidosDia.length === 0 ? (
          <div className="py-8 text-center">
            <FileText size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Nenhum pedido nesta data</p>
          </div>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {pedidosDia.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-xl text-sm">
                <span className="font-bold text-gray-500 w-8">#{numeroPedido.get(p.id) ?? '?'}</span>
                <span className="text-gray-700 font-medium">Mesa {p.mesa?.numero ?? '?'}</span>
                <StatusBadge status={p.status} />
                <span className="ml-auto font-bold text-gray-900">{formatCurrency(p.valor_total)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botão imprimir */}
        {isElectron && (
          <Button
            onClick={handlePrint}
            loading={printing}
            disabled={pedidosDia.length === 0}
            className="w-full flex items-center gap-2 justify-center"
          >
            <Printer size={15} />
            Imprimir Relatório
          </Button>
        )}
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// PedidoRow
// ---------------------------------------------------------------------------
function PedidoRow({
  pedido, numero, onDetail, onStatusChange, onPrint,
}: {
  pedido: PedidoCompleto
  numero: number
  onDetail: () => void
  onStatusChange: (id: string, status: StatusPedido) => void
  onPrint?: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900 text-sm">Pedido #{numero}</span>
          <StatusBadge status={pedido.status} />
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {pedido.itens?.length ?? 0} iten{(pedido.itens?.length ?? 0) !== 1 ? 's' : ''} · {formatCurrency(pedido.valor_total)}
          <span className="ml-2">{new Date(pedido.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button onClick={onDetail} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors border border-gray-200" title="Ver detalhes">
          <Eye size={13} />
        </button>
        {onPrint && (
          <button onClick={() => onPrint(pedido.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors border border-gray-200" title="Reimprimir">
            <Printer size={13} />
          </button>
        )}
        <select value={pedido.status} onChange={e => onStatusChange(pedido.id, e.target.value as StatusPedido)} className="text-xs font-medium border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer hover:border-brand-300 transition-colors">
          {STATUS_PEDIDO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>
    </div>
  )
}
