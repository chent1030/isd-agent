import { ipcMain, BrowserWindow } from 'electron'
import * as dotenv from 'dotenv'
import {
  buildSkillsSystemPrompt,
  executeSkillScript,
  getSkillInfos,
  loadSkillContent,
} from './skills'
dotenv.config()

interface Message {
  role: string
  content: string
}

interface OperatorIdentity {
  empName?: string
  empWorkNo?: string
}

interface PendingCabinetAction {
  skillName: 'open-cabinet'
  action: 'borrow' | 'receive' | 'return'
  itemId: string
  itemName?: string
  quantity: number
  operatorNo?: string
  operatorName?: string
  createdAt: number
}

interface LangChainModules {
  ChatOpenAI: any
  HumanMessage: any
  AIMessage: any
  SystemMessage: any
  ToolMessage: any
  DynamicStructuredTool: any
  z: any
}

let langChainModulesPromise: Promise<LangChainModules> | null = null
const dynamicImport = new Function('modulePath', 'return import(modulePath)') as <T>(modulePath: string) => Promise<T>
const pendingCabinetActions = new Map<number, PendingCabinetAction>()
const PENDING_EXPIRE_MS = 10 * 60 * 1000

async function loadLangChainModules(): Promise<LangChainModules> {
  if (!langChainModulesPromise) {
    langChainModulesPromise = (async () => {
      const [{ ChatOpenAI }, messagesMod, toolsMod, zodMod] = await Promise.all([
        dynamicImport<any>('@langchain/openai'),
        dynamicImport<any>('@langchain/core/messages'),
        dynamicImport<any>('@langchain/core/tools'),
        dynamicImport<any>('zod'),
      ])

      return {
        ChatOpenAI,
        HumanMessage: messagesMod.HumanMessage,
        AIMessage: messagesMod.AIMessage,
        SystemMessage: messagesMod.SystemMessage,
        ToolMessage: messagesMod.ToolMessage,
        DynamicStructuredTool: toolsMod.DynamicStructuredTool,
        z: zodMod.z,
      }
    })()
  }
  return langChainModulesPromise
}

function toText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: unknown }).text ?? '')
        }
        return ''
      })
      .join('')
  }
  if (content == null) return ''
  return String(content)
}

function normalizeToolName(rawName: string, used: Set<string>): string {
  const base = rawName
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48)

  let name = base || 'skill_tool'
  if (!used.has(name)) {
    used.add(name)
    return name
  }

  let i = 1
  while (used.has(`${name}_${i}`)) i += 1
  name = `${name}_${i}`
  used.add(name)
  return name
}

function getLastUserText(messages: Message[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === 'user') return String(messages[i].content ?? '').trim()
  }
  return ''
}

function isConfirmText(text: string): boolean {
  const normalized = text.replace(/\s+/g, '').toLowerCase()
  return ['确认', '确定', '是', '是的', '好的', '好', '可以', '没问题', '确认领取', '确认领用', '确认归还', 'ok', 'yes', 'y'].includes(normalized)
}

function isCancelText(text: string): boolean {
  const normalized = text.replace(/\s+/g, '').toLowerCase()
  return ['取消', '不确认', '不要', '不用', '否', '不是', '算了', 'cancel', 'no', 'n'].includes(normalized)
}

function getValidPendingCabinetAction(webContentsId: number): PendingCabinetAction | null {
  const pending = pendingCabinetActions.get(webContentsId)
  if (!pending) return null
  if (Date.now() - pending.createdAt > PENDING_EXPIRE_MS) {
    pendingCabinetActions.delete(webContentsId)
    return null
  }
  return pending
}

function normalizeCabinetAction(action: unknown): PendingCabinetAction['action'] | null {
  const value = String(action ?? '').trim().toLowerCase()
  if (value === 'borrow' || value === 'receive' || value === 'return') return value
  return null
}

