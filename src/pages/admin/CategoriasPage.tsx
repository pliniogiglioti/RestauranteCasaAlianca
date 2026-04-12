import { useEffect, useState } from 'react'
import { Plus, Edit2, Trash2, GripVertical, ArrowUp, ArrowDown, ListOrdered } from 'lucide-react'
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  reordenarCategorias,
  gerarSlugCategoria,
} from '@/services/categorias'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import type { Categoria } from '@/types'
import toast from 'react-hot-toast'

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Categoria | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Categoria | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reorderingId, setReorderingId] = useState<string | null>(null)

  // Form
  const [nome, setNome] = useState('')
  const [icone, setIcone] = useState('')
  const [ativo, setAtivo] = useState(true)

  async function carregar() {
    try {
      const data = await getCategorias()
      setCategorias(data)
    } catch {
      toast.error('Erro ao carregar categorias')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(cat?: Categoria) {
    if (cat) {
      setEditando(cat)
      setNome(cat.nome)
      setIcone(cat.icone ?? '')
      setAtivo(cat.ativo)
    } else {
      setEditando(null)
      setNome('')
      setIcone('')
      setAtivo(true)
    }
    setModalOpen(true)
  }

  async function handleSalvar() {
    if (!nome.trim()) {
      toast.error('Nome é obrigatório')
      return
    }

    try {
      setSaving(true)
      const slug = gerarSlugCategoria(nome)
      const ordem = editando?.ordem ?? categorias.length + 1

      if (editando) {
        await updateCategoria(editando.id, { nome, slug, icone: icone || null, ativo, ordem })
        toast.success('Categoria atualizada!')
      } else {
        await createCategoria({ nome, slug, icone: icone || null, ativo, ordem })
        toast.success('Categoria criada!')
      }
      setModalOpen(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar categoria')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deleteCategoria(deleteTarget.id)
      toast.success('Categoria excluída!')
      setDeleteTarget(null)
      carregar()
    } catch {
      toast.error('Não é possível excluir: existem pratos nessa categoria')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleAtivo(cat: Categoria) {
    try {
      await updateCategoria(cat.id, { ativo: !cat.ativo })
      setCategorias((prev) =>
        prev.map((c) => (c.id === cat.id ? { ...c, ativo: !c.ativo } : c))
      )
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  async function moverCategoria(index: number, direction: 'up' | 'down') {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= categorias.length) return

    const reordered = [...categorias]
    const [item] = reordered.splice(index, 1)
    reordered.splice(targetIndex, 0, item)

    setCategorias(reordered.map((categoria, ordemIndex) => ({ ...categoria, ordem: ordemIndex + 1 })))
    setReorderingId(item.id)

    try {
      await reordenarCategorias(reordered.map((categoria) => categoria.id))
      toast.success('Sequência atualizada!')
    } catch {
      toast.error('Erro ao atualizar sequência')
      carregar()
    } finally {
      setReorderingId(null)
    }
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categorias"
        subtitle={`${categorias.length} categoria${categorias.length !== 1 ? 's' : ''}`}
        action={
          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 sm:flex sm:items-center sm:gap-2">
              <ListOrdered size={14} />
              Modo sequência ativo
            </div>
            <Button onClick={() => abrirModal()}>
              <Plus size={16} />
              Nova Categoria
            </Button>
          </div>
        }
      />

      {categorias.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <p className="text-gray-500 font-medium">Nenhuma categoria cadastrada</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="divide-y divide-gray-50">
            {categorias.map((cat, index) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="text-gray-300 cursor-grab">
                  <GripVertical size={16} />
                </div>

                <span className="text-gray-400 text-sm w-5 text-center">{index + 1}</span>

                <span className="text-xl w-8 text-center">{cat.icone ?? '📋'}</span>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">{cat.nome}</p>
                  <p className="text-xs text-gray-400 font-mono">{cat.slug}</p>
                </div>

                <div className="hidden items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 md:flex">
                  <button
                    onClick={() => moverCategoria(index, 'up')}
                    disabled={index === 0 || reorderingId !== null}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Mover para cima"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => moverCategoria(index, 'down')}
                    disabled={index === categorias.length - 1 || reorderingId !== null}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-white hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
                    title="Mover para baixo"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <Toggle
                  checked={cat.ativo}
                  onChange={() => toggleAtivo(cat)}
                />

                <Badge variant={cat.ativo ? 'success' : 'default'} size="sm">
                  {cat.ativo ? 'Ativa' : 'Inativa'}
                </Badge>

                <div className="flex gap-1">
                  <button
                    onClick={() => abrirModal(cat)}
                    className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(cat)}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Categoria' : 'Nova Categoria'}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <Input
            label="Nome da Categoria"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Entradas, Pratos Principais..."
            required
          />
          <Input
            label="Ícone (emoji)"
            value={icone}
            onChange={(e) => setIcone(e.target.value)}
            placeholder="Ex: 🍝 🥩 🥗"
            hint="Cole um emoji para representar esta categoria"
          />
          <Toggle
            checked={ativo}
            onChange={setAtivo}
            label="Categoria ativa (visível no cardápio)"
          />
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Categoria"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? Os pratos vinculados perderão a categoria.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
