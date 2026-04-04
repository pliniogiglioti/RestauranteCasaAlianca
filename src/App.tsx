import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Client pages
import { WelcomePage } from '@/pages/client/WelcomePage'
import { MenuPage } from '@/pages/client/MenuPage'
import { OrderSummaryPage } from '@/pages/client/OrderSummaryPage'
import { OrderStatusPage } from '@/pages/client/OrderStatusPage'

// Admin pages
import { LoginPage } from '@/pages/admin/LoginPage'
import { DashboardPage } from '@/pages/admin/DashboardPage'
import { MesasPage } from '@/pages/admin/MesasPage'
import { CategoriasPage } from '@/pages/admin/CategoriasPage'
import { PratosPage } from '@/pages/admin/PratosPage'
import { BannersPage } from '@/pages/admin/BannersPage'
import { PedidosPage } from '@/pages/admin/PedidosPage'
import { ConfiguracoesPage } from '@/pages/admin/ConfiguracoesPage'

// Admin layout & guard
import { AdminLayout } from '@/components/admin/AdminLayout'
import { ProtectedRoute } from '@/components/admin/ProtectedRoute'

// Config hook
import { useConfiguracoes } from '@/hooks/useConfiguracoes'
import { usePedidoAtivo } from '@/hooks/usePedidoAtivo'
import { supabase } from '@/lib/supabase'

// Carrega configurações do banco uma vez ao iniciar o app
function ConfigProvider({ children }: { children: React.ReactNode }) {
  const fetch = useConfiguracoes((s) => s.fetch)
  useEffect(() => { void fetch() }, [fetch])
  return <>{children}</>
}

// Escuta o Realtime do pedido ativo em qualquer página.
// Quando o admin finaliza, limpa o pedido do cliente automaticamente.
function PedidoWatcher() {
  const { pedido, limparPedido, atualizarStatus } = usePedidoAtivo()
  const pedidoId = pedido?.pedidoId

  useEffect(() => {
    if (!pedidoId) return

    const channel = supabase
      .channel(`watcher-${pedidoId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `id=eq.${pedidoId}` },
        (payload) => {
          const novo = payload.new as { status: string }
          atualizarStatus(novo.status as import('@/types').StatusPedido)
          if (novo.status === 'finalizado') {
            setTimeout(limparPedido, 4000)
          }
        }
      )
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [pedidoId, limparPedido, atualizarStatus])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ConfigProvider>
        <PedidoWatcher />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#f9fafb' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#f9fafb' },
            },
          }}
        />

        <Routes>
          {/* Client routes */}
          <Route path="/mesa/:slug" element={<WelcomePage />} />
          <Route path="/mesa/:slug/cardapio" element={<MenuPage />} />
          <Route path="/pedido/resumo" element={<OrderSummaryPage />} />
          <Route path="/pedido/status" element={<OrderStatusPage />} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<LoginPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="mesas" element={<MesasPage />} />
            <Route path="categorias" element={<CategoriasPage />} />
            <Route path="pratos" element={<PratosPage />} />
            <Route path="banners" element={<BannersPage />} />
            <Route path="pedidos" element={<PedidosPage />} />
            <Route path="configuracoes" element={<ConfiguracoesPage />} />
          </Route>

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ConfigProvider>
    </BrowserRouter>
  )
}

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="text-center">
        <h1 className="text-6xl font-black text-gray-200 mb-4">404</h1>
        <p className="text-gray-500 font-medium mb-4">Página não encontrada</p>
        <a href="/" className="text-brand-600 font-medium hover:underline">
          Ir para o início
        </a>
      </div>
    </div>
  )
}
