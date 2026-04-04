import { useEffect, useState, useRef } from 'react'
import { Plus, QrCode, Edit2, Trash2, Check, Download } from 'lucide-react'
import { getMesas, createMesa, updateMesa, deleteMesa, gerarSlugMesa } from '@/services/mesas'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import type { Mesa } from '@/types'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

const BASE_URL = window.location.origin

export function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Mesa | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Mesa | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrMesa, setQrMesa] = useState<Mesa | null>(null)
  const [qrUrl, setQrUrl] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Form state
  const [numero, setNumero] = useState('')
  const [ativo, setAtivo] = useState(true)

  async function carregar() {
    try {
      const data = await getMesas()
      setMesas(data)
    } catch {
      toast.error('Erro ao carregar mesas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(mesa?: Mesa) {
    if (mesa) {
      setEditando(mesa)
      setNumero(String(mesa.numero))
      setAtivo(mesa.ativo)
    } else {
      setEditando(null)
      setNumero('')
      setAtivo(true)
    }
    setModalOpen(true)
  }

  async function handleSalvar() {
    if (!numero || isNaN(parseInt(numero))) {
      toast.error('Número da mesa inválido')
      return
    }

    const num = parseInt(numero)
    const slug = gerarSlugMesa(num)

    try {
      setSaving(true)
      if (editando) {
        await updateMesa(editando.id, { numero: num, slug, ativo })
        toast.success('Mesa atualizada!')
      } else {
        await createMesa({ numero: num, slug, ativo })
        toast.success('Mesa criada!')
      }
      setModalOpen(false)
      carregar()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar mesa'
      toast.error(msg.includes('unique') ? 'Já existe uma mesa com esse número' : msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteMesa(deleteTarget.id)
      toast.success('Mesa excluída!')
      setDeleteTarget(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir mesa')
    } finally {
      setDeleting(false)
    }
  }

  async function abrirQR(mesa: Mesa) {
    setQrMesa(mesa)
    setQrModalOpen(true)
    const url = `${BASE_URL}/mesa/${mesa.slug}`
    setQrUrl(url)
    setTimeout(async () => {
      if (canvasRef.current) {
        await QRCode.toCanvas(canvasRef.current, url, {
          width: 220,
          margin: 2,
          color: { dark: '#1a1a1a', light: '#ffffff' },
        })
      }
    }, 100)
  }

  function downloadQR() {
    if (!canvasRef.current || !qrMesa) return
    const link = document.createElement('a')
    link.download = `qrcode-mesa-${qrMesa.numero}.png`
    link.href = canvasRef.current.toDataURL('image/png')
    link.click()
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mesas"
        subtitle={`${mesas.length} mesa${mesas.length !== 1 ? 's' : ''} cadastrada${mesas.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => abrirModal()} size="md">
            <Plus size={16} />
            Nova Mesa
          </Button>
        }
      />

      {mesas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <QrCode size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma mesa cadastrada</p>
          <button
            onClick={() => abrirModal()}
            className="mt-3 text-brand-600 text-sm font-medium hover:underline"
          >
            Criar primeira mesa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mesas.map((mesa) => (
            <div
              key={mesa.id}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-3xl font-black text-gray-900">
                    #{mesa.numero}
                  </div>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{mesa.slug}</p>
                </div>
                <Badge variant={mesa.ativo ? 'success' : 'default'}>
                  {mesa.ativo ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>

              <p className="text-xs text-gray-400 truncate mb-3">
                {BASE_URL}/mesa/{mesa.slug}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => abrirQR(mesa)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gray-50 hover:bg-brand-50 text-gray-600 hover:text-brand-600 text-xs font-medium transition-colors border border-gray-200 hover:border-brand-200"
                >
                  <QrCode size={13} />
                  QR Code
                </button>
                <button
                  onClick={() => abrirModal(mesa)}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-200"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setDeleteTarget(mesa)}
                  className="p-2 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors border border-gray-200 hover:border-red-200"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Mesa' : 'Nova Mesa'}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar Mesa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Número da Mesa"
            type="number"
            min="1"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="Ex: 1, 2, 3..."
            required
          />
          <Toggle
            checked={ativo}
            onChange={setAtivo}
            label="Mesa ativa (disponível para pedidos)"
          />
        </div>
      </Modal>

      {/* Modal QR Code */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title={`QR Code - Mesa ${qrMesa?.numero}`}
        size="sm"
      >
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100">
            <canvas ref={canvasRef} />
          </div>
          <p className="text-xs text-gray-400 text-center break-all px-2">{qrUrl}</p>
          <div className="flex gap-3 w-full">
            <button
              onClick={() => navigator.clipboard.writeText(qrUrl).then(() => toast.success('Link copiado!'))}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Check size={14} />
              Copiar Link
            </button>
            <button
              onClick={downloadQR}
              className="flex-1 py-2.5 rounded-xl bg-brand-500 text-white text-sm font-medium hover:bg-brand-600 flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={14} />
              Baixar QR
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Mesa"
        message={`Tem certeza que deseja excluir a Mesa ${deleteTarget?.numero}? Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
