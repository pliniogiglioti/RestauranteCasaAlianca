import { useEffect, useState, useRef } from 'react'
import { Plus, Edit2, Trash2, GripVertical, ImageIcon } from 'lucide-react'
import { getBanners, createBanner, updateBanner, deleteBanner, uploadImagemBanner } from '@/services/banners'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import type { Banner } from '@/types'
import toast from 'react-hot-toast'

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Banner | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Banner | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form
  const [titulo, setTitulo] = useState('')
  const [subtitulo, setSubtitulo] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [linkOpcional, setLinkOpcional] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [novaImagem, setNovaImagem] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  async function carregar() {
    try {
      const data = await getBanners()
      setBanners(data)
    } catch {
      toast.error('Erro ao carregar banners')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(banner?: Banner) {
    if (banner) {
      setEditando(banner)
      setTitulo(banner.titulo)
      setSubtitulo(banner.subtitulo ?? '')
      setImagemUrl(banner.imagem_url)
      setPreviewUrl(banner.imagem_url)
      setLinkOpcional(banner.link_opcional ?? '')
      setAtivo(banner.ativo)
    } else {
      setEditando(null)
      setTitulo('')
      setSubtitulo('')
      setImagemUrl('')
      setPreviewUrl('')
      setLinkOpcional('')
      setAtivo(true)
    }
    setNovaImagem(null)
    setModalOpen(true)
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setNovaImagem(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  async function handleSalvar() {
    if (!titulo.trim()) {
      toast.error('Título é obrigatório')
      return
    }
    if (!imagemUrl && !novaImagem) {
      toast.error('Imagem é obrigatória')
      return
    }

    try {
      setSaving(true)
      const ordem = editando?.ordem ?? banners.length + 1

      const payload = {
        titulo,
        subtitulo: subtitulo || null,
        imagem_url: imagemUrl || 'placeholder',
        link_opcional: linkOpcional || null,
        ativo,
        ordem,
      }

      if (editando) {
        const updated = await updateBanner(editando.id, payload)
        if (novaImagem) {
          const url = await uploadImagemBanner(novaImagem, updated.id)
          await updateBanner(updated.id, { imagem_url: url })
        }
        toast.success('Banner atualizado!')
      } else {
        const created = await createBanner(payload)
        if (novaImagem) {
          const url = await uploadImagemBanner(novaImagem, created.id)
          await updateBanner(created.id, { imagem_url: url })
        }
        toast.success('Banner criado!')
      }

      setModalOpen(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar banner')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteBanner(deleteTarget.id)
      toast.success('Banner excluído!')
      setDeleteTarget(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir banner')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleAtivo(banner: Banner) {
    try {
      await updateBanner(banner.id, { ativo: !banner.ativo })
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, ativo: !b.ativo } : b))
      )
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners"
        subtitle="Gerencie o slider da página principal"
        action={
          <Button onClick={() => abrirModal()}>
            <Plus size={16} />
            Novo Banner
          </Button>
        }
      />

      {banners.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <ImageIcon size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhum banner cadastrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-3 p-3">
                {/* Drag handle */}
                <div className="flex items-center text-gray-300 cursor-grab">
                  <GripVertical size={18} />
                </div>

                <span className="flex items-center text-gray-400 text-sm w-5 shrink-0">{index + 1}</span>

                {/* Image preview */}
                <div className="w-24 h-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                  {banner.imagem_url ? (
                    <img src={banner.imagem_url} alt={banner.titulo} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{banner.titulo}</p>
                  {banner.subtitulo && (
                    <p className="text-gray-500 text-xs truncate mt-0.5">{banner.subtitulo}</p>
                  )}
                  {banner.link_opcional && (
                    <p className="text-blue-500 text-xs truncate mt-0.5">{banner.link_opcional}</p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  <Toggle checked={banner.ativo} onChange={() => toggleAtivo(banner)} />
                  <Badge variant={banner.ativo ? 'success' : 'default'} size="sm">
                    {banner.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <button
                    onClick={() => abrirModal(banner)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(banner)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Banner' : 'Novo Banner'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar Banner'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Imagem do Banner <span className="text-red-500">*</span>
            </label>
            <div
              className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-brand-300 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover" />
              ) : (
                <div className="h-32 flex flex-col items-center justify-center gap-2 text-gray-400">
                  <ImageIcon size={24} />
                  <span className="text-sm">Clique para selecionar imagem</span>
                  <span className="text-xs">Recomendado: 1200x400px</span>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            <Input
              label=""
              value={imagemUrl}
              onChange={(e) => { setImagemUrl(e.target.value); setPreviewUrl(e.target.value) }}
              placeholder="Ou cole a URL da imagem"
              className="mt-2"
            />
          </div>

          <Input label="Título" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Bem-vindo ao Casa Aliana" required />
          <Input label="Subtítulo (opcional)" value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} placeholder="Ex: Os melhores sabores para você" />
          <Input label="Link (opcional)" value={linkOpcional} onChange={(e) => setLinkOpcional(e.target.value)} placeholder="https://..." />
          <Toggle checked={ativo} onChange={setAtivo} label="Banner ativo (visível no cardápio)" />
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Banner"
        message={`Tem certeza que deseja excluir "${deleteTarget?.titulo}"?`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
