import { useEffect, useState, useRef } from 'react'
import { Plus, Edit2, Trash2, Search, Star, ImageIcon } from 'lucide-react'
import { getPratos, createPrato, updatePrato, deletePrato, uploadImagemPrato } from '@/services/pratos'
import { getCategoriasAtivas } from '@/services/categorias'
import { PageHeader } from '@/components/admin/PageHeader'
import { Button } from '@/components/ui/Button'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { Badge } from '@/components/ui/Badge'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { DIAS_SEMANA, formatCurrency } from '@/types'
import type { Prato, Categoria, DiaSemana } from '@/types'
import { formatDiaPromocional, hasPromocaoConfigurada } from '@/lib/pricing'
import { currencyInputToNumber, formatCurrencyInput, numberToCurrencyInput } from '@/lib/currency'
import toast from 'react-hot-toast'

type PratoComCat = Prato & { categoria: Categoria | null }

export function PratosPage() {
  const [pratos, setPratos] = useState<PratoComCat[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<PratoComCat | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PratoComCat | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Form
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [preco, setPreco] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [ativo, setAtivo] = useState(true)
  const [pratoDoDia, setPratoDoDia] = useState(false)
  const [diaPratoDoDia, setDiaPratoDoDia] = useState<DiaSemana | ''>('')
  const [promocaoAtiva, setPromocaoAtiva] = useState(false)
  const [precoPromocional, setPrecoPromocional] = useState('')
  const [diaPromocional, setDiaPromocional] = useState<DiaSemana | ''>('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [novaImagem, setNovaImagem] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')

  async function carregar() {
    try {
      const [pratosData, catsData] = await Promise.all([getPratos(), getCategoriasAtivas()])
      setPratos(pratosData as PratoComCat[])
      setCategorias(catsData)
    } catch {
      toast.error('Erro ao carregar pratos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirModal(prato?: PratoComCat) {
    if (prato) {
      setEditando(prato)
      setNome(prato.nome)
      setDescricao(prato.descricao ?? '')
      setPreco(numberToCurrencyInput(prato.preco))
      setCategoriaId(prato.categoria_id ?? '')
      setAtivo(prato.ativo)
      setPratoDoDia(prato.prato_do_dia)
      setDiaPratoDoDia(prato.dia_prato_do_dia ?? '')
      setPromocaoAtiva(hasPromocaoConfigurada(prato))
      setPrecoPromocional(numberToCurrencyInput(prato.preco_promocional))
      setDiaPromocional(prato.dia_promocional ?? '')
      setImagemUrl(prato.imagem_url ?? '')
      setPreviewUrl(prato.imagem_url ?? '')
    } else {
      setEditando(null)
      setNome('')
      setDescricao('')
      setPreco(formatCurrencyInput('0'))
      setCategoriaId('')
      setAtivo(true)
      setPratoDoDia(false)
      setDiaPratoDoDia('')
      setPromocaoAtiva(false)
      setPrecoPromocional(formatCurrencyInput('0'))
      setDiaPromocional('')
      setImagemUrl('')
      setPreviewUrl('')
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
    const precoBase = currencyInputToNumber(preco)
    const precoPromo = currencyInputToNumber(precoPromocional)

    if (!nome.trim() || precoBase <= 0) {
      toast.error('Nome e preço são obrigatórios')
      return
    }

    if (pratoDoDia && !diaPratoDoDia) {
      toast.error('Selecione o dia do prato do dia')
      return
    }

    if (promocaoAtiva && (!precoPromocional || !diaPromocional)) {
      toast.error('Preencha o valor e o dia da promoção')
      return
    }

    if (promocaoAtiva && precoPromo <= 0) {
      toast.error('Informe um preço promocional válido')
      return
    }

    if (promocaoAtiva && precoPromo >= precoBase) {
      toast.error('O preço promocional deve ser menor que o preço original')
      return
    }

    try {
      setSaving(true)
      let finalImagemUrl = imagemUrl

      const pratoPayload = {
        nome,
        descricao: descricao || null,
        imagem_url: finalImagemUrl || null,
        preco: precoBase,
        preco_promocional: promocaoAtiva ? precoPromo : null,
        dia_promocional: (promocaoAtiva && diaPromocional ? diaPromocional : null) as DiaSemana | null,
        categoria_id: categoriaId || null,
        ativo,
        prato_do_dia: pratoDoDia,
        dia_prato_do_dia: (pratoDoDia && diaPratoDoDia ? diaPratoDoDia : null) as DiaSemana | null,
      }

      if (editando) {
        const updated = await updatePrato(editando.id, pratoPayload)
        if (novaImagem) {
          finalImagemUrl = await uploadImagemPrato(novaImagem, updated.id)
          await updatePrato(updated.id, { imagem_url: finalImagemUrl })
        }
        toast.success('Prato atualizado!')
      } else {
        const created = await createPrato(pratoPayload)
        if (novaImagem) {
          finalImagemUrl = await uploadImagemPrato(novaImagem, created.id)
          await updatePrato(created.id, { imagem_url: finalImagemUrl })
        }
        toast.success('Prato criado!')
      }

      setModalOpen(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar prato')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await deletePrato(deleteTarget.id)
      toast.success('Prato excluído!')
      setDeleteTarget(null)
      carregar()
    } catch {
      toast.error('Erro ao excluir prato')
    } finally {
      setDeleting(false)
    }
  }

  async function toggleAtivo(prato: PratoComCat) {
    try {
      await updatePrato(prato.id, { ativo: !prato.ativo })
      setPratos((prev) =>
        prev.map((p) => (p.id === prato.id ? { ...p, ativo: !p.ativo } : p))
      )
    } catch {
      toast.error('Erro ao atualizar status')
    }
  }

  const pratosFiltrados = pratos.filter((p) =>
    (!search ||
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      p.categoria?.nome.toLowerCase().includes(search.toLowerCase())) &&
    (!categoriaFiltro || p.categoria_id === categoriaFiltro)
  )

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pratos"
        subtitle={`${pratos.length} prato${pratos.length !== 1 ? 's' : ''} cadastrado${pratos.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={() => abrirModal()}>
            <Plus size={16} />
            Novo Prato
          </Button>
        }
      />

      {/* Search */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar prato..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          />
        </div>
        <div className="w-full md:max-w-xs">
          <Select
            label="Filtrar por categoria"
            value={categoriaFiltro}
            onChange={(e) => setCategoriaFiltro(e.target.value)}
            options={categorias.map((c) => ({ value: c.id, label: `${c.icone ?? '📋'} ${c.nome}` }))}
            placeholder="Todas as categorias"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Prato</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden sm:table-cell">Categoria</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Preço</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden lg:table-cell">Promoção</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide hidden md:table-cell">Dia</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pratosFiltrados.map((prato) => (
                <tr key={prato.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                        {prato.imagem_url ? (
                          <img src={prato.imagem_url} alt={prato.nome} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <ImageIcon size={16} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{prato.nome}</p>
                        {prato.prato_do_dia && (
                          <div className="flex items-center gap-1 mt-0.5">
                            <Star size={10} className="text-gold-500 fill-gold-500" />
                            <span className="text-xs text-gold-600 font-medium">Prato do Dia</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-500 text-xs">
                      {prato.categoria?.icone} {prato.categoria?.nome ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-gray-900">{formatCurrency(prato.preco)}</span>
                      {hasPromocaoConfigurada(prato) && (
                        <span className="text-xs font-medium text-green-600">
                          {formatCurrency(prato.preco_promocional ?? 0)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {hasPromocaoConfigurada(prato) ? (
                      <div className="flex flex-col items-center gap-1">
                        <Badge variant="success" size="sm">
                          {formatDiaPromocional(prato.dia_promocional)}
                        </Badge>
                        <span className="text-[11px] font-semibold text-green-600">
                          {formatCurrency(prato.preco_promocional ?? 0)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    {prato.dia_prato_do_dia ? (
                      <Badge variant="warning" size="sm">
                        {DIAS_SEMANA.find((d) => d.value === prato.dia_prato_do_dia)?.label.split('-')[0]}
                      </Badge>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Toggle checked={prato.ativo} onChange={() => toggleAtivo(prato)} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => abrirModal(prato)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(prato)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pratosFiltrados.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-sm">
              Nenhum prato encontrado
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Prato' : 'Novo Prato'}
        size="lg"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar Prato'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Image upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Imagem</label>
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
                </div>
              )}
              {previewUrl && (
                <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-sm font-medium">Alterar imagem</span>
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

          <Input label="Nome do Prato" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Picanha Grelhada" required />
          <Textarea label="Descrição" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descreva o prato..." rows={3} />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Preço (R$)"
              type="text"
              inputMode="numeric"
              value={preco}
              onChange={(e) => setPreco(formatCurrencyInput(e.target.value))}
              placeholder="R$ 0,00"
              required
            />
            <Select
              label="Categoria"
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              options={categorias.map((c) => ({ value: c.id, label: `${c.icone ?? ''} ${c.nome}` }))}
              placeholder="Selecionar..."
            />
          </div>

          <div className="space-y-3 pt-1">
            <Toggle checked={ativo} onChange={setAtivo} label="Prato ativo (visível no cardápio)" />
            <Toggle checked={pratoDoDia} onChange={setPratoDoDia} label="Marcar como Prato do Dia" />
            <Toggle checked={promocaoAtiva} onChange={setPromocaoAtiva} label="Ativar promoção por dia da semana" />
          </div>

          {pratoDoDia && (
            <Select
              label="Dia da Semana"
              value={diaPratoDoDia}
              onChange={(e) => setDiaPratoDoDia(e.target.value as DiaSemana)}
              options={DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label }))}
              placeholder="Selecionar dia..."
            />
          )}

          {promocaoAtiva && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-green-100 bg-green-50/70 p-4 sm:grid-cols-2">
              <Input
                label="Preço promocional (R$)"
                type="text"
                inputMode="numeric"
                value={precoPromocional}
                onChange={(e) => setPrecoPromocional(formatCurrencyInput(e.target.value))}
                placeholder="R$ 0,00"
                required
              />
              <Select
                label="Dia da promoção"
                value={diaPromocional}
                onChange={(e) => setDiaPromocional(e.target.value as DiaSemana)}
                options={DIAS_SEMANA.map((d) => ({ value: d.value, label: d.label }))}
                placeholder="Selecionar dia..."
              />
            </div>
          )}
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Prato"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome}"?`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
