import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, Building2, Check, ExternalLink, Phone, MapPin } from 'lucide-react'
import { getLojas, createLoja, updateLoja, deleteLoja, gerarSlugLoja } from '@/services/lojas'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { useLoja } from '@/hooks/useLoja'
import type { Loja } from '@/types'
import toast from 'react-hot-toast'
import { PUBLIC_APP_URL } from '@/lib/publicUrl'

const BASE_URL = PUBLIC_APP_URL

export function EmpresasPage() {
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Loja | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Loja | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)

  const { lojaId: lojaAtualId, setLoja: selecionarLoja } = useLoja()

  // Form state
  const [nome, setNome] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [ativo, setAtivo] = useState(true)

  async function carregar() {
    try {
      const data = await getLojas()
      setLojas(data)
    } catch {
      toast.error('Erro ao carregar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(loja?: Loja) {
    if (loja) {
      setEditando(loja)
      setNome(loja.nome)
      setSlug(loja.slug)
      setTelefone(loja.telefone ?? '')
      setEndereco(loja.endereco ?? '')
      setAtivo(loja.ativo)
      setSlugEditado(true)
    } else {
      setEditando(null)
      setNome('')
      setSlug('')
      setTelefone('')
      setEndereco('')
      setAtivo(true)
      setSlugEditado(false)
    }
    setModalOpen(true)
  }

  function handleNomeChange(valor: string) {
    setNome(valor)
    if (!slugEditado) {
      setSlug(gerarSlugLoja(valor))
    }
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      toast.error('Nome da empresa é obrigatório')
      return
    }
    if (!slug.trim()) {
      toast.error('Slug é obrigatório')
      return
    }

    try {
      setSaving(true)
      const payload = {
        nome: nome.trim(),
        slug: slug.trim(),
        ativo,
        telefone: telefone.trim() || null,
        endereco: endereco.trim() || null,
      }
      if (editando) {
        const atualizada = await updateLoja(editando.id, payload)
        toast.success('Empresa atualizada!')
        if (lojaAtualId === editando.id) {
          selecionarLoja(atualizada.id, atualizada.slug, atualizada.nome)
        }
      } else {
        const nova = await createLoja(payload)
        toast.success('Empresa criada!')
        selecionarLoja(nova.id, nova.slug, nova.nome)
      }
      setModalOpen(false)
      carregar()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar empresa'
      toast.error(msg.includes('unique') ? 'Já existe uma empresa com esse slug' : msg)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteLoja(deleteTarget.id)
      toast.success('Empresa excluída!')
      setDeleteTarget(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir empresa. Verifique se não há dados vinculados.')
    } finally {
      setDeleting(false)
    }
  }

  function handleSelecionar(loja: Loja) {
    selecionarLoja(loja.id, loja.slug, loja.nome)
    toast.success(`Empresa "${loja.nome}" selecionada!`)
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        subtitle={`${lojas.length} empresa${lojas.length !== 1 ? 's' : ''} cadastrada${lojas.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => abrirModal()} size="md">
            <Plus size={16} />
            Nova Empresa
          </Button>
        }
      />

      {lojas.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma empresa cadastrada</p>
          <button
            onClick={() => abrirModal()}
            className="mt-3 text-brand-600 text-sm font-medium hover:underline"
          >
            Criar primeira empresa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lojas.map((loja) => {
            const isAtual = lojaAtualId === loja.id
            return (
              <div
                key={loja.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${
                  isAtual ? 'border-brand-400 ring-2 ring-brand-200' : 'border-gray-100 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
                      <Building2 size={18} className="text-brand-500" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-base leading-tight">{loja.nome}</p>
                      <p className="text-xs text-gray-400 font-mono mt-0.5">{loja.slug}</p>
                    </div>
                  </div>
                  <Badge variant={loja.ativo ? 'success' : 'default'}>
                    {loja.ativo ? 'Ativa' : 'Inativa'}
                  </Badge>
                </div>

                {isAtual && (
                  <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-brand-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1.5">
                    <Check size={12} />
                    Empresa selecionada no admin
                  </div>
                )}

                <p className="text-xs text-gray-400 truncate mb-1">
                  {BASE_URL}/{loja.slug}/mesa/...
                </p>
                {loja.telefone && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate mb-0.5">
                    <Phone size={11} className="shrink-0" /> {loja.telefone}
                  </p>
                )}
                {loja.endereco && (
                  <p className="text-xs text-gray-500 flex items-center gap-1 truncate mb-2">
                    <MapPin size={11} className="shrink-0" /> {loja.endereco}
                  </p>
                )}
                {!loja.telefone && !loja.endereco && <div className="mb-2" />}

                <div className="flex gap-2">
                  {!isAtual && (
                    <button
                      onClick={() => handleSelecionar(loja)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-semibold transition-colors border border-brand-200"
                    >
                      <Check size={13} />
                      Selecionar
                    </button>
                  )}
                  <a
                    href={`/${loja.slug}/tv`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 py-2 px-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-medium transition-colors border border-gray-200"
                    title="Abrir TV desta empresa"
                  >
                    <ExternalLink size={12} />
                    TV
                  </a>
                  <button
                    onClick={() => abrirModal(loja)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-200"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(loja)}
                    className="p-2 rounded-xl bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors border border-gray-200 hover:border-brand-200"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal criar/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Empresa' : 'Nova Empresa'}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar Empresa'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome da Empresa"
            type="text"
            value={nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            placeholder="Ex: Casa Aliança, Filial Centro..."
            required
          />
          <div>
            <Input
              label="Slug (identificador na URL)"
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugEditado(true) }}
              placeholder="Ex: casa-alianca"
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              URL gerada: <span className="font-mono text-brand-600">{BASE_URL}/{slug || 'slug'}/mesa/...</span>
            </p>
          </div>
          <Input
            label="Telefone / WhatsApp"
            type="text"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="(11) 99999-9999"
          />
          <Input
            label="Endereço"
            type="text"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            placeholder="Rua das Flores, 123 - São Paulo, SP"
          />
          <Toggle
            checked={ativo}
            onChange={setAtivo}
            label="Empresa ativa"
          />
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Empresa"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Todos os dados vinculados (mesas, pratos, pedidos) serão afetados.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
