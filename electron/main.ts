import { app, BrowserWindow, globalShortcut, ipcMain, session } from 'electron'
import log from 'electron-log/main'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'
import { getAppConfigFromEnv } from './app-config'

// 优先加载 resourcesPath 下的 .env（打包后），其次当前目录（开发时）
const envPaths = [
  path.join(process.resourcesPath ?? '', '.env'),
  path.join(app.getPath('userData'), '.env'),
  path.join(process.cwd(), '.env'),
]
for (const p of envPaths) {
  if (fs.existsSync(p)) { dotenv.config({ path: p }); break }
}

function isEnabledEnv(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes(String(value ?? '').trim().toLowerCase())
}

function normalizeGraphicsMode(value: string | undefined) {
  return String(value ?? 'auto').trim().toLowerCase()
}

function applyGraphicsMode() {
  const mode = normalizeGraphicsMode(process.env.ISD_GRAPHICS_MODE)
  const ignoreGpuBlocklist = isEnabledEnv(process.env.ISD_IGNORE_GPU_BLOCKLIST)

  if (ignoreGpuBlocklist) {
    app.commandLine.appendSwitch('ignore-gpu-blocklist')
  }

  if (mode === 'auto' || mode === '') {
    console.info('[graphics] using Chromium default graphics mode')
    return
  }

  if (mode === 'swiftshader') {
    app.commandLine.appendSwitch('use-gl', 'angle')
    app.commandLine.appendSwitch('use-angle', 'swiftshader')
    app.commandLine.appendSwitch('enable-unsafe-swiftshader')
    console.info('[graphics] forced ANGLE SwiftShader software rendering')
    return
  }

  if (mode === 'swiftshader-webgl') {
    app.commandLine.appendSwitch('use-gl', 'angle')
    app.commandLine.appendSwitch('use-angle', 'swiftshader-webgl')
    app.commandLine.appendSwitch('enable-unsafe-swiftshader')
    console.info('[graphics] forced SwiftShader WebGL fallback')
    return
  }

  if (mode === 'd3d11' || mode === 'd3d9' || mode === 'gl' || mode === 'vulkan') {
    app.commandLine.appendSwitch('use-gl', 'angle')
    app.commandLine.appendSwitch('use-angle', mode)
    console.info(`[graphics] forced ANGLE backend: ${mode}`)
    return
  }

  console.warn(`[graphics] unknown ISD_GRAPHICS_MODE=${mode}, using Chromium default graphics mode`)
}

if (isEnabledEnv(process.env.ALLOW_INSECURE_TLS)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.warn('[tls] TLS certificate verification is disabled by ALLOW_INSECURE_TLS')
}

applyGraphicsMode()

log.initialize()
log.transports.file.level = 'info'
log.transports.file.fileName = 'isd-agent.log'
Object.assign(console, log.functions)
log.info(`[app] log file: ${log.transports.file.getFile().path}`)

import { registerFaceHandlers } from './ipc/face'
import { registerCabinetHandlers } from './ipc/cabinet'

function isDebugBuild() {
  if (process.env.ISD_DEBUG === 'true') return true
  if (app.getName().toLowerCase().includes('debug')) return true
  if (process.execPath.toLowerCase().includes('debug')) return true

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(app.getAppPath(), 'package.json'), 'utf-8'),
    )
    return packageJson.isdDebugBuild === true
  } catch {
    return false
  }
}

const isDev = !app.isPackaged
const shouldOpenDevTools = isDev || isDebugBuild()

function toggleFocusedWindowFullScreen() {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (!win) return
  win.setFullScreen(!win.isFullScreen())
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    fullscreen: true,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0f172a',
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  if (shouldOpenDevTools) {
    const openDevTools = () => {
      if (win.webContents.isDestroyed()) return
      win.webContents.openDevTools({ mode: 'detach' })
    }

    win.webContents.once('did-finish-load', openDevTools)
    setTimeout(openDevTools, 1500)
  }
}

app.whenReady().then(async () => {
  // 允许摄像头访问
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === 'media') {
      callback(true)
    } else {
      callback(false)
    }
  })

  registerFaceHandlers()
  registerCabinetHandlers()

  ipcMain.on('window:toggle-fullscreen', event => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    win?.setFullScreen(!win.isFullScreen())
  })
  ipcMain.handle('app:get-config', () => getAppConfigFromEnv(process.env))

  createWindow()

  globalShortcut.register('F11', toggleFocusedWindowFullScreen)
  globalShortcut.register('CommandOrControl+Shift+F', toggleFocusedWindowFullScreen)

  if (shouldOpenDevTools) {
    globalShortcut.register('F12', () => {
      BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
    })
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      BrowserWindow.getFocusedWindow()?.webContents.toggleDevTools()
    })
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
