'use strict'

const { app, BrowserWindow, Notification, ipcMain, Tray, Menu, nativeImage, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const https = require('https')
const http  = require('http')
const { execFile } = require('child_process')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY
const IS_DEV = process.env.NODE_ENV === 'development'

let mainWindow = null
let tvWindow = null
let supabase = null
let tray = null
let appIcon = null  // nativeImage reutilizado na janela e no tray

// Impede duas instâncias do aplicativo. Ao executar novamente, avisa o
// usuário e traz a janela que já estava aberta para frente.
const hasSingleInstanceLock = app.requestSingleInstanceLock()

if (!hasSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.show()
      mainWindow.focus()
    }

    dialog.showMessageBox(mainWindow || undefined, {
      type: 'info',
      title: 'Casa Aliança Restaurante',
      message: 'O aplicativo já está aberto.',
      detail: 'A janela que já estava em execução foi trazida para frente.',
      buttons: ['OK'],
      defaultId: 0,
      noLink: true,
    })
  })
}

// Selected printer (persisted to userData/config.json)
let selectedPrinter = ''

// Loja selecionada (persisted to userData/config.json)
let selectedLojaId = ''

// In-memory order history (last 100 orders)
const orderHistory = []

// Active realtime channel (recreated when loja changes)
let realtimeChannel = null

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
    selectedLojaId = cfg.lojaId || ''
  } catch {
    // first run — no config yet
  }
}

