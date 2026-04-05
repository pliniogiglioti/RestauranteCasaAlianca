'use strict'

const { contextBridge, ipcRenderer } = require('electron')

// Expose a safe API to the renderer (React app)
contextBridge.exposeInMainWorld('electronAPI', {
  // Trigger manual print of a specific order
  printPedido: (pedidoId) => ipcRenderer.invoke('print-pedido', pedidoId),

  // Listen for auto-print events (called when a new order is printed automatically)
  onNovoPedidoImpresso: (callback) => {
    ipcRenderer.on('novo-pedido-impresso', (_event, data) => callback(data))
  },

  // Remove listener when component unmounts
  removeNovoPedidoImpressoListener: () => {
    ipcRenderer.removeAllListeners('novo-pedido-impresso')
  },
})
