import { app, BrowserWindow, ipcMain, session } from 'electron'
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

import { registerFaceHandlers } from './ipc/face'
import { registerSTTHandlers } from './ipc/stt'
import { registerTTSHandlers } from './ipc/tts'
import { registerLLMHandlers } from './ipc/llm'
import { registerDifyHandlers } from './ipc/dify'
import { registerSkillHandlers, loadSkills } from './ipc/skills'

const isDev = !app.isPackaged || process.env.NODE_ENV === 'development'

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
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
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
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
  registerDifyHandlers()
  registerSkillHandlers()

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
