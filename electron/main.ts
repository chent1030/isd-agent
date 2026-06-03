import { app, BrowserWindow, globalShortcut, ipcMain, session } from 'electron'
import log from 'electron-log/main'
import path from 'path'
import fs from 'fs'
import * as dotenv from 'dotenv'

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

if (isEnabledEnv(process.env.ALLOW_INSECURE_TLS)) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.warn('[tls] TLS certificate verification is disabled by ALLOW_INSECURE_TLS')
}

log.initialize()
log.transports.file.level = 'info'
log.transports.file.fileName = 'isd-agent.log'
Object.assign(console, log.functions)
log.info(`[app] log file: ${log.transports.file.getFile().path}`)

import { registerFaceHandlers } from './ipc/face'
import { registerSTTHandlers } from './ipc/stt'
import { registerTTSHandlers } from './ipc/tts'
import { registerLLMHandlers } from './ipc/llm'
import { registerSkillHandlers, loadSkills } from './ipc/skills'
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

  await loadSkills()

  registerFaceHandlers()
  registerSTTHandlers()
  registerTTSHandlers()
  registerLLMHandlers()
  registerSkillHandlers()
  registerCabinetHandlers()

  ipcMain.on('window:toggle-fullscreen', event => {
    const win = BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow()
    win?.setFullScreen(!win.isFullScreen())
  })
  ipcMain.handle('app:get-config', () => ({
    skipFaceAuth: isEnabledEnv(process.env.SKIP_FACE_AUTH) || isEnabledEnv(process.env.VITE_SKIP_FACE_AUTH),
    skipFaceAuthUser: {
      empName: process.env.SKIP_FACE_AUTH_EMP_NAME ?? process.env.VITE_SKIP_FACE_AUTH_EMP_NAME ?? '',
      empWorkNo: process.env.SKIP_FACE_AUTH_EMP_WORK_NO ?? process.env.VITE_SKIP_FACE_AUTH_EMP_WORK_NO ?? '',
    },
  }))

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
