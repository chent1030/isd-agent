import { ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'

export interface SkillManifest {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, { type: string; description: string }>
    required: string[]
  }
}

interface LoadedSkill {
  manifest: SkillManifest
  execute: (params: Record<string, unknown>) => Promise<string>
}

const skillsMap = new Map<string, LoadedSkill>()

export async function loadSkills() {
  skillsMap.clear()
  const skillsDir = path.join(process.cwd(), 'skills')
  if (!fs.existsSync(skillsDir)) return

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true })
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const manifestPath = path.join(skillsDir, entry.name, 'manifest.json')
    const indexPath = path.join(skillsDir, entry.name, 'index.js')
    if (!fs.existsSync(manifestPath) || !fs.existsSync(indexPath)) continue

    try {
      const manifest: SkillManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'))
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(indexPath)
      skillsMap.set(manifest.name, { manifest, execute: mod.execute })
      console.log(`[skills] loaded: ${manifest.name}`)
    } catch (e) {
      console.error(`[skills] failed to load ${entry.name}:`, e)
    }
  }
}

/** 返回所有 skill 的 manifest（供前端展示） */
export function getSkillManifests(): SkillManifest[] {
  return Array.from(skillsMap.values()).map(s => s.manifest)
}

/** 返回标准 tool_use 格式，直接注入 LLM messages */
export function getSkillsAsTools() {
  return Array.from(skillsMap.values()).map(s => ({
    name: s.manifest.name,
    description: s.manifest.description,
    input_schema: s.manifest.parameters,
  }))
}

/** 执行指定 skill */
export async function executeSkill(name: string, params: Record<string, unknown>): Promise<string> {
  const skill = skillsMap.get(name)
  if (!skill) throw new Error(`Skill not found: ${name}`)
  return skill.execute(params)
}

export function registerSkillHandlers() {
  ipcMain.handle('skills:list', () => getSkillManifests())

  ipcMain.handle('skills:execute', async (_e, { name, params }: { name: string; params: Record<string, unknown> }) => {
    return executeSkill(name, params)
  })
}
