import { ipcMain } from 'electron'
import axios from 'axios'
import FormData from 'form-data'
import * as dotenv from 'dotenv'
dotenv.config()

function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

export function registerFaceHandlers() {
  ipcMain.handle('face:recognize', async (_event, imageBase64: string) => {
    const url = process.env.FACE_API_URL
    if (!url) throw new Error('FACE_API_URL not configured')

    const buffer = base64ToBuffer(imageBase64)
    const formData = new FormData()
    formData.append('file', buffer, {
      filename: 'face.jpg',
      contentType: 'image/jpeg'
    })

    const response = await axios.post(url, formData, {
      headers: { ...formData.getHeaders() },
      timeout: 10000,
    })

    // 返回 { empName, empWorkNo } 或 null（未匹配）
    return response.data
  })
}
