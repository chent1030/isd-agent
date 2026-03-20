import { ipcMain } from 'electron'
import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

export function registerTTSHandlers() {
  ipcMain.handle('tts:synthesize', async (_event, text: string) => {
    const url = process.env.TTS_API_URL
    if (!url) throw new Error('TTS_API_URL not configured')

    const response = await axios.post(url, { text }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 30000,
    })

    // 返回 ArrayBuffer，渲染进程用 Web Audio API 播放
    return response.data
  })
}
