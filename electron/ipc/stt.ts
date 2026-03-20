import { ipcMain } from 'electron'
import axios from 'axios'
import FormData from 'form-data'
import * as dotenv from 'dotenv'
dotenv.config()

export function registerSTTHandlers() {
  ipcMain.handle('stt:transcribe', async (_event, audioBuffer: ArrayBuffer) => {
    const url = process.env.STT_API_URL
    if (!url) throw new Error('STT_API_URL not configured')

    const form = new FormData()
    form.append('audio', Buffer.from(audioBuffer), {
      filename: 'recording.webm',
      contentType: 'audio/webm',
    })

    const response = await axios.post(url, form, {
      headers: form.getHeaders(),
      timeout: 30000,
    })

    return response.data // { text: '...' }
  })
}