function saveConfig() {
  fs.writeFileSync(configPath(), JSON.stringify({ impressora: selectedPrinter, lojaId: selectedLojaId }), 'utf8')
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
    if (!iconUrl || !iconUrl.startsWith('http')) {
      console.log('[tray] icone_app não é uma URL válida, usando padrão')
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
  tray.setToolTip('Casa Alinça – Restaurante')

  const buildMenu = () =>
    Menu.buildFromTemplate([
      {
        label: mainWindow && mainWindow.isVisible() ? 'Ocultar janela' : 'Mostrar janela',
        click: toggleWindow,
      },
      { label: 'Abrir TV (Chamada de Pedidos)', click: createTvWindow },
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
      { label: 'Abrir TV (Chamada de Pedidos)', click: createTvWindow },
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
// TV window
// ---------------------------------------------------------------------------
function createTvWindow() {
  if (tvWindow && !tvWindow.isDestroyed()) {
    tvWindow.focus()
    return
  }

  tvWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 800,
    minHeight: 450,
    title: 'TV – Chamada de Pedidos',
    icon: appIcon || undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  if (IS_DEV) {
    tvWindow.loadURL('http://localhost:5173/#/tv')
  } else {
    tvWindow.loadFile(path.join(__dirname, '../dist/index.html'), { hash: '/tv' })
  }

  tvWindow.on('closed', () => {
    tvWindow = null
  })
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
    title: 'Casa Alinça – Restaurante',
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
// ---------------------------------------------------------------------------
// ESC/POS receipt (raw bytes, not HTML) — the POS-80 clone driver only
// renders raw/text jobs correctly; Chromium-rendered (graphical) print jobs
// come out as blank paper on it.
// ---------------------------------------------------------------------------
const ESC = 0x1b
const GS = 0x1d
const RECEIPT_WIDTH = 48

function money(n) {
  return `R$ ${Number(n).toFixed(2).replace('.', ',')}`
}

function padRight(str, len) {
  str = str.slice(0, len)
  return str + ' '.repeat(Math.max(0, len - str.length))
}

function wrapText(str, width) {
  const words = String(str).split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const candidate = cur ? `${cur} ${w}` : w
    if (candidate.length > width) {
      if (cur) lines.push(cur)
      cur = w
    } else {
      cur = candidate
    }
  }
  if (cur) lines.push(cur)
  return lines.length ? lines : ['']
}

function buildEscPosReceipt(pedido, numeroPedido) {
  const mesa = pedido.mesa || {}
  const itens = pedido.itens || []
  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const divider = '-'.repeat(RECEIPT_WIDTH)

  const chunks = []
  const push = (s) => chunks.push(Buffer.from(s, 'latin1'))
  const cmd = (...bytes) => chunks.push(Buffer.from(bytes))

  cmd(ESC, 0x40) // init
  cmd(ESC, 0x74, 16) // codepage (WPC1252 on most clones)

  cmd(ESC, 0x61, 1) // center
  cmd(GS, 0x21, 0x11) // double width/height
  cmd(ESC, 0x45, 1) // bold on
  push('CASA ALINÇA\n')
  cmd(GS, 0x21, 0x00) // normal size
  push('Restaurante\n')
  cmd(ESC, 0x45, 0) // bold off
  cmd(ESC, 0x61, 0) // left align

  push(`${divider}\n`)
  push(`Mesa: ${mesa.numero || '—'}\n`)
  push(`Pedido: #${numeroPedido}\n`)
  push(`Data/Hora: ${now}\n`)
  push(`${divider}\n`)

  for (const item of itens) {
    const qty = `${item.quantidade}x`
    const total = Number(item.preco_unitario) * Number(item.quantidade)
    const priceStr = money(total)
    const nameWidth = Math.max(RECEIPT_WIDTH - qty.length - 1 - priceStr.length, 8)
    const nameLines = wrapText(item.nome_prato || '', nameWidth)

    nameLines.forEach((line, idx) => {
      if (idx === 0) {
        push(padRight(`${qty} ${line}`, RECEIPT_WIDTH - priceStr.length) + priceStr + '\n')
      } else {
        push(`${padRight(`   ${line}`, RECEIPT_WIDTH)}\n`)
      }
    })

    if (item.observacao_item) {
      wrapText(`  -> ${item.observacao_item}`, RECEIPT_WIDTH).forEach((l) => push(`${l}\n`))
    }
  }

  push(`${divider}\n`)
  cmd(ESC, 0x45, 1) // bold on
  const totalStr = money(pedido.valor_total || 0)
  push(padRight('TOTAL', RECEIPT_WIDTH - totalStr.length) + totalStr + '\n')
  cmd(ESC, 0x45, 0) // bold off

  if (pedido.observacao_geral) {
    push(`${divider}\n`)
    wrapText(`Obs: ${pedido.observacao_geral}`, RECEIPT_WIDTH).forEach((l) => push(`${l}\n`))
  }

  push(`${divider}\n`)
  cmd(ESC, 0x61, 1) // center
  push('Obrigado pela preferência!\n')
  cmd(ESC, 0x61, 0) // left

  cmd(ESC, 0x64, 4) // feed 4 lines
  cmd(GS, 0x56, 0x00) // full cut

  return Buffer.concat(chunks)
}

// Sends raw bytes straight to a Windows printer queue (datatype RAW), via a
// PowerShell helper that calls winspool.drv — bypasses GDI rendering, which
// is what the receipt needs on this printer's driver.
function sendRawToPrinter(printerName, buffer) {
  return new Promise((resolve, reject) => {
    if (!printerName) {
      reject(new Error('Nenhuma impressora selecionada'))
      return
    }

    const tmpFile = path.join(app.getPath('temp'), `escpos-${Date.now()}.bin`)
    fs.writeFileSync(tmpFile, buffer)
    // In the packaged app, __dirname points inside app.asar (a virtual
    // archive) — external processes like powershell.exe can't read from
    // there. asarUnpack copies this file to a real app.asar.unpacked
    // directory alongside it, so redirect the path there.
    const scriptPath = path.join(__dirname, 'print-raw.ps1').replace('app.asar', 'app.asar.unpacked')

    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-PrinterName', printerName, '-FilePath', tmpFile],
      (err, stdout, stderr) => {
        fs.unlink(tmpFile, () => {})
        if (err) {
          reject(err)
        } else if (String(stdout).includes('OK')) {
          resolve()
        } else {
          reject(new Error(stderr || stdout || 'Falha desconhecida ao imprimir'))
        }
      }
    )
  })
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

    // Número sequencial: conta quantos pedidos existem até este (por created_at)
    const { count } = await supabase
      .from('pedidos')
      .select('id', { count: 'exact', head: true })
      .lte('created_at', data.created_at)

    const numeroPedido = count ?? 1
    const receiptBuffer = buildEscPosReceipt(data, numeroPedido)

    try {
      await sendRawToPrinter(selectedPrinter, receiptBuffer)
      console.log(`[print] Pedido #${numeroPedido} impresso — impressora: ${selectedPrinter || 'padrão'}`)
    } catch (printErr) {
      console.warn('[print] Falha na impressão:', printErr.message)
    }

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
    console.warn('[realtime] Variáveis de ambiente não configuradas — impressão desabilitada.')
    return
  }

  if (!supabase) {
    const { createClient } = await import('@supabase/supabase-js')
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }

  await subscribeRealtimeOrders()
  console.log('[realtime] Escutando novos pedidos para impressão automática...')
}

async function subscribeRealtimeOrders() {
  if (!supabase) return

  // Remove canal anterior se existir
  if (realtimeChannel) {
    await supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }

  const filter = selectedLojaId
    ? { event: 'INSERT', schema: 'public', table: 'pedidos', filter: `loja_id=eq.${selectedLojaId}` }
    : { event: 'INSERT', schema: 'public', table: 'pedidos' }

  realtimeChannel = supabase
    .channel(`auto-print-pedidos-${selectedLojaId || 'all'}`)
    .on('postgres_changes', filter, (payload) => {
      console.log('[realtime] Novo pedido detectado:', payload.new?.id, '| loja:', selectedLojaId || 'todas')
      printOrder(payload.new)
    })
    .subscribe((status) => {
      console.log('[realtime] Status do canal:', status, '| loja:', selectedLojaId || 'todas')
    })
}

// ---------------------------------------------------------------------------
// Report HTML printer (called from renderer with pre-built HTML)
// ---------------------------------------------------------------------------
async function printHTML(html) {
  const tmpFile = path.join(app.getPath('temp'), `report-${Date.now()}.html`)
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
      margins: { marginType: 'none' },
      pageSize: { width: 80000, height: 297000 },
    },
    (success, reason) => {
      if (!success) console.warn('[relatorio] Falha na impressão:', reason)
      setTimeout(() => { printWin.destroy(); fs.unlink(tmpFile, () => {}) }, 2000)
    }
  )
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

// Imprimir HTML arbitrário (relatório)
ipcMain.handle('print-relatorio', async (_event, html) => {
  await printHTML(html)
  return { ok: true }
})

// Abrir janela TV
ipcMain.handle('open-tv-window', () => {
  createTvWindow()
  return { ok: true }
})

// Loja selecionada no admin — filtra impressão automática
ipcMain.handle('set-loja', async (_event, lojaId) => {
  if (selectedLojaId === lojaId) return { ok: true }
  selectedLojaId = lojaId || ''
  saveConfig()
  console.log('[loja] Loja selecionada para impressão:', selectedLojaId || '(todas)')
  // Recria canal Realtime com o novo filtro
  await subscribeRealtimeOrders()
  return { ok: true }
})

ipcMain.handle('get-loja', () => selectedLojaId)

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
