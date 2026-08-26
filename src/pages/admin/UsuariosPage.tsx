import { useEffect, useState } from 'react'
import { Users, Building2, ShieldCheck, Shield, Wallet, Edit2, Plus, Trash2, KeyRound } from 'lucide-react'
import {
  getProfiles,
  criarUsuario,
  atualizarUsuario,
  trocarSenhaUsuario,
  excluirUsuario,
  type UserRole,
} from '@/services/profiles'
import { getLojas } from '@/services/lojas'
import { PageHeader } from '@/components/admin/PageHeader'
import { Modal, ConfirmDialog } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import { useAuth } from '@/hooks/useAuth'
import type { ProfileRow } from '@/types/database'
import type { Loja } from '@/types'
import toast from 'react-hot-toast'

const ROLE_OPTIONS: { value: UserRole; label: string; icon: typeof Shield }[] = [
  { value: 'admin', label: 'Admin', icon: Shield },
  { value: 'caixa', label: 'Caixa', icon: Wallet },
  { value: 'super_admin', label: 'Super Admin', icon: ShieldCheck },
]

function roleLabel(role: UserRole) {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role
}

export function UsuariosPage() {
  const { profile: usuarioLogado } = useAuth()
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)

  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<ProfileRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ProfileRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [senhaTarget, setSenhaTarget] = useState<ProfileRow | null>(null)
  const [novaSenha, setNovaSenha] = useState('')
  const [trocandoSenha, setTrocandoSenha] = useState(false)

  // form criar/editar
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [role, setRole] = useState<UserRole>('admin')
  const [lojaId, setLojaId] = useState<string>('')

  async function carregar() {
    try {
      const [p, l] = await Promise.all([getProfiles(), getLojas()])
      setProfiles(p)
      setLojas(l)
    } catch {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  function abrirCriar() {
    setEditando(null)
    setEmail('')
    setPassword('')
    setNome('')
    setRole('admin')
    setLojaId('')
    setModalOpen(true)
  }

  function abrirEditar(p: ProfileRow) {
    setEditando(p)
    setEmail(p.email)
    setPassword('')
    setNome(p.nome ?? '')
    setRole(p.role)
    setLojaId(p.loja_id ?? '')
    setModalOpen(true)
  }

  async function handleSalvar() {
    if (role !== 'super_admin' && !lojaId) {
      toast.error('Selecione a loja deste usuário')
      return
    }
    try {
      setSaving(true)
      if (editando) {
        const atualizado = await atualizarUsuario(editando.id, {
          role,
          loja_id: role === 'super_admin' ? null : lojaId,
          nome: nome.trim() || null,
        })
        setProfiles((prev) => prev.map((p) => (p.id === atualizado.id ? atualizado : p)))
        toast.success('Usuário atualizado!')
      } else {
        if (!email.trim() || password.length < 6) {
          toast.error('Email e senha (mínimo 6 caracteres) são obrigatórios')
          setSaving(false)
          return
        }
        const criado = await criarUsuario({
          email: email.trim(),
          password,
          nome: nome.trim() || null,
          role,
          loja_id: role === 'super_admin' ? null : lojaId,
        })
        setProfiles((prev) => [...prev, criado].sort((a, b) => a.email.localeCompare(b.email)))
        toast.success('Usuário criado!')
      }
      setModalOpen(false)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  async function handleTrocarSenha() {
    if (!senhaTarget) return
    if (novaSenha.length < 6) {
      toast.error('Senha deve ter no mínimo 6 caracteres')
      return
    }
    try {
      setTrocandoSenha(true)
      await trocarSenhaUsuario(senhaTarget.id, novaSenha)
      toast.success('Senha alterada!')
      setSenhaTarget(null)
      setNovaSenha('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao trocar senha')
    } finally {
      setTrocandoSenha(false)
    }
  }

  async function handleExcluir() {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      await excluirUsuario(deleteTarget.id)
      setProfiles((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast.success('Usuário excluído!')
      setDeleteTarget(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir usuário')
    } finally {
      setDeleting(false)
    }
  }

  function nomeLoja(id: string | null) {
    if (!id) return null
    return lojas.find((l) => l.id === id)?.nome ?? null
  }

  function roleIcon(role: UserRole) {
    if (role === 'super_admin') return <ShieldCheck size={18} className="text-brand-600" />
    if (role === 'caixa') return <Wallet size={18} className="text-emerald-500" />
    return <Shield size={18} className="text-gray-400" />
  }

  function roleBadgeClass(role: UserRole) {
    if (role === 'super_admin') return 'bg-brand-50 text-brand-700'
    if (role === 'caixa') return 'bg-emerald-50 text-emerald-700'
    return 'bg-gray-100 text-gray-600'
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        subtitle={`${profiles.length} usuário${profiles.length !== 1 ? 's' : ''} cadastrado${profiles.length !== 1 ? 's' : ''}`}
        action={
          <Button onClick={abrirCriar} size="md">
            <Plus size={16} />
            Novo Usuário
          </Button>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {profiles.length === 0 && (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        )}
        {profiles.map((p) => {
          const loja = nomeLoja(p.loja_id)
          const souEu = p.id === usuarioLogado?.id
          return (
            <div key={p.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                {roleIcon(p.role)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{p.nome || p.email}</p>
                <p className="text-xs text-gray-400 truncate">{p.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleBadgeClass(p.role)}`}>
                    {roleLabel(p.role)}
                  </span>
                  {loja && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Building2 size={11} /> {loja}
                    </span>
                  )}
                  {p.role !== 'super_admin' && !loja && (
                    <span className="text-xs text-amber-600 font-medium">⚠ Sem loja vinculada</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSenhaTarget(p)}
                title="Trocar senha"
                className="p-2 rounded-xl bg-gray-50 hover:bg-amber-50 text-gray-500 hover:text-amber-600 transition-colors border border-gray-200 hover:border-amber-200 shrink-0"
              >
                <KeyRound size={14} />
              </button>
              <button
                onClick={() => abrirEditar(p)}
                title="Editar"
                className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-200 shrink-0"
              >
                <Edit2 size={14} />
              </button>
              <button
                onClick={() => setDeleteTarget(p)}
                title="Excluir"
                disabled={souEu}
                className="p-2 rounded-xl bg-gray-50 hover:bg-brand-50 text-gray-500 hover:text-brand-600 transition-colors border border-gray-200 hover:border-brand-200 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-50 disabled:hover:text-gray-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Modal criar/editar */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editando ? 'Editar Usuário' : 'Novo Usuário'}
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)} fullWidth>Cancelar</Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>
              {editando ? 'Salvar' : 'Criar Usuário'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {editando ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-0.5">Email</p>
              <p className="text-sm text-gray-500">{editando.email}</p>
            </div>
          ) : (
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@exemplo.com"
              required
            />
          )}

          {!editando && (
            <Input
              label="Senha"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          )}

          <Input
            label="Nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome do usuário"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                    role === r.value
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <r.icon size={16} />
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {role !== 'super_admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loja vinculada <span className="text-brand-500">*</span>
              </label>
              <select
                value={lojaId}
                onChange={(e) => setLojaId(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              >
                <option value="">Selecione uma loja...</option>
                {lojas.map((l) => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
              <p className="text-xs text-gray-400 mt-1">
                {role === 'caixa'
                  ? 'O Caixa só acessa Mesas e Pedidos desta loja.'
                  : 'Este usuário só verá dados desta loja no admin.'}
              </p>
            </div>
          )}

          {role === 'super_admin' && (
            <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
              Super Admin tem acesso a todas as lojas e pode gerenciar usuários.
            </p>
          )}
        </div>
      </Modal>

      {/* Modal trocar senha */}
      <Modal
        isOpen={!!senhaTarget}
        onClose={() => { setSenhaTarget(null); setNovaSenha('') }}
        title="Trocar Senha"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setSenhaTarget(null); setNovaSenha('') }} fullWidth>
              Cancelar
            </Button>
            <Button onClick={handleTrocarSenha} loading={trocandoSenha} fullWidth>
              Trocar Senha
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Nova senha para <span className="font-semibold text-gray-700">{senhaTarget?.email}</span>
          </p>
          <Input
            label="Nova senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
          />
        </div>
      </Modal>

      {/* Confirm delete */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleExcluir}
        title="Excluir Usuário"
        message={`Tem certeza que deseja excluir "${deleteTarget?.nome || deleteTarget?.email}"? Essa ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        loading={deleting}
      />
    </div>
  )
}
