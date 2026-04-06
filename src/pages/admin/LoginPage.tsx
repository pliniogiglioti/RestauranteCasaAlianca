import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signIn, useAuth } from '@/hooks/useAuth'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const { nomeRestaurante } = useConfiguracoes()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && user) {
      navigate('/admin', { replace: true })
    }
  }, [user, loading, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return

    try {
      setSubmitting(true)
      await signIn(email, password)
      navigate('/admin', { replace: true })
    } catch {
      toast.error('Email ou senha incorretos')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <AppIcon size="lg" className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#474747] font-display">{nomeRestaurante}</h1>
          <p className="text-[#474747]/80 text-sm mt-1">Painel Administrativo</p>
        </div>

        {/* Form */}
        <div className="bg-[#f7f7f7] rounded-3xl p-6 shadow-2xl border border-[#d8d8d8]">
          <h2 className="text-lg font-bold text-[#474747] mb-5">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#474747] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="block w-full rounded-xl border border-[#cfcfcf] bg-white pl-10 pr-4 py-2.5 text-sm text-[#474747] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#474747] mb-1.5">
                Senha
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="block w-full rounded-xl border border-[#cfcfcf] bg-white pl-10 pr-10 py-2.5 text-sm text-[#474747] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3a3a3a] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !password}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-sm transition-all duration-200 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-[#474747]/70 text-xs mt-6">
          Acesso restrito aos administradores do restaurante
        </p>
      </div>
    </div>
  )
}
