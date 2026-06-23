import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyStatic from '@fastify/static'
import path from 'node:path'
import fs from 'node:fs'
import { env } from './env.js'
import { registerCabinetRoutes } from './cabinet/routes.js'
import { registerFaceRoutes } from './face/routes.js'

if (env.allowInsecureTls) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'
  console.warn('[tls] TLS certificate verification is disabled by ALLOW_INSECURE_TLS')
}

async function main() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss' },
      },
    },
  })

  // CORS：开发期允许 Vite (5173) 跨域
  await app.register(cors, {
    origin: true,
    credentials: true,
  })

  // 业务路由
  await app.register(registerCabinetRoutes)
  await app.register(registerFaceRoutes)

  // 健康检查
  app.get('/api/health', async () => ({ ok: true, ts: Date.now() }))

  // 生产：托管前端静态资源（单端口部署）
  const clientDist = env.webClientDist
    ? path.resolve(process.cwd(), env.webClientDist)
    : ''
  if (clientDist && fs.existsSync(clientDist)) {
    await app.register(fastifyStatic, {
      root: clientDist,
      prefix: '/',
      wildcard: false,
    })

    // SPA fallback：非 /api 路由都返回 index.html
    app.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith('/api/')) {
        return reply.code(404).send({ code: 404, message: 'Not Found' })
      }
      return reply.sendFile('index.html')
    })
    app.log.info(`[static] 托管前端资源: ${clientDist}`)
  } else {
    app.log.info('[static] 未配置 WEB_CLIENT_DIST，仅运行 API 模式')
  }

  try {
    await app.listen({ host: '0.0.0.0', port: env.port })
    app.log.info(`[app] ISD Web 服务已启动: http://0.0.0.0:${env.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

main()