function createPendingCabinetAction(
  params: Record<string, unknown>,
  operator?: OperatorIdentity
): PendingCabinetAction | null {
  const action = normalizeCabinetAction(params.action || params.command)
  const itemId = String(params.itemId ?? params.id ?? '').trim()
  if (!action || !itemId) return null

  const quantity = Number.parseInt(String(params.quantity ?? ''), 10)
  if (!Number.isInteger(quantity) || quantity <= 0) return null
  return {
    skillName: 'open-cabinet',
    action,
    itemId,
    itemName: typeof params.itemName === 'string' ? params.itemName : undefined,
    quantity,
    operatorNo: operator?.empWorkNo,
    operatorName: operator?.empName,
    createdAt: Date.now(),
  }
}

function summarizeCabinetResult(rawResult: string, pending: PendingCabinetAction): string {
  const normalizedActionText = pending.action === 'return' ? '归还' : pending.action === 'borrow' ? '借用' : '领用'
  try {
    const parsed = JSON.parse(rawResult)
    const itemName = parsed?.item?.name || pending.itemName || pending.itemId
    const quantity = parsed?.quantity || pending.quantity
    const stock = parsed?.deductResult?.remainingStock ?? parsed?.returnResult?.remainingStock
    const stockText = typeof stock === 'number' ? `，剩余库存：${stock}` : ''
    return `已完成${normalizedActionText}操作。物品：${itemName}，数量：${quantity}${stockText}。`
  } catch {
    return `已完成${normalizedActionText}操作。`
  }

  try {
    const parsed = JSON.parse(rawResult)
    const itemName = parsed?.item?.name || pending.itemName || pending.itemId
    const quantity = parsed?.quantity || pending.quantity
    const stock = parsed?.deductResult?.remainingStock ?? parsed?.returnResult?.remainingStock
    const actionText = pending.action === 'return' ? '归还' : '领用'
    const stockText = typeof stock === 'number' ? `，剩余库存：${stock}` : ''
    return `已完成${actionText}操作。物品：${itemName}，数量：${quantity}${stockText}。`
  } catch {
    return pending.action === 'return' ? '已完成归还操作。' : '已完成开柜和库存扣减。'
  }
}

function buildSystemPrompt(skillsBlock: string, operator?: OperatorIdentity): string {
  const operatorText = operator?.empWorkNo && operator?.empName
    ? `当前已通过摄像头识别的操作人: ${operator.empName} (${operator.empWorkNo})。调用涉及领用、借用、归还、开柜等业务 skill 时，必须传 operatorNo="${operator.empWorkNo}" 和 operatorName="${operator.empName}"，不要使用 skill/admin/guest 作为操作人。`
    : '当前没有已识别的操作人。涉及领用、借用、归还、开柜等业务 skill 时，必须先要求用户完成人脸识别，不要调用 run_skill 执行业务动作。'

  return [
    '你是一个智能助手。',
    operatorText,
    skillsBlock,
    '你可以通过工具调用 skills，并采用渐进式披露模式。',
    '流程要求：先调用 load_skill 获取该技能完整说明，再决定是否调用 run_skill。',
    '调用 run_skill 时，参数放在 params 对象中，例如：{"skillName":"query-employee","params":{"keyword":"张三"}}。',
    'open-cabinet flow: first use run_skill with action="list" to get items and match the user request. If the user has not provided quantity, ask for quantity first. After matching an item and getting quantity, call set_pending_cabinet_action with action, itemId, quantity, and itemName, then ask the user for confirmation. Do not execute borrow/receive/return in the same turn as the confirmation request.',
    '拿到工具结果后，给用户清晰、简洁的中文回复。',
  ].filter(Boolean).join('\n\n')
}

