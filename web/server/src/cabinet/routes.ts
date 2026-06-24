import type { FastifyInstance } from 'fastify'
import {
  fetchAvailableItems,
  buildCatalogItems,
  buildCategories,
} from './cabinet-api.js'
import {
  operateItem,
  fetchOpenBorrowRecords,
  returnBorrowRecord,
} from './cabinet-service.js'
import { appConfig } from '../env.js'

export async function registerCabinetRoutes(app: FastifyInstance) {
  // 应用配置（非敏感）
  app.get('/app/config', async () => appConfig)

  // 分类列表
  app.get('/cabinet/categories', async (_request, reply) => {
    try {
      const items = buildCatalogItems(await fetchAvailableItems())
      return buildCategories(items)
    } catch (error: any) {
      app.log.error({ err: error?.message }, '获取分类失败')
      return reply.code(502).send({ code: 502, message: error?.message || '获取分类失败' })
    }
  })

  // 某分类下的物品（或全部）
  app.get('/cabinet/catalog-items', async (request, reply) => {
    try {
      const { categoryId } = request.query as { categoryId?: string }
      const items = buildCatalogItems(await fetchAvailableItems())
      return categoryId ? items.filter(item => item.categoryId === categoryId) : items
    } catch (error: any) {
      app.log.error({ err: error?.message }, '获取物品失败')
      return reply.code(502).send({ code: 502, message: error?.message || '获取物品失败' })
    }
  })

  // 领用/借用（含 TCP 开柜 + 业务落库）
  app.post('/cabinet/operate', async (request, reply) => {
    try {
      const payload = request.body as {
        action: 'receive' | 'borrow'
        itemId: string | number
        quantity?: number
        operator?: { empName?: string; empWorkNo?: string }
      }
      return await operateItem({
        action: payload.action,
        itemId: payload.itemId,
        quantity: payload.quantity,
        operator: payload.operator,
      })
    } catch (error: any) {
      app.log.error({ err: error?.message }, '开柜操作失败')
      return reply.code(502).send({ code: 502, message: error?.message || '开柜操作失败' })
    }
  })

  // 未归还借用记录
  app.post('/cabinet/borrow-records', async (request, reply) => {
    try {
      const { operator } = request.body as { operator: { empName?: string; empWorkNo?: string } }
      return await fetchOpenBorrowRecords(operator)
    } catch (error: any) {
      app.log.error({ err: error?.message }, '查询借用记录失败')
      return reply.code(502).send({ code: 502, message: error?.message || '查询借用记录失败' })
    }
  })

  // 归还
  app.post('/cabinet/return', async (request, reply) => {
    try {
      const payload = request.body as {
        borrowRecordId: string | number
        itemId?: string | number
        quantity?: number
        operator?: { empName?: string; empWorkNo?: string }
        remark?: string
        cabinetNo?: string | number
        slotNo?: number
      }
      return await returnBorrowRecord(payload)
    } catch (error: any) {
      app.log.error({ err: error?.message }, '归还失败')
      return reply.code(502).send({ code: 502, message: error?.message || '归还失败' })
    }
  })
}
