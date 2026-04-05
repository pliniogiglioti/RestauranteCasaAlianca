import { useState, useEffect, useRef } from 'react'
import { Settings, Save, Store, Upload, Phone, MapPin, X, Monitor, Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { upsertConfiguracao } from '@/services/configuracoes'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import toast from 'react-hot-toast'

const DOWNLOAD_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/downloads/RestauranteCasaAliancaSetup.exe`

function DownloadAppCard() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-4">
        <Monitor size={15} className="text-brand-500" />
        App Desktop (Windows)
      </h2>

      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isElectron ? 'bg-green-50' : 'bg-gray-100'}`}>
          <Monitor size={20} className={isElectron ? 'text-green-500' : 'text-gray-400'} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">RestauranteCasaAliancaSetup.exe</p>
          <p className={`text-xs mt-0.5 ${isElectron ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
            {isElectron ? '● App aberto neste computador' : '○ App não detectado neste computador'}
          </p>
        </div>
        <a
          href={DOWNLOAD_URL}
          download="RestauranteCasaAliancaSetup.exe"
          className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-xl transition-colors shrink-0"
        >
          <Download size={15} />
          Baixar
        </a>
      </div>
    </div>
  )
}

export function ConfiguracoesPage() {
  const { id, nomeRestaurante, slogan, iconeApp, iconeUrl, telefone, endereco, fetch: fetchConfig, setConfig } =
    useConfiguracoes()

  const [nome, setNome] = useState(nomeRestaurante)
  const [sloganVal, setSloganVal] = useState(slogan)
  const [icone, setIcone] = useState(iconeApp)
  const [iconeUrlVal, setIconeUrlVal] = useState(iconeUrl)
  const [tel, setTel] = useState(telefone)
  const [end, setEnd] = useState(endereco)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setNome(nomeRestaurante)
    setSloganVal(slogan)
    setIcone(iconeApp)
    setIconeUrlVal(iconeUrl)
    setTel(telefone)
    setEnd(endereco)
  }, [nomeRestaurante, slogan, iconeApp, iconeUrl, telefone, endereco])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem PNG, JPG ou WebP')
      return
    }

    try {
      setUploading(true)
      const ext = file.name.split('.').pop()
      const path = `logo/icone-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('imagens')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('imagens').getPublicUrl(path)
      setIconeUrlVal(data.publicUrl)
      toast.success('Imagem carregada!')
    } catch {
      toast.error('Erro ao fazer upload da imagem')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function removerImagem() {
    setIconeUrlVal('')
  }

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
          icone_app: icone.trim() || '🍽️',
          logo_url: iconeUrlVal || null,
          telefone: tel.trim(),
          endereco: end.trim(),
        },
        id ?? undefined
      )

      setConfig({
        nomeRestaurante: nome.trim(),
        slogan: sloganVal.trim(),
        iconeApp: icone.trim() || '🍽️',
        iconeUrl: iconeUrlVal,
        telefone: tel.trim(),
        endereco: end.trim(),
      })
      await fetchConfig()
      toast.success('Configurações salvas!')
    } catch {
      toast.error('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  // O que exibir no preview: imagem > emoji
  const exibeImagem = !!iconeUrlVal
  const exibeEmoji = icone || '🍽️'

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
        <div className="shrink-0 flex items-center justify-center w-16 h-16">
          {exibeImagem ? (
            <img src={iconeUrlVal} alt="ícone" className="w-full h-full object-contain" />
          ) : (
            <span className="text-5xl leading-none">{exibeEmoji}</span>
          )}
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
            <Upload size={15} className="text-brand-500" />
            Ícone do aplicativo
          </h2>

          {/* Upload de imagem */}
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Envie uma imagem PNG, JPG ou WebP. Ela aparece no cabeçalho, boas-vindas e painel admin.
            </p>

            {iconeUrlVal ? (
              /* Imagem carregada */
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-200 shrink-0">
                  <img src={iconeUrlVal} alt="ícone" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 mb-2">Imagem carregada</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <Upload size={12} />
                      {uploading ? 'Enviando...' : 'Trocar imagem'}
                    </button>
                    <button
                      type="button"
                      onClick={removerImagem}
                      className="text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <X size={12} />
                      Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Área de upload */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-xl py-8 flex flex-col items-center gap-2 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 group-hover:bg-brand-50 flex items-center justify-center transition-colors">
                  {uploading ? (
                    <svg className="animate-spin h-5 w-5 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <Upload size={20} className="text-gray-400 group-hover:text-brand-500 transition-colors" />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-brand-600 transition-colors">
                    {uploading ? 'Enviando...' : 'Clique para enviar o ícone'}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">PNG, JPG ou WebP</p>
                </div>
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleUpload}
              className="hidden"
            />
          </div>

          {/* Fallback emoji (usado se não houver imagem) */}
          {!iconeUrlVal && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ou use um emoji como fallback
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={icone}
                  onChange={(e) => setIcone(e.target.value)}
                  placeholder="🍽️"
                  maxLength={4}
                  className="w-20 rounded-xl border border-gray-300 px-3 py-2.5 text-2xl text-center placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-400">Usado quando não há imagem enviada.</p>
              </div>
            </div>
          )}
        </div>

        {/* Contato */}
        <div className="p-5 space-y-4">
          <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
            <Phone size={15} className="text-brand-500" />
            Contato (opcional)
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefone / WhatsApp</label>
            <input
              type="text"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              placeholder="(11) 99999-9999"
              className="block w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <MapPin size={13} />
              Endereço
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

      {/* App Desktop Download */}
      <DownloadAppCard />

      {/* Botão salvar */}
      <button
        onClick={handleSalvar}
        disabled={saving || uploading}
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
