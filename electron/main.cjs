'use strict'

const { app, BrowserWindow, Notification, ipcMain, Tray, Menu, nativeImage } = require('electron')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const IS_DEV = process.env.NODE_ENV === 'development'

let mainWindow = null
let supabase = null
let tray = null

// In-memory order history (last 100 orders)
const orderHistory = []

// ---------------------------------------------------------------------------
// Tray icon (16x16 transparent PNG with a small coloured square)
// ---------------------------------------------------------------------------
function getTrayIcon() {
  // Minimal 16x16 PNG: orange square — generated once at startup
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAI0lEQVQ4jWNgGAWDHfz/z8BACoxaMGrBqAWjFgxXC0YBAAeSAAFdzxwJAAAAAElFTkSuQmCC'
  )
  return icon
}

function createTray() {
  tray = new Tray(getTrayIcon())
  tray.setToolTip('Casa Aliança – Restaurante')

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: mainWindow && mainWindow.isVisible() ? 'Ocultar janela' : 'Mostrar janela',
        click: toggleWindow,
      },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ])

  tray.setContextMenu(buildMenu())

  tray.on('click', toggleWindow)
  tray.on('right-click', () => {
    tray.setContextMenu(buildMenu())
    tray.popUpContextMenu()
  })
}

function toggleWindow() {
  if (!mainWindow) {
    createMainWindow()
    return
  }
  if (mainWindow.isVisible()) {
    mainWindow.hide()
  } else {
    mainWindow.show()
    mainWindow.focus()
  }
}

