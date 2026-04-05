'use strict'

const { app, BrowserWindow, Notification, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http  = require('http')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const IS_DEV = process.env.NODE_ENV === 'development'

let mainWindow = null
let supabase = null
let tray = null
let appIcon = null  // nativeImage reutilizado na janela e no tray

// Selected printer (persisted to userData/config.json)
let selectedPrinter = ''

// In-memory order history (last 100 orders)
const orderHistory = []

// ---------------------------------------------------------------------------
// Config persistence
// ---------------------------------------------------------------------------
function configPath() {
  return path.join(app.getPath('userData'), 'config.json')
}

function loadConfig() {
  try {
    const raw = fs.readFileSync(configPath(), 'utf8')
    const cfg = JSON.parse(raw)
    selectedPrinter = cfg.impressora || ''
  } catch {
    // first run — no config yet
  }
}

function saveConfig() {
  fs.writeFileSync(configPath(), JSON.stringify({ impressora: selectedPrinter }), 'utf8')
}

// ---------------------------------------------------------------------------
// Download helper (follows redirects, returns Buffer)
// ---------------------------------------------------------------------------
function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

// ---------------------------------------------------------------------------
// Fetch tray icon from configuracoes.icone_app, fall back to bundled icon
// ---------------------------------------------------------------------------
async function loadTrayIcon() {
  const fallbackPath = path.join(__dirname, 'icon.png')
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return nativeImage.createFromPath(fallbackPath)

  try {
    // Fetch the icon_app URL from configuracoes
    const apiRes = await new Promise((resolve, reject) => {
      const url = new URL(`${SUPABASE_URL}/rest/v1/configuracoes?select=icone_app&limit=1`)
      const client = url.protocol === 'https:' ? https : http
      client.get(url.toString(), {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      }, (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString())))
        res.on('error', reject)
      }).on('error', reject)
    })

    const iconUrl = apiRes?.[0]?.icone_app
    if (!iconUrl) {
      console.log('[tray] Nenhum icone_app configurado, usando padrão')
      return nativeImage.createFromPath(fallbackPath)
    }

    console.log('[tray] Baixando ícone:', iconUrl)
    const buf = await downloadBuffer(iconUrl)

    // Save to temp file so nativeImage can detect the format correctly
    const tmpIcon = path.join(app.getPath('temp'), 'tray-icon-tmp.png')
    fs.writeFileSync(tmpIcon, buf)

    const img = nativeImage.createFromPath(tmpIcon).resize({ width: 32, height: 32 })
    if (img.isEmpty()) {
      console.warn('[tray] Imagem vazia após resize, usando padrão')
      return nativeImage.createFromPath(fallbackPath)
    }

    console.log('[tray] Ícone carregado do Supabase com sucesso')
    return img
  } catch (err) {
    console.warn('[tray] Falha ao carregar ícone do Supabase:', err.message)
    return nativeImage.createFromPath(fallbackPath)
  }
}

// ---------------------------------------------------------------------------
// Tray
// ---------------------------------------------------------------------------
function createTray(icon) {
  tray = new Tray(icon)
  tray.setToolTip('Casa Aliança – Restaurante')

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: mainWindow && mainWindow.isVisible() ? 'Ocultar janela' : 'Mostrar janela',
        click: toggleWindow,
      },
      { type: 'separator' },
      { label: 'Selecionar impressora...', click: openPrinterSelector },
      {
        label: selectedPrinter ? `Impressora: ${selectedPrinter}` : 'Impressora: (padrão do sistema)',
        enabled: false,
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

// Rebuild tray menu after printer changes so the status label updates
function refreshTrayMenu() {
  if (!tray) return
  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: mainWindow && mainWindow.isVisible() ? 'Ocultar janela' : 'Mostrar janela',
        click: toggleWindow,
      },
      { type: 'separator' },
      { label: 'Selecionar impressora...', click: openPrinterSelector },
      {
        label: selectedPrinter ? `Impressora: ${selectedPrinter}` : 'Impressora: (padrão do sistema)',
        enabled: false,
      },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() },
    ])
  tray.setContextMenu(buildMenu())
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

