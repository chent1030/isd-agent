import type { FastifyInstance } from 'fastify'
import axios from 'axios'
import FormData from 'form-data'
import { env } from '../env.js'

function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

function getAxiosMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: unknown; error?: unknown } | string | undefined
    if (typeof data === 'string' && data.trim()) return data.trim()
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) return data.message.trim()
      if (typeof data.error === 'string' && data.error.trim()) return data.error.trim()
    }
  }
  return error instanceof Error && error.message ? error.message : '人脸识别服务异常'
}

export async function registerFaceRoutes(app: FastifyInstance) {
  app.post('/face/recognize', async (request, reply) => {
    const { image } = request.body as { image?: string }
    if (!image) {
      return reply.code(400).send({ code: 400, message: '缺少人脸图像数据' })
    }

    const url = env.faceApiUrl
    if (!url) {
      return reply.code(500).send({ code: 500, message: 'FACE_API_URL 未配置' })
    }

    let imageLength = 0
    let bufferLength = 0

    try {
      imageLength = image.length
      const buffer = base64ToBuffer(image)
      bufferLength = buffer.length
      const formData = new FormData()
      formData.append('file', buffer, {
        filename: 'face.jpg',
        contentType: 'image/jpeg',
      })

      const response = await axios.post(url, formData, {
        headers: { ...formData.getHeaders() },
        timeout: 10000,
      })

      // 返回 { empName, empWorkNo } 或 null（未匹配）
      return response.data
    } catch (error: any) {
      const upstreamStatus = axios.isAxiosError(error) ? error.response?.status : undefined
      const upstreamData = axios.isAxiosError(error) ? error.response?.data : undefined
      const message = getAxiosMessage(error)

      request.log.error({
        err: error?.message,
        imageLength,
        bufferLength,
        upstreamStatus,
        upstreamData,
      }, '人脸识别失败')

      return reply.code(502).send({ code: 502, message, upstreamStatus })
    }
  })
}
