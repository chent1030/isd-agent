import { ipcMain } from 'electron'
import axios from 'axios'
import * as dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

dotenv.config()

function createWavHeader(dataLength: number, sampleRate = 16000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * bitsPerSample / 8
  const blockAlign = numChannels * bitsPerSample / 8

  const header = Buffer.alloc(44)

  header.write('RIFF', 0)
  header.writeUInt32LE(36 + dataLength, 4)
  header.write('WAVE', 8)

  header.write('fmt', 12)
  header.writeUInt32LE(16, 16)
  header.writeUInt16LE(1, 20)
  header.writeUInt16LE(numChannels, 22)
  header.writeUInt32LE(sampleRate, 24)
  header.writeUInt32LE(byteRate, 28)
  header.writeUInt16LE(blockAlign, 32)
  header.writeUInt16LE(bitsPerSample, 34)

  header.write('data', 36)
  header.writeUInt32LE(dataLength, 40)

  return header
}

export function registerTTSHandlers() {
  ipcMain.handle('tts:synthesize', async (_event, text: string) => {
    const url = process.env.TTS_API_URL
    if (!url) throw new Error('TTS_API_URL not configured')

    const response = await axios.post(url, { text }, {
      headers: { 'Content-Type': 'application/json' },
      responseType: 'arraybuffer',
      timeout: 30000,
    })

    const buffer = response.data as Buffer
    const header = buffer.slice(0, 20).toString('hex')

    const isWav = buffer.slice(0, 4).toString() === 'RIFF'
    const isMp3 = buffer.slice(0, 3).toString() === 'ID3' || (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0)

    let finalBuffer: Buffer

    if (isWav || isMp3) {
      finalBuffer = buffer
    } else {
      const wavHeader = createWavHeader(buffer.length, 16000, 1, 16)
      finalBuffer = Buffer.concat([wavHeader, buffer])
    }

    const arrayBuffer = new ArrayBuffer(finalBuffer.length)
    new Uint8Array(arrayBuffer).set(new Uint8Array(finalBuffer.buffer, finalBuffer.byteOffset, finalBuffer.length))
    // 返回 ArrayBuffer，渲染进程用 Web Audio API 播放
    return arrayBuffer
  })
}
