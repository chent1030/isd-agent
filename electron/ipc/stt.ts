import { ipcMain } from 'electron'
import axios from 'axios'
import FormData from 'form-data'
import * as dotenv from 'dotenv'
dotenv.config()

export function registerSTTHandlers() {
  ipcMain.handle('stt:transcribe', async (_event, audioBuffer: ArrayBuffer) => {
    const url = process.env.STT_API_URL
    if (!url) throw new Error('STT_API_URL not configured')
    const model = process.env.STT_MODEL || process.env.NEWAPI_STT_MODEL
    const fileField = process.env.STT_FILE_FIELD || 'file'
    const apiKey = process.env.STT_API_KEY || process.env.NEWAPI_API_KEY

    const form = new FormData()
    form.append(fileField, Buffer.from(audioBuffer), {
      filename: 'audio.wav',
      contentType: 'audio/wav',
    })
    if (model) form.append('model', model)
    if (process.env.STT_LANGUAGE) form.append('language', process.env.STT_LANGUAGE)

    const response = await axios.post(url, form, {
      headers: {
        ...form.getHeaders(),
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      timeout: 30000,
    })

    const data = response.data ?? {}
    return {
      text: typeof data.text === 'string' ? data.text : '',
      task: typeof data.task === 'string' ? data.task : undefined,
      language: typeof data.language === 'string' ? data.language : undefined,
      duration: data.duration ?? null,
    }
  })
}
