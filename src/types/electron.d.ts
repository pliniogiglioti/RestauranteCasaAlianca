// Type declarations for the Electron preload API exposed via contextBridge
interface ElectronAPI {
  printPedido: (pedidoId: string) => Promise<{ ok: boolean }>
  getHistoricoPedidos: () => Promise<Array<{
    id: string
    mesa: { numero: number } | null
    valor_total: number
    impressoEm: string
  }>>
  getPrinters: () => Promise<Array<{ name: string; isDefault: boolean }>>
  getImpressora: () => Promise<string>
  setImpressora: (printerName: string) => Promise<{ ok: boolean }>
  openPrinterSelector: () => Promise<void>
  printRelatorio: (html: string) => Promise<{ ok: boolean }>
  openTvWindow: () => Promise<{ ok: boolean }>
  setLoja: (lojaId: string) => Promise<{ ok: boolean }>
  getLoja: () => Promise<string>
  getAutoPrint: () => Promise<boolean>
  setAutoPrint: (enabled: boolean) => Promise<{ ok: boolean }>
  onNovoPedidoImpresso: (
    callback: (data: { id: string; mesa: { numero: number } | null; valor_total: number; impressoEm: string }) => void
  ) => void
  onImpressoraAtualizada: (callback: (name: string) => void) => void
  onAutoPrintAtualizado: (callback: (enabled: boolean) => void) => void
  removeNovoPedidoImpressoListener: () => void
  removeImpressoraAtualizadaListener: () => void
  removeAutoPrintAtualizadoListener: () => void
}

interface Window {
  electronAPI?: ElectronAPI
}
