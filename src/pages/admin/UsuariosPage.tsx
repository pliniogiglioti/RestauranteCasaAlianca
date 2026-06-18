import { useEffect, useState } from 'react'
import { Users, Building2, ShieldCheck, Shield, Edit2 } from 'lucide-react'
import { getProfiles, updateProfile } from '@/services/profiles'
import { getLojas } from '@/services/lojas'
import { PageHeader } from '@/components/admin/PageHeader'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { SectionLoading } from '@/components/ui/LoadingSpinner'
import type { ProfileRow } from '@/types/database'
import type { Loja } from '@/types'
import toast from 'react-hot-toast'

export function UsuariosPage() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [lojas, setLojas] = useState<Loja[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<ProfileRow | null>(null)
  const [saving, setSaving] = useState(false)

  // form
  const [role, setRole] = useState<'admin' | 'super_admin'>('admin')
  const [lojaId, setLojaId] = useState<string>('')

  useEffect(() => {
    Promise.all([getProfiles(), getLojas()])
      .then(([p, l]) => { setProfiles(p); setLojas(l) })
      .catch(() => toast.error('Erro ao carregar usuários'))
      .finally(() => setLoading(false))
  }, [])

  function abrirModal(profile: ProfileRow) {
    setEditando(profile)
    setRole(profile.role)
    setLojaId(profile.loja_id ?? '')
  }

  async function handleSalvar() {
    if (!editando) return
    if (role === 'admin' && !lojaId) {
      toast.error('Selecione a loja deste usuário')
      return
    }
    try {
      setSaving(true)
      const atualizado = await updateProfile(editando.id, {
        role,
        loja_id: role === 'super_admin' ? null : (lojaId || null),
      })
      setProfiles((prev) => prev.map((p) => p.id === atualizado.id ? atualizado : p))
      toast.success('Usuário atualizado!')
      setEditando(null)
    } catch {
      toast.error('Erro ao salvar usuário')
    } finally {
      setSaving(false)
    }
  }

  function nomeLoja(id: string | null) {
    if (!id) return null
    return lojas.find((l) => l.id === id)?.nome ?? null
  }

  if (loading) return <SectionLoading />

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        subtitle={`${profiles.length} usuário${profiles.length !== 1 ? 's' : ''} cadastrado${profiles.length !== 1 ? 's' : ''}`}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {profiles.length === 0 && (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum usuário encontrado</p>
          </div>
        )}
        {profiles.map((profile) => {
          const loja = nomeLoja(profile.loja_id)
          const isSuperAdmin = profile.role === 'super_admin'
          return (
            <div key={profile.id} className="flex items-center gap-4 p-4">
              <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
                {isSuperAdmin
                  ? <ShieldCheck size={18} className="text-brand-600" />
                  : <Shield size={18} className="text-gray-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{profile.nome || profile.email}</p>
                <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isSuperAdmin ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'}`}>
                    {isSuperAdmin ? 'Super Admin' : 'Admin'}
                  </span>
                  {loja && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Building2 size={11} /> {loja}
                    </span>
                  )}
                  {!isSuperAdmin && !loja && (
                    <span className="text-xs text-amber-600 font-medium">⚠ Sem loja vinculada</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => abrirModal(profile)}
                className="p-2 rounded-xl bg-gray-50 hover:bg-blue-50 text-gray-500 hover:text-blue-600 transition-colors border border-gray-200 hover:border-blue-200 shrink-0"
              >
                <Edit2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={!!editando}
        onClose={() => setEditando(null)}
        title="Editar Usuário"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setEditando(null)} fullWidth>Cancelar</Button>
            <Button onClick={handleSalvar} loading={saving} fullWidth>Salvar</Button>
          </div>
        }
      >
        {editando && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-700 mb-0.5">Email</p>
              <p className="text-sm text-gray-500">{editando.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Perfil</label>
              <div className="grid grid-cols-2 gap-2">
                {(['admin', 'super_admin'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                      role === r
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {r === 'super_admin' ? <ShieldCheck size={15} /> : <Shield size={15} />}
                    {r === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </button>
                ))}
              </div>
            </div>

            {role === 'admin' && (
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
                  Este usuário só verá dados desta loja no admin.
                </p>
              </div>
            )}

            {role === 'super_admin' && (
              <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2">
                Super Admin tem acesso a todas as lojas e pode gerenciar usuários.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
