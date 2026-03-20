import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface SkillInfo {
  name: string
  description: string
  requiresAuth: boolean
  location: string   // SKILL.md 绝对路径
  content: string    // frontmatter 之后的 markdown 正文
  scriptsDir: string | null // scripts/ 目录路径（如存在）
}

// instance 级缓存
const skillsMap = new Map<string, SkillInfo>()
let loadTask: Promise<void> | null = null

async function load() {
  skillsMap.clear()
  const skillsDir = path.join(process.cwd(), 'skills')
  if (!fs.existsSync(skillsDir)) return

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const skillMdPath = path.join(skillsDir, entry.name, 'SKILL.md')
    if (!fs.existsSync(skillMdPath)) continue

    try {
      const raw = fs.readFileSync(skillMdPath, 'utf-8')
      const { data, content } = matter(raw)

      if (!data.name || !data.description) {
        console.warn(`[skills] skip ${entry.name}: missing name or description in frontmatter`)
        continue
      }

      const scriptsDir = path.join(skillsDir, entry.name, 'scripts')
      const skill: SkillInfo = {
        name: data.name,
        description: data.description,
        requiresAuth: data.requiresAuth !== false, // 默认需要认证
        location: skillMdPath,
        content: content.trim(),
        scriptsDir: fs.existsSync(scriptsDir) ? scriptsDir : null,
      }

      if (skillsMap.has(skill.name)) {
        console.warn(`[skills] duplicate skill name "${skill.name}", overwriting`)
      }
      skillsMap.set(skill.name, skill)
      console.log(`[skills] loaded: ${skill.name}`)
    } catch (e) {
      console.error(`[skills] failed to load ${entry.name}:`, e)
    }
  }
}

/** 懒加载，single-flight */
async function ensure() {
  if (skillsMap.size > 0) return
  if (!loadTask) {
    loadTask = load().catch(e => {
      console.error('[skills] load failed:', e)
      loadTask = null // 允许重试
    })
  }
  await loadTask
}

/** 启动时主动加载 */
export async function loadSkills() {
  await load()
}

/** 返回所有 skill 信息（供前端展示） */
export async function getSkillInfos(isAuthenticated: boolean): Promise<SkillInfo[]> {
  await ensure()
  return Array.from(skillsMap.values()).filter(s => !s.requiresAuth || isAuthenticated)
}

/**
 * 构建注入 LLM system prompt 的 <available_skills> 块
 * 只暴露名称和描述，不注入完整正文（按需加载）
 */
export async function buildSkillsSystemPrompt(isAuthenticated: boolean): Promise<string> {
  await ensure()
  const available = Array.from(skillsMap.values()).filter(s => !s.requiresAuth || isAuthenticated)
  if (available.length === 0) return ''

  const lines = available.map(s => `- ${s.name}: ${s.description}`).join('\n')
  return `<available_skills>\n${lines}\n</available_skills>`
}

/**
 * 按需加载单个 skill 完整内容，注入 LLM 上下文
 * 返回 <skill_content> 块，包含正文 + scripts 文件列表
 */
export async function loadSkillContent(name: string): Promise<string> {
  await ensure()
  const skill = skillsMap.get(name)
  if (!skill) throw new Error(`Skill not found: ${name}`)

  let block = `<skill_content name="${skill.name}">\n${skill.content}\n`

  if (skill.scriptsDir) {
    const files = fs.readdirSync(skill.scriptsDir).slice(0, 10)
    block += `\n<skill_files base="${skill.scriptsDir}">\n${files.join('\n')}\n</skill_files>\n`
  }

  block += `</skill_content>`
  return block
}

/**
 * 执行 skill scripts/index.js（如存在）
 */
export async function executeSkillScript(name: string, params: Record<string, unknown>): Promise<string> {
  await ensure()
  const skill = skillsMap.get(name)
  if (!skill) throw new Error(`Skill not found: ${name}`)
  if (!skill.scriptsDir) throw new Error(`Skill "${name}" has no scripts directory`)

  const indexPath = path.join(skill.scriptsDir, 'index.js')
  if (!fs.existsSync(indexPath)) throw new Error(`Skill "${name}" has no scripts/index.js`)

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require(indexPath)
  return mod.execute(params)
}

export function registerSkillHandlers() {
  // 前端获取 skill 列表（展示用）
  ipcMain.handle('skills:list', async (_e, { isAuthenticated }: { isAuthenticated: boolean }) => {
    return getSkillInfos(isAuthenticated)
  })

  // 按需加载 skill 完整内容（LLM 调用时）
  ipcMain.handle('skills:load', async (_e, { name }: { name: string }) => {
    return loadSkillContent(name)
  })

  // 执行 skill scripts
  ipcMain.handle('skills:execute', async (_e, { name, params }: { name: string; params: Record<string, unknown> }) => {
    return executeSkillScript(name, params)
  })
}
