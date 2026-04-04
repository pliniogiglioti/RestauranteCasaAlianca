import { useState } from 'react'
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
} from 'lucide-react'
import { signOut } from '@/hooks/useAuth'
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { AppIcon } from '@/components/ui/AppIcon'
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
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/admin/login')
    } catch {
      toast.error('Erro ao sair')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-gray-900 min-h-screen fixed left-0 top-0 z-30">
        <SidebarContent onSignOut={handleSignOut} onClose={() => setSidebarOpen(false)} />
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-72 bg-gray-900 min-h-screen z-50 animate-slide-down">
            <SidebarContent
              onSignOut={handleSignOut}
              onClose={() => setSidebarOpen(false)}
              showClose
            />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-20 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
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

function MobileHeaderLogo() {
  const { nomeRestaurante } = useConfiguracoes()
  return (
    <div className="flex items-center gap-2">
      <AppIcon size="sm" />
      <span className="font-semibold text-gray-900 text-sm">{nomeRestaurante} Admin</span>
    </div>
  )
}

function SidebarContent({
  onSignOut,
  onClose,
  showClose = false,
}: {
  onSignOut: () => void
  onClose: () => void
  showClose?: boolean
}) {
  const { nomeRestaurante } = useConfiguracoes()

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <AppIcon size="md" />
          <div>
            <p className="text-white font-semibold text-sm leading-tight">{nomeRestaurante}</p>
            <p className="text-gray-400 text-xs">Painel Admin</p>
          </div>
        </div>
        {showClose && (
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white">
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
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} />
                <span className="flex-1">{item.label}</span>
                {isActive && <ChevronRight size={14} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 border-t border-gray-800">
        <button
          onClick={onSignOut}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
        >
          <LogOut size={18} />
          Sair
        </button>
      </div>
    </>
  )
}