async function openPrinterSelector() {
  // Need a visible window to enumerate printers
  const win = mainWindow || new BrowserWindow({ show: false })
  const printers = await win.webContents.getPrintersAsync()
  if (!printers.length) {
    dialog.showMessageBox({ message: 'Nenhuma impressora encontrada.' })
    return
  }

  const choices = printers.map((p) => p.name)
  const currentIdx = choices.indexOf(selectedPrinter)

  const { response } = await dialog.showMessageBox({
    type: 'question',
    title: 'Selecionar impressora',
    message: 'Escolha a impressora para impressão automática de pedidos:',
    buttons: [...choices, 'Cancelar'],
    defaultId: currentIdx >= 0 ? currentIdx : 0,
    cancelId: choices.length,
  })

  if (response < choices.length) {
    selectedPrinter = choices[response]
    saveConfig()
    refreshTrayMenu()
    console.log('[printer] Impressora selecionada:', selectedPrinter)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('impressora-atualizada', selectedPrinter)
    }
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
    title: 'Casa Aliança – Restaurante',
    icon: appIcon || undefined,
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
    <h1>CASA ALIANÇA</h1>
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
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Print logic
// ---------------------------------------------------------------------------
async function printOrder(pedidoBasico) {
  if (!supabase) return

  try {
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

    // Write HTML to a temp file — avoids data-URL size limits in Electron
    const tmpFile = path.join(app.getPath('temp'), `receipt-${data.id}.html`)
    fs.writeFileSync(tmpFile, html, 'utf8')

    const printWin = new BrowserWindow({
      show: false,
      width: 400,
      height: 600,
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    })

    await printWin.loadFile(tmpFile)

    printWin.webContents.print(
      {
        silent: true,
        printBackground: false,
        deviceName: selectedPrinter || '',
      },
      (success, reason) => {
        if (!success) console.warn('[print] Falha na impressão:', reason)
        else console.log(`[print] Pedido #${data.id.substring(0, 8)} impresso — impressora: ${selectedPrinter || 'padrão'}`)
        setTimeout(() => {
          printWin.destroy()
          fs.unlink(tmpFile, () => {})
        }, 2000)
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
// IPC handlers
// ---------------------------------------------------------------------------

// Impressão manual a partir do renderer
ipcMain.handle('print-pedido', async (_event, pedidoId) => {
  await printOrder({ id: pedidoId })
  return { ok: true }
})

// Histórico de pedidos impressos
ipcMain.handle('get-historico-pedidos', () => orderHistory)

// Lista de impressoras disponíveis
ipcMain.handle('get-printers', async () => {
  const win = mainWindow || BrowserWindow.getAllWindows()[0]
  if (!win) return []
  const printers = await win.webContents.getPrintersAsync()
  return printers.map((p) => ({ name: p.name, isDefault: p.isDefault }))
})

// Salvar impressora selecionada
ipcMain.handle('set-impressora', (_event, printerName) => {
  selectedPrinter = printerName
  saveConfig()
  refreshTrayMenu()
  console.log('[printer] Impressora definida via renderer:', printerName)
  return { ok: true }
})

// Retornar impressora atualmente selecionada
ipcMain.handle('get-impressora', () => selectedPrinter)

// Abrir diálogo de seleção de impressora (acionável pelo renderer)
ipcMain.handle('open-printer-selector', () => openPrinterSelector())

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(async () => {
  Menu.setApplicationMenu(null)
  loadConfig()
  appIcon = await loadTrayIcon()
  createTray(appIcon)
  createMainWindow()
  await setupRealtimeOrders()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

// Keep the app running in the tray when all windows are closed
app.on('window-all-closed', () => {
  // intentionally empty — tray keeps the process alive
})

app.on('before-quit', () => {
  app.isQuiting = true
})
