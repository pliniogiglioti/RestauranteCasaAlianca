'use strict'

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // Impressão manual de um pedido específico
  printPedido: (pedidoId) => ipcRenderer.invoke('print-pedido', pedidoId),

  // Histórico de pedidos impressos
  getHistoricoPedidos: () => ipcRenderer.invoke('get-historico-pedidos'),

  // Impressoras disponíveis no sistema
  getPrinters: () => ipcRenderer.invoke('get-printers'),

  // Impressora atualmente selecionada
  getImpressora: () => ipcRenderer.invoke('get-impressora'),

  // Salvar impressora escolhida pelo renderer
  setImpressora: (printerName) => ipcRenderer.invoke('set-impressora', printerName),

  // Abrir diálogo nativo de seleção de impressora (via menu do tray também)
  openPrinterSelector: () => ipcRenderer.invoke('open-printer-selector'),

  // Imprimir HTML arbitrário (relatório do dia, etc.)
  printRelatorio: (html) => ipcRenderer.invoke('print-relatorio', html),

  // Abrir janela TV de chamada de pedidos
  openTvWindow: () => ipcRenderer.invoke('open-tv-window'),

  // Sincronizar loja selecionada com o processo principal (filtra impressão automática)
  setLoja: (lojaId) => ipcRenderer.invoke('set-loja', lojaId),
  getLoja: () => ipcRenderer.invoke('get-loja'),

  // Evento: novo pedido impresso automaticamente
  onNovoPedidoImpresso: (callback) => {
    ipcRenderer.on('novo-pedido-impresso', (_event, data) => callback(data))
  },

  // Evento: impressora foi alterada (via tray menu)
  onImpressoraAtualizada: (callback) => {
    ipcRenderer.on('impressora-atualizada', (_event, name) => callback(name))
  },

  removeNovoPedidoImpressoListener: () => {
    ipcRenderer.removeAllListeners('novo-pedido-impresso')
  },

  removeImpressoraAtualizadaListener: () => {
    ipcRenderer.removeAllListeners('impressora-atualizada')
  },
})
