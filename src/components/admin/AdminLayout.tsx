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
} from 'lucide-react'
import { signOut } from '@/hooks/useAuth'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

const navItems = [
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
      const { count, error } = await supabase
        .from('pedidos')
        .select('id', { count: 'exact', head: true })
        .neq('status', 'finalizado')

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
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#f7f7f7] border-r border-[#d6d6d6] min-h-screen fixed left-0 top-0 z-30">
        <SidebarContent
          onSignOut={handleSignOut}
          onClose={() => setSidebarOpen(false)}
          pendingOrdersCount={pendingOrdersCount}
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
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI

  function handleClick() {
    onClose()
    if (isElectron) {
      void window.electronAPI!.openTvWindow()
    } else {
      window.open('/tv', '_blank')
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
  showClose = false,
}: {
  onSignOut: () => void
  onClose: () => void
  pendingOrdersCount: number
  showClose?: boolean
}) {
  const { nomeRestaurante } = useConfiguracoes()

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

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
