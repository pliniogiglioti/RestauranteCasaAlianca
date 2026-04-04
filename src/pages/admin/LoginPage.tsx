import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { signIn, useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-brand-500/30">
            <UtensilsCrossed size={30} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white font-display">Casa Aliana</h1>
          <p className="text-gray-400 text-sm mt-1">Painel Administrativo</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-6 shadow-2xl">
          <h2 className="text-lg font-bold text-gray-900 mb-5">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                  className="block w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent transition-all"
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

        <p className="text-center text-gray-500 text-xs mt-6">
          Acesso restrito aos administradores do restaurante
        </p>
      </div>
    </div>
  )
}
