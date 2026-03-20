import { ipcMain } from 'electron'
import axios from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()

export function registerFaceHandlers() {
  ipcMain.handle('face:recognize', async (_event, imageBase64: string) => {
    const url = process.env.FACE_API_URL
    if (!url) throw new Error('FACE_API_URL not configured')

    const response = await axios.post(url, { image: imageBase64 }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    })

    // 返回 { empName, empWorkNo } 或 null（未匹配）
    return response.data
  })
}