// ---------------------------------------------------------------------------
// Main window
// ---------------------------------------------------------------------------
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Casa Aliana – Restaurante',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Minimise to tray instead of closing
  mainWindow.on('close', (e) => {
    if (!app.isQuiting) {
      e.preventDefault()
      mainWindow.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------------------------------------------------------------------
// Receipt HTML generator
// ---------------------------------------------------------------------------
function generateReceiptHTML(pedido) {
  const mesa = pedido.mesa || {}
  const itens = pedido.itens || []
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const shortId = (pedido.id || '').substring(0, 8).toUpperCase()

  const itensHTML = itens
    .map(
      (item) => `
    <tr>
      <td class="qty">${item.quantidade}x</td>
      <td class="name">${item.nome_prato}</td>
      <td class="price">R$&nbsp;${Number(item.preco_unitario).toFixed(2)}</td>
      <td class="price">R$&nbsp;${(Number(item.preco_unitario) * Number(item.quantidade)).toFixed(2)}</td>
    </tr>
    ${
      item.observacao_item
        ? `<tr><td colspan="4" class="obs">  &rarr; ${item.observacao_item}</td></tr>`
        : ''
    }
  `
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      padding: 8px;
      color: #000;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .header h1 { font-size: 16px; font-weight: bold; letter-spacing: 1px; }
    .header p { font-size: 11px; }
    .divider { border-top: 1px dashed #000; margin: 6px 0; }
    .info { margin-bottom: 6px; }
    .info p { font-size: 11px; }
    table { width: 100%; border-collapse: collapse; }
    th { font-size: 10px; text-align: left; border-bottom: 1px solid #000; padding-bottom: 3px; }
    td { font-size: 11px; padding: 2px 0; vertical-align: top; }
    td.qty { width: 30px; }
    td.price { text-align: right; white-space: nowrap; }
    td.name { padding: 0 4px; }
    td.obs { font-size: 10px; font-style: italic; color: #444; padding-left: 8px; }
    .total-row td { font-size: 13px; font-weight: bold; border-top: 1px solid #000; padding-top: 4px; }
    .obs-geral { margin-top: 6px; font-size: 11px; font-style: italic; }
    .footer { text-align: center; margin-top: 8px; font-size: 10px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>CASA ALIANA</h1>
    <p>Restaurante</p>
  </div>
  <div class="divider"></div>
  <div class="info">
    <p><strong>Mesa:</strong> ${mesa.numero || '—'}</p>
    <p><strong>Pedido:</strong> #${shortId}</p>
    <p><strong>Data/Hora:</strong> ${now}</p>
  </div>
  <div class="divider"></div>
  <table>
    <thead>
      <tr>
        <th>Qtd</th>
        <th>Item</th>
        <th style="text-align:right">Unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itensHTML}
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3">TOTAL</td>
        <td class="price">R$&nbsp;${Number(pedido.valor_total || 0).toFixed(2)}</td>
      </tr>
    </tfoot>
  </table>
  ${
    pedido.observacao_geral
      ? `<div class="divider"></div><p class="obs-geral"><strong>Obs:</strong> ${pedido.observacao_geral}</p>`
      : ''
  }
  <div class="divider"></div>
  <div class="footer">Obrigado pela preferência!</div>
  <script>
    // Auto-print and close as soon as the page is rendered
    window.onload = function () {
      window.print()
    }
  </script>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Print logic
// ---------------------------------------------------------------------------
async function printOrder(pedidoBasico) {
  if (!supabase) return

  try {
    // Fetch full order details (the realtime payload only has the base row)
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, mesa:mesas(*), itens:pedido_itens(*)')
      .eq('id', pedidoBasico.id)
      .single()

    if (error || !data) {
      console.error('[print] Erro ao buscar pedido:', error)
      return
    }

    const html = generateReceiptHTML(data)

    const printWin = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })

    // Use a data URL so no file-system write is needed
    await printWin.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html))

    printWin.webContents.print(
      { silent: true, printBackground: false, deviceName: '' },
      (success, reason) => {
        if (!success) console.warn('[print] Falha na impressão:', reason)
        else console.log(`[print] Pedido #${data.id.substring(0, 8)} impresso com sucesso`)
        // Close after a short delay to allow the print job to spool
        setTimeout(() => printWin.destroy(), 2000)
      }
    )

    // Desktop notification
    if (Notification.isSupported()) {
      const mesa = data.mesa ? `Mesa ${data.mesa.numero}` : 'Mesa desconhecida'
      new Notification({
        title: 'Novo Pedido Recebido!',
        body: `${mesa} — R$ ${Number(data.valor_total).toFixed(2)} — imprimindo...`,
      }).show()
    }

    // Record in history (keep last 100)
    const historyEntry = {
      id: data.id,
      mesa: data.mesa,
      valor_total: data.valor_total,
      impressoEm: new Date().toISOString(),
    }
    orderHistory.unshift(historyEntry)
    if (orderHistory.length > 100) orderHistory.pop()

    // Also notify the renderer so it can show a toast / update history
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('novo-pedido-impresso', historyEntry)
    }
  } catch (err) {
    console.error('[print] Erro inesperado:', err)
  }
}

// ---------------------------------------------------------------------------
// Supabase Realtime subscription
// ---------------------------------------------------------------------------
async function setupRealtimeOrders() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      '[realtime] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados no .env — impressão automática desabilitada.'
    )
    return
  }

  // Dynamic import handles ESM-only packages from CommonJS context
  const { createClient } = await import('@supabase/supabase-js')
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  supabase
    .channel('auto-print-pedidos')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'pedidos' },
      (payload) => {
        console.log('[realtime] Novo pedido detectado:', payload.new?.id)
        printOrder(payload.new)
      }
    )
    .subscribe((status) => {
      console.log('[realtime] Status do canal:', status)
    })

  console.log('[realtime] Escutando novos pedidos para impressão automática...')
}

// ---------------------------------------------------------------------------
// IPC: impressão manual a partir do renderer
// ---------------------------------------------------------------------------
ipcMain.handle('print-pedido', async (_event, pedidoId) => {
  await printOrder({ id: pedidoId })
  return { ok: true }
})

// ---------------------------------------------------------------------------
// IPC: histórico de pedidos impressos
// ---------------------------------------------------------------------------
ipcMain.handle('get-historico-pedidos', () => orderHistory)

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  createTray()
  createMainWindow()
  await setupRealtimeOrders()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Keep the app running in the tray when all windows are closed
app.on('window-all-closed', () => {
  // Do nothing — the tray keeps the process alive
})

app.on('before-quit', () => {
  app.isQuiting = true
})
