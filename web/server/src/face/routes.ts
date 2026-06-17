import type { FastifyInstance } from 'fastify'
import axios from 'axios'
import FormData from 'form-data'
import { env } from '../env.js'

function base64ToBuffer(base64: string): Buffer {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
  return Buffer.from(base64Data, 'base64')
}

export async function registerFaceRoutes(app: FastifyInstance) {
  app.post('/api/face/recognize', async (request, reply) => {
    const { image } = request.body as { image?: string }
    if (!image) {
      return reply.code(400).send({ code: 400, message: '缺少人脸图像数据' })
    }

    const url = env.faceApiUrl
    if (!url) {
      return reply.code(500).send({ code: 500, message: 'FACE_API_URL 未配置' })
    }

    try {
      const buffer = base64ToBuffer(image)
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
      request.log.error({ err: error?.message }, '人脸识别失败')
      return reply.code(502).send({ code: 502, message: error?.message || '人脸识别服务异常' })
    }
  })
}