export function registerLLMHandlers() {
  ipcMain.handle('llm:chat', async (
    event,
    { messages, channel, isAuthenticated, operator }: { messages: Message[]; channel: string; isAuthenticated: boolean; operator?: OperatorIdentity }
  ) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) throw new Error('No window found')

    const url = process.env.LLM_API_URL
    const key = process.env.LLM_API_KEY
    const model = process.env.LLM_MODEL || 'gpt-4o-mini'
    if (!url) throw new Error('LLM_API_URL not configured')

    try {
      const lastUserText = getLastUserText(messages)
      const pendingCabinetAction = getValidPendingCabinetAction(event.sender.id)
      if (pendingCabinetAction) {
        if (isCancelText(lastUserText)) {
          pendingCabinetActions.delete(event.sender.id)
          const finalText = '已取消本次操作。'
          win.webContents.send(channel, finalText)
          win.webContents.send(channel, '[DONE]')
          return finalText
        }

        if (isConfirmText(lastUserText)) {
          if (!isAuthenticated || !operator?.empWorkNo || !operator?.empName) {
            pendingCabinetActions.delete(event.sender.id)
            const finalText = '请先完成人脸识别后再确认操作。'
            win.webContents.send(channel, finalText)
            win.webContents.send(channel, '[DONE]')
            return finalText
          }

          win.webContents.send(channel, '[SKILL_CALLING]')
          const result = await executeSkillScript(pendingCabinetAction.skillName, {
            action: pendingCabinetAction.action,
            itemId: pendingCabinetAction.itemId,
            quantity: pendingCabinetAction.quantity,
            operatorNo: operator.empWorkNo,
            operatorName: operator.empName,
          })
          pendingCabinetActions.delete(event.sender.id)
          const finalText = summarizeCabinetResult(typeof result === 'string' ? result : JSON.stringify(result), pendingCabinetAction)
          win.webContents.send(channel, finalText)
          win.webContents.send(channel, '[DONE]')
          return finalText
        }

        pendingCabinetActions.delete(event.sender.id)
      }

      const {
        ChatOpenAI,
        HumanMessage,
        AIMessage,
        SystemMessage,
        ToolMessage,
        DynamicStructuredTool,
        z,
      } = await loadLangChainModules()

      const skills = await getSkillInfos(isAuthenticated)
      const allowedSkills = new Map(skills.map(s => [s.name, s]))
      const availableSkillText = skills.length > 0
        ? skills.map(s => `- ${s.name}: ${s.description}`).join('\n')
        : '- (无可用技能)'

      const loadSkillTool = new DynamicStructuredTool({
        name: normalizeToolName('load_skill', new Set()),
        description: `Load a specialized skill by name. Available skills:\n${availableSkillText}`,
        schema: z.object({
          skillName: z.string().describe('Name of skill to load'),
        }),
        func: async (input: { skillName?: string }) => {
          const skillName = String(input?.skillName ?? '').trim()
          if (!skillName) return '技能名不能为空。'
          if (!allowedSkills.has(skillName)) return `技能不可用或无权限: ${skillName}`
          try {
            return await loadSkillContent(skillName)
          } catch (e: any) {
            return `技能加载失败(${skillName}): ${e?.message ?? String(e)}`
          }
        },
      })

      const runSkillTool = new DynamicStructuredTool({
        name: normalizeToolName('run_skill', new Set(['load_skill'])),
        description: 'Execute a loaded skill script with params.',
        schema: z.object({
          skillName: z.string().describe('Name of skill to execute'),
          params: z.record(z.any()).default({}).describe('参数对象'),
        }),
        func: async (input: { skillName?: string; params?: Record<string, unknown> }) => {
          const skillName = String(input?.skillName ?? '').trim()
          if (!skillName) return '技能名不能为空。'
          if (!allowedSkills.has(skillName)) return `技能不可用或无权限: ${skillName}`
          const params = input?.params && typeof input.params === 'object' ? { ...input.params } : {}
          if (operator?.empWorkNo && operator?.empName) {
            if (!params.operatorNo) params.operatorNo = operator.empWorkNo
            if (!params.operatorName) params.operatorName = operator.empName
          }
          if (skillName === 'open-cabinet') {
            const pending = createPendingCabinetAction(params, operator)
            if (pending) {
              pendingCabinetActions.set(event.sender.id, pending)
              return 'Pending cabinet operation saved. Ask the user to confirm before executing it. Do not call run_skill again for this operation until the user confirms.'
            }
            if (normalizeCabinetAction(params.action || params.command) && (params.itemId || params.id) && !params.quantity) {
              return 'Quantity is required before saving a pending cabinet operation. Ask the user how many items they need.'
            }
          }
          try {
            const result = await executeSkillScript(skillName, params)
            return typeof result === 'string' ? result : JSON.stringify(result)
          } catch (e: any) {
            return `技能执行失败(${skillName}): ${e?.message ?? String(e)}`
          }
        },
      })

      const setPendingCabinetActionTool = new DynamicStructuredTool({
        name: normalizeToolName('set_pending_cabinet_action', new Set(['load_skill', 'run_skill'])),
        description: 'Save a matched open-cabinet operation that is waiting for explicit user confirmation.',
        schema: z.object({
          skillName: z.literal('open-cabinet').describe('Must be open-cabinet'),
          action: z.enum(['borrow', 'receive', 'return']).describe('Cabinet operation to execute after confirmation'),
          itemId: z.union([z.string(), z.number()]).describe('Matched item id'),
          itemName: z.string().optional().describe('Matched item name'),
          quantity: z.number().positive().describe('Operation quantity. Required; ask the user first if missing.'),
        }),
        func: async (input: Record<string, unknown>) => {
          const pending = createPendingCabinetAction(input, operator)
          if (!pending) return 'Invalid pending cabinet operation. Missing action, itemId, or positive quantity. Ask the user for the missing value before saving.'
          pendingCabinetActions.set(event.sender.id, pending)
          return 'Pending cabinet operation saved. Ask the user to confirm.'
        },
      })

      const tools = [loadSkillTool, runSkillTool, setPendingCabinetActionTool]

      const llm = new ChatOpenAI({
        model,
        apiKey: key || 'EMPTY_KEY',
        temperature: 0.2,
        configuration: { baseURL: url },
      })

      const modelWithTools = tools.length > 0 ? llm.bindTools(tools) : llm
      const skillsBlock = await buildSkillsSystemPrompt(isAuthenticated)
      const systemPrompt = buildSystemPrompt(skillsBlock, operator)

      const lcMessages: any[] = [new SystemMessage(systemPrompt)]
      for (const msg of messages) {
        if (!msg?.content) continue
        if (msg.role === 'user') lcMessages.push(new HumanMessage(msg.content))
        else if (msg.role === 'assistant') lcMessages.push(new AIMessage(msg.content))
      }

      let aiMessage = await modelWithTools.invoke(lcMessages)
      let loop = 0
      let hasSentSkillStatus = false
      while (loop < 6) {
        const toolCalls: Array<{ id?: string; name: string; args?: unknown }> =
          Array.isArray(aiMessage?.tool_calls) ? aiMessage.tool_calls : []
        if (toolCalls.length === 0) break

        lcMessages.push(aiMessage)

        for (const call of toolCalls) {
          const tool = tools.find(t => t.name === call.name)
          const args = call.args && typeof call.args === 'object'
            ? (call.args as Record<string, unknown>)
            : {}
          if ((call.name === 'load_skill' || call.name === 'run_skill') && !hasSentSkillStatus) {
            win.webContents.send(channel, '[SKILL_CALLING]')
            hasSentSkillStatus = true
          }

          let toolResult = ''
          if (!tool) {
            toolResult = `未找到可用工具: ${call.name}`
          } else {
            try {
              toolResult = await tool.invoke(args as Record<string, unknown>)
            } catch (e: any) {
              toolResult = `工具调用失败: ${e?.message ?? String(e)}`
            }
          }

          lcMessages.push(new ToolMessage({
            tool_call_id: call.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
            content: toolResult,
          }))
        }

        aiMessage = await modelWithTools.invoke(lcMessages)
        loop += 1
      }

      const finalText = toText(aiMessage?.content).trim() || '没有可返回的内容。'
      win.webContents.send(channel, finalText)
      win.webContents.send(channel, '[DONE]')
      return finalText
    } catch (e: any) {
      win.webContents.send(channel, `[LLM 错误] ${e?.message ?? String(e)}`)
      win.webContents.send(channel, '[DONE]')
      return `[LLM 错误] ${e?.message ?? String(e)}`
    }
  })
}
