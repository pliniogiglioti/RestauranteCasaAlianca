import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QrCode, ArrowRight, MapPin, User } from 'lucide-react'
import { getMesaBySlug } from '@/services/mesas'
import { useCart } from '@/hooks/useCart'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { usePedidoAtivo } from '@/hooks/usePedidoAtivo'
import { AppIcon } from '@/components/ui/AppIcon'
import type { Mesa } from '@/types'
import { PageLoading } from '@/components/ui/LoadingSpinner'

export function WelcomePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { setMesa, setNomeCliente } = useCart()
  const { pedido, limparPedido } = usePedidoAtivo()
  const { nomeRestaurante, slogan } = useConfiguracoes()
  const [mesa, setMesaData] = useState<Mesa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [nome, setNome] = useState('')

  useEffect(() => {
    const themeMeta = document.querySelector('meta[name="theme-color"]')
    const previous = themeMeta?.getAttribute('content')
    themeMeta?.setAttribute('content', '#f5f5f5')

    return () => {
      if (previous) themeMeta?.setAttribute('content', previous)
    }
  }, [])

  useEffect(() => {
    if (!slug) {
      setError(true)
      setLoading(false)
      return
    }

    getMesaBySlug(slug)
      .then((data) => {
        if (pedido?.status === 'finalizado') {
          limparPedido()
        }
        setMesaData(data)
        setMesa(data.id, data.numero, data.slug)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [slug, setMesa, pedido?.status, limparPedido])

  if (loading) return <PageLoading />

  if (error || !mesa) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
            <QrCode size={28} className="text-brand-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Mesa não encontrada</h2>
          <p className="text-gray-500 text-sm">
            O QR Code escaneado não é válido. Solicite um novo ao garçom.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-orange-100/50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-400/5 blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-sm mx-auto">
        {/* Logo/Icon */}
        <AppIcon size="lg" className="mb-8" />

        {/* Restaurant name */}
        <h1 className="text-3xl font-bold text-gray-900 font-display mb-1">{nomeRestaurante}</h1>
        <p className="text-gray-500 text-sm mb-8">{slogan}</p>

        {/* Mesa badge */}
        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-6 py-4 mb-8 w-full">
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center">
              <MapPin size={18} className="text-brand-500" />
            </div>
            <div className="text-left">
              <p className="text-gray-500 text-xs font-medium">Você está na</p>
              <p className="text-gray-900 font-bold text-xl">Mesa {mesa.numero}</p>
            </div>
          </div>
        </div>

        {/* Welcome text */}
        <div className="mb-6 text-center">
          <p className="text-gray-600 text-base leading-relaxed">
            Bem-vindo ao nosso cardápio digital! Explore nossos pratos e faça seu pedido com facilidade.
          </p>
        </div>

        {/* Nome do cliente */}
        <div className="w-full mb-6">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-50 border border-brand-100 flex items-center justify-center shrink-0">
              <User size={16} className="text-brand-500" />
            </div>
            <input
              type="text"
              placeholder="Seu nome (opcional)"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-base outline-none font-medium"
              maxLength={50}
            />
          </div>
          <p className="text-gray-400 text-xs mt-1.5 px-1">
            Seu nome aparecerá na chamada quando o pedido estiver pronto
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => {
            setNomeCliente(nome.trim())
            navigate(`/mesa/${slug}/cardapio`)
          }}
          className="w-full bg-brand-500 hover:bg-brand-600 active:scale-[0.98] text-white font-bold py-4 px-8 rounded-2xl shadow-xl shadow-brand-500/30 transition-all duration-200 flex items-center justify-center gap-3 text-lg"
        >
          Ver Cardápio
          <ArrowRight size={20} />
        </button>

        <p className="text-gray-400 text-xs mt-6">
          Toque no botão acima para começar a navegar
        </p>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center">
        <div className="flex gap-1.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="rounded-full bg-brand-300/70 animate-pulse-soft"
              style={{
                width: i === 1 ? '20px' : '8px',
                height: '8px',
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
