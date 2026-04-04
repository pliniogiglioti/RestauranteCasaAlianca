import { useState, useEffect } from 'react'
import { Settings, Save, Store, Smile, Phone, MapPin } from 'lucide-react'
import { upsertConfiguracao } from '@/services/configuracoes'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import toast from 'react-hot-toast'

const ICONES_SUGERIDOS = [
  '🍽️', '🍴', '🥘', '🥗', '🍕', '🍔', '🌮', '🥩',
  '🍳', '🦐', '🍜', '🍝', '🍣', '🥂', '🍷', '☕',
  '🏠', '⭐', '🌟', '🎉', '🍰', '🥗', '🫕', '🫙',
]

export function ConfiguracoesPage() {
  const { id, nomeRestaurante, slogan, iconeApp, telefone, endereco, fetch: fetchConfig, setConfig } =
    useConfiguracoes()

  const [nome, setNome] = useState(nomeRestaurante)
  const [sloganVal, setSloganVal] = useState(slogan)
  const [icone, setIcone] = useState(iconeApp)
  const [iconeCustom, setIconeCustom] = useState('')
  const [tel, setTel] = useState(telefone)
  const [end, setEnd] = useState(endereco)
  const [saving, setSaving] = useState(false)

  // Sincroniza quando o store carrega dados do banco
  useEffect(() => {
    setNome(nomeRestaurante)
    setSloganVal(slogan)
    setIcone(iconeApp)
    setTel(telefone)
    setEnd(endereco)
  }, [nomeRestaurante, slogan, iconeApp, telefone, endereco])

  const iconeAtual = iconeCustom.trim() || icone

  async function handleSalvar() {
    if (!nome.trim()) {
      toast.error('Nome do restaurante é obrigatório')
      return
    }

    try {
      setSaving(true)
      await upsertConfiguracao(
        {
          nome_restaurante: nome.trim(),
          slogan: sloganVal.trim(),
          icone_app: iconeAtual,
          telefone: tel.trim(),
          endereco: end.trim(),
        },
        id ?? undefined
      )

      // Atualiza o store global para refletir imediatamente em todos os lugares
      setConfig({
        nomeRestaurante: nome.trim(),
        slogan: sloganVal.trim(),
        iconeApp: iconeAtual,
        telefone: tel.trim(),
        endereco: end.trim(),
      })
      // Re-fetch para pegar o id gerado se era insert
      await fetchConfig()

      setIconeCustom('')
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings size={22} className="text-brand-500" />
          Configurações
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Personalize o nome, ícone e informações do restaurante.
        </p>
      </div>

      {/* Preview */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 flex items-center gap-4 shadow-lg">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/30 shrink-0">
          <span className="text-4xl leading-none">{iconeAtual}</span>
        </div>
        <div>
          <p className="text-white font-bold text-xl leading-tight">{nome || 'Nome do Restaurante'}</p>
          <p className="text-gray-400 text-sm mt-0.5">{sloganVal || 'Seu slogan aqui'}</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">

        {/* Nome e Slogan */}
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Store size={15} className="text-brand-500" />
            Identidade
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome do restaurante
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Casa Aliança"
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Slogan / Descrição curta
            </label>
            <input
              type="text"
              value={sloganVal}
              onChange={(e) => setSloganVal(e.target.value)}
              placeholder="Ex: Sabores que aquecem o coração"
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Ícone */}
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Smile size={15} className="text-brand-500" />
            Ícone do aplicativo
          </h2>

          <p className="text-xs text-gray-500">
            Aparece no cabeçalho do cardápio, tela de boas-vindas e painel admin.
          </p>

          {/* Grid de sugestões */}
          <div className="grid grid-cols-8 gap-2">
            {ICONES_SUGERIDOS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => { setIcone(emoji); setIconeCustom('') }}
                className={`
                  aspect-square rounded-xl text-2xl flex items-center justify-center transition-all
                  ${icone === emoji && !iconeCustom
                    ? 'bg-brand-100 ring-2 ring-brand-400 scale-110 shadow-sm'
                    : 'bg-gray-50 hover:bg-gray-100 hover:scale-105'}
                `}
              >
                {emoji}
              </button>
            ))}
          </div>

          {/* Input customizado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ou digite qualquer emoji
            </label>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={iconeCustom}
                onChange={(e) => setIconeCustom(e.target.value)}
                placeholder="🍕"
                maxLength={4}
                className="w-24 rounded-xl border border-gray-300 px-4 py-2.5 text-2xl text-center placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
              />
              {iconeCustom.trim() && (
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
                    <span className="text-xl">{iconeCustom.trim()}</span>
                  </div>
                  <span className="text-xs text-green-600 font-medium">✓ será usado este</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Contato */}
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Phone size={15} className="text-brand-500" />
            Contato (opcional)
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              placeholder="(11) 99999-9999"
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                Endereço
              </span>
            </label>
            <input
              type="text"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              placeholder="Rua das Flores, 123 - São Paulo, SP"
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Botão salvar */}
      <button
        onClick={handleSalvar}
        disabled={saving}
        className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand-200 transition-all flex items-center justify-center gap-2"
      >
        {saving ? (
          <>
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Salvando...
          </>
        ) : (
          <>
            <Save size={18} />
            Salvar configurações
          </>
        )}
      </button>
    </div>
  )
}
