// Type declarations for the Electron preload API exposed via contextBridge
interface ElectronAPI {
  /** Trigger manual print of a specific order by ID */
  printPedido: (pedidoId: string) => Promise<{ ok: boolean }>

  /** Subscribe to auto-print events (fires each time a new order is auto-printed) */
  onNovoPedidoImpresso: (
    callback: (data: { id: string; mesa: { numero: number } | null; valor_total: number }) => void
  ) => void

  /** Remove the onNovoPedidoImpresso listener */
  removeNovoPedidoImpressoListener: () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
