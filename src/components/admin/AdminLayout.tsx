import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  Tag,
  Image,
  ClipboardList,
  TableProperties,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Settings,
  Printer,
  Tv,
  ExternalLink,
  Building2,
  ChevronDown,
  Users,
} from 'lucide-react'
import { signOut, useAuth } from '@/hooks/useAuth'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { useLoja } from '@/hooks/useLoja'
import { getLojas } from '@/services/lojas'
import { AppIcon } from '@/components/ui/AppIcon'
import { supabase } from '@/lib/supabase'
import type { Loja } from '@/types'
import toast from 'react-hot-toast'

const superAdminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
  { to: '/admin/usuarios', label: 'Usuários', icon: Users },
  { to: '/admin/mesas', label: 'Mesas', icon: TableProperties },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag },
  { to: '/admin/pratos', label: 'Pratos', icon: UtensilsCrossed },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/mesas', label: 'Mesas', icon: TableProperties },
  { to: '/admin/categorias', label: 'Categorias', icon: Tag },
  { to: '/admin/pratos', label: 'Pratos', icon: UtensilsCrossed },
  { to: '/admin/banners', label: 'Banners', icon: Image },
  { to: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { to: '/admin/configuracoes', label: 'Configurações', icon: Settings },
]

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0)
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { lojaId, setLoja } = useLoja()

  const isSuperAdmin = profile?.role === 'super_admin'
  // Admin com loja_id vinculada fica fixo na loja dele; sem loja_id vê o seletor
  const hasLojaFixed = profile?.role === 'admin' && !!profile?.loja_id

  // Sincroniza loja atual com Electron ao montar (caso app reiniciou)
  useEffect(() => {
    if (lojaId && typeof window !== 'undefined' && window.electronAPI?.setLoja) {
      void window.electronAPI.setLoja(lojaId)
    }
  }, [lojaId])

  // Admin normal: auto-seta loja do perfil ao carregar
  useEffect(() => {
    if (profile && profile.role === 'admin' && profile.loja_id && !lojaId) {
      void (async () => {
        const { data } = await supabase
          .from('lojas')
          .select('*')
          .eq('id', profile.loja_id)
          .single()
        if (data) setLoja(data.id, data.slug, data.nome)
      })()
    }
  }, [profile, lojaId, setLoja])

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  useEffect(() => {
    let mounted = true

    async function refreshPendingOrdersCount() {
      let query = supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'finalizado')

      // Sempre filtra pela loja selecionada, independente do role
      if (lojaId) {
        query = query.eq('loja_id', lojaId)
      }

      const { count, error } = await query
      if (!error && mounted) {
        setPendingOrdersCount(count ?? 0)
      }
    }

    void refreshPendingOrdersCount()

    const channel = supabase
      .channel('admin-sidebar-pedidos')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'pedidos' },
        async () => {
          void refreshPendingOrdersCount()
          toast.success('Novo pedido recebido!')

          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('Novo pedido recebido', {
                body: 'Acesse Pedidos para atender o novo pedido.',
              })
            } else if (Notification.permission === 'default') {
              void Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                  new Notification('Novo pedido recebido', {
                    body: 'Acesse Pedidos para atender o novo pedido.',
                  })
                }
              })
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos' },
        () => {
          void refreshPendingOrdersCount()
        }
      )
      .subscribe()

    return () => {
      mounted = false
      void supabase.removeChannel(channel)
    }
  }, [isSuperAdmin, lojaId])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#f7f7f7] border-r border-[#d6d6d6] min-h-screen fixed left-0 top-0 z-30">
        <SidebarContent
          onSignOut={handleSignOut}
          onClose={() => setSidebarOpen(false)}
          pendingOrdersCount={pendingOrdersCount}
          isSuperAdmin={isSuperAdmin}
          hasLojaFixed={hasLojaFixed}
        />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-[#f7f7f7] border-r border-[#d6d6d6] min-h-screen z-50 animate-slide-down">
            <SidebarContent
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)}
              pendingOrdersCount={pendingOrdersCount}
              isSuperAdmin={isSuperAdmin}
              hasLojaFixed={hasLojaFixed}
              showClose
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-[#f7f7f7] border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[#474747] hover:bg-[#ebebeb]"
          >
            <Menu size={20} />
          </button>
          <MobileHeaderLogo />
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function LojaSelector({ onClose }: { onClose: () => void }) {
  const { lojaId, lojaNome, setLoja } = useLoja()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getLojas().then((data) => {
      setLojas(data)
      // Auto-seleciona a primeira loja se nenhuma estiver selecionada
      if (!lojaId && data.length > 0) {
        setLoja(data[0].id, data[0].slug, data[0].nome)
      }
    }).catch(() => {})
  }, [lojaId, setLoja])

  if (lojas.length === 0) return null

  return (
    <div className="px-3 pb-3 relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200 hover:bg-brand-100 transition-colors text-left"
      >
        <Building2 size={15} className="text-brand-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-brand-500/70">Empresa ativa</p>
          <p className="text-sm font-semibold text-brand-700 truncate">{lojaNome || 'Selecione...'}</p>
        </div>
        <ChevronDown size={14} className={`text-brand-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {lojas.map((loja) => (
            <button
              key={loja.id}
              onClick={() => {
                setLoja(loja.id, loja.slug, loja.nome)
                setOpen(false)
                onClose()
                toast.success(`Empresa "${loja.nome}" selecionada!`)
              }}
              className={`w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-gray-50 transition-colors text-sm ${
                lojaId === loja.id ? 'bg-brand-50 text-brand-700 font-semibold' : 'text-gray-700'
              }`}
            >
              <Building2 size={14} className={lojaId === loja.id ? 'text-brand-500' : 'text-gray-400'} />
              <span className="flex-1 truncate">{loja.nome}</span>
              {lojaId === loja.id && <ChevronRight size={12} className="text-brand-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function PrinterStatus() {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  return (
    <div className="px-3 pb-2 border-t border-[#d6d6d6] pt-3">
      <div className={`flex items-start gap-3 px-3 py-2 rounded-xl ${!isElectron ? 'bg-amber-50 border border-amber-200' : ''}`}>
        <Printer size={18} className={`mt-0.5 shrink-0 ${isElectron ? 'text-[#3a3a3a]' : 'text-amber-500'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-xs leading-none mb-0.5 ${isElectron ? 'text-[#474747]/70' : 'text-amber-700 font-semibold'}`}>
            {isElectron ? 'App Desktop' : 'Impressora offline'}
          </p>
          <p className={`text-xs font-medium ${isElectron ? 'text-[#3a3a3a]' : 'text-amber-600'}`}>
            {isElectron ? 'Online' : 'Execute o aplicativo Windows para imprimir'}
          </p>
        </div>
      </div>
    </div>
  )
}

function MobileHeaderLogo() {
  const { nomeRestaurante } = useConfiguracoes()
  return (
    <div className="flex items-center gap-2">
      <AppIcon size="sm" />
      <span className="font-semibold text-[#474747] text-sm">{nomeRestaurante} Admin</span>
    </div>
  )
}

function TVButton({ onClose }: { onClose: () => void }) {
  const { lojaSlug } = useLoja()
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  function handleClick() {
    onClose()
    const tvUrl = lojaSlug ? `/${lojaSlug}/tv` : '/tv'
    if (isElectron) {
      void window.electronAPI!.openTvWindow()
    } else {
      window.open(tvUrl, '_blank')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#474747] hover:text-[#113917] hover:bg-[#e8f0ea] transition-all"
    >
      <Tv size={18} className="shrink-0" />
      <span className="flex-1 text-left">TV – Chamada</span>
      <ExternalLink size={13} className="shrink-0 text-[#474747]/50" />
    </button>
  )
}

function SidebarContent({
  onSignOut,
  onClose,
  pendingOrdersCount,
  isSuperAdmin,
  hasLojaFixed,
  showClose = false,
}: {
  onSignOut: () => void
  onClose: () => void
  pendingOrdersCount: number
  isSuperAdmin: boolean
  hasLojaFixed: boolean
  showClose?: boolean
}) {
  const { nomeRestaurante } = useConfiguracoes()
  const { lojaNome } = useLoja()
  const navItems = isSuperAdmin ? superAdminNavItems : adminNavItems

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#d6d6d6]">
        <div className="flex items-center gap-3">
          <AppIcon size="md" />
          <div>
            <p className="text-[#474747] font-semibold text-sm leading-tight">{nomeRestaurante}</p>
            <p className="text-[#474747]/75 text-xs">Painel Admin</p>
          </div>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1.5 text-[#5f5f5f] hover:text-[#2f2f2f]">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Seletor de empresa */}
      <div className="pt-3">
        {hasLojaFixed
          ? (
            <div className="px-3 pb-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-50 border border-brand-200">
                <Building2 size={15} className="text-brand-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-brand-500/70">Empresa</p>
                  <p className="text-sm font-semibold text-brand-700 truncate">{lojaNome}</p>
                </div>
              </div>
            </div>
          )
          : <LojaSelector onClose={onClose} />
        }
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[#113917] text-white shadow-sm'
                  : 'text-[#474747] hover:text-[#113917] hover:bg-[#e8f0ea]'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {item.to === '/admin/pedidos' && pendingOrdersCount > 0 && (
                  <span
                    className={`min-w-5 h-5 px-1 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#113917] text-white'
                    }`}
                  >
                    {pendingOrdersCount > 99 ? '99+' : pendingOrdersCount}
                  </span>
                )}
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}

        {/* Separador + botão TV */}
        <div className="pt-2 mt-2 border-t border-[#d6d6d6]">
          <TVButton onClose={onClose} />
        </div>
      </nav>

      {/* Printer status (Electron only) */}
      <PrinterStatus />

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-[#d6d6d6]">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#474747] hover:text-[#113917] hover:bg-[#e8f0ea] transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  )
}
